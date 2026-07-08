'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { deleteMyAccount } from '@/app/actions/user-actions'
import { Loader2, UploadCloud, LogOut, ShieldAlert, Key, User as UserIcon, Lock, FileText, Image as ImageIcon, X } from 'lucide-react'
import { useSWRConfig } from 'swr'
import { useToast } from '@/hooks/use-toast'
import imageCompression from 'browser-image-compression'
import { format } from 'date-fns'

export default function ProfileSettings() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const { mutate } = useSWRConfig()
  
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [username, setUsername] = useState(user?.username || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsappNumber || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '')
  const [bio, setBio] = useState(user?.bio || '')
  
  const [coverImage, setCoverImage] = useState(user?.coverImage || '')
  
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  
  // Real-time username check
  useEffect(() => {
    if (!username || username === user?.username) {
      setUsernameStatus('idle')
      return
    }
    const delayDebounceFn = setTimeout(async () => {
      setUsernameStatus('checking')
      try {
        const res = await fetch(`/api/user/check-username?username=${encodeURIComponent(username)}`)
        const data = await res.json()
        if (data.error === 'Invalid format') {
          setUsernameStatus('invalid')
        } else if (data.available) {
          setUsernameStatus('available')
        } else {
          setUsernameStatus('taken')
        }
      } catch {
        setUsernameStatus('idle')
      }
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [username, user?.username])
  
  const [newPassword, setNewPassword] = useState('')
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [isPublic, setIsPublic] = useState(user?.isPublic ?? true)
  const [updatingPublic, setUpdatingPublic] = useState(false)
  const [stats, setStats] = useState({ posts: 0, listings: 0 })

  useEffect(() => {
    if (user?.id) {
      const fetchStats = async () => {
        const { count: postsCount } = await supabase.from('Post').select('id', { count: 'exact', head: true }).eq('authorId', user.id).eq('isDeleted', false)
        const { count: listingsCount } = await supabase.from('Listing').select('id', { count: 'exact', head: true }).eq('userId', user.id).eq('status', 'APPROVED')
        const { data: userData } = await supabase.from('User').select('isPublic').eq('id', user.id).single()
        if (userData) setIsPublic(userData.isPublic)
        setStats({ posts: postsCount || 0, listings: listingsCount || 0 })
      }
      fetchStats()
    }
  }, [user?.id])

  const handleTogglePublic = async () => {
    if (!user) return
    const newValue = !isPublic
    setIsPublic(newValue)
    setUpdatingPublic(true)
    try {
      const { error } = await supabase.from('User').update({ isPublic: newValue }).eq('id', user.id)
      if (error) throw error
      toast({ title: 'Privacy Updated', description: `Your account is now ${newValue ? 'public' : 'private'}.` })
    } catch (err: any) {
      setIsPublic(!newValue) // Revert on error
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setUpdatingPublic(false)
    }
  }

  const profileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file || !user) {
      toast({ title: 'Error', description: 'No file selected', variant: 'destructive' });
      return;
    }
    
    setUpdatingProfile(true);
    toast({ title: 'Uploading...', description: 'Please wait' });
    try {
      const compressedFile = await imageCompression(file, { maxSizeMB: 0.5 });
      const fileName = `avatars/${type}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
      const bucket = 'listing-images'; // Using listing-images bucket as a fallback
      
      console.log(`Uploading to bucket: ${bucket}, fileName: ${fileName}`);
      // SUPABASE RLS CHECK: Please ensure Supabase Dashboard -> Storage -> avatars (and covers) bucket -> Policies has a policy:
      // ALLOW INSERT FOR authenticated USING (true) WITH CHECK (true)
      const { data, error } = await supabase.storage.from(bucket).upload(fileName, compressedFile, { upsert: false });
      
      if (error) {
        toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
        return;
      }
      
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      const publicUrl = urlData.publicUrl;
      
      // Update state immediately
      if (type === 'profile') {
        setAvatarUrl(publicUrl);
      } else {
        setCoverImage(publicUrl);
      }
      toast({ title: 'Success', description: 'Image uploaded! Click Save Changes to apply.' });
    } catch (err: any) {
      toast({ title: 'Error uploading file', description: err.message, variant: 'destructive' });
    } finally {
      setUpdatingProfile(false);
      e.target.value = '';
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!fullName.trim()) {
      toast({ title: 'Error', description: 'దయచేసి పేరు నమోదు చేయండి (Please enter your name)', variant: 'destructive' })
      return
    }

    setUpdatingProfile(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          username: username || null,
          phone,
          whatsappNumber,
          bio,
          avatarUrl,
          coverImage
        })
      })
      if (!res.ok) throw new Error('Failed to update profile')
      
      // Tell SWR to revalidate everything to instantly update the UI
      await mutate(
        () => true,
        undefined,
        { revalidate: true }
      )
      // Also refresh Supabase session to update auth context
      await supabase.auth.refreshSession()
      
      toast({ title: 'Success', description: 'Profile updated successfully!' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setUpdatingProfile(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setNewPassword('')
      toast({ title: 'Success', description: 'Password changed successfully!' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setUpdatingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    const confirmed = window.confirm(
      "DANGER: Are you absolutely sure you want to permanently delete your account? This action cannot be undone and you will lose all your data."
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      const res = await deleteMyAccount(user.id)
      if (res.success) {
        toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' })
        await logout()
      } else {
        throw new Error(res.error)
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete account', variant: 'destructive' })
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-24">
      {/* Cover Photo & Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group/cover">
        <div className="h-32 sm:h-40 bg-gradient-to-r from-blue-600 to-yellow-500 w-full relative">
          {coverImage && (
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
          )}
          {coverImage && (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setCoverImage(''); toast({ title: 'Cover removed', description: 'Click Save Changes to apply' }) }} 
              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow hover:bg-red-600 z-20"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div onClick={() => coverInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity cursor-pointer">
            <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm text-white font-medium flex items-center gap-2">
              <UploadCloud className="w-4 h-4" /> Change Cover
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'cover')} disabled={updatingProfile} />
          </div>
        </div>
        <div className="px-4 sm:px-6 relative pb-6">
          <div className="flex justify-between items-end">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white bg-white shadow-md relative z-10 shrink-0 -mt-12 sm:-mt-14 group flex items-center justify-center">
              <div className="w-full h-full rounded-full overflow-hidden relative cursor-pointer" onClick={() => profileInputRef.current?.click()}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600">
                    {fullName?.[0] || 'U'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <UploadCloud className="w-6 h-6 text-white" />
                </div>
              </div>
              
              {avatarUrl && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setAvatarUrl(''); toast({ title: 'Avatar removed', description: 'Click Save Changes to apply' }) }} 
                  className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600 z-20"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'profile')} disabled={updatingProfile} />
            </div>
            
            {/* Public Toggle */}
            <div className="flex flex-col items-end gap-1 mb-2">
              <span className="text-sm font-bold text-gray-700 flex items-center gap-1">
                {isPublic ? <UserIcon className="w-4 h-4" /> : <Lock className="w-4 h-4" />} 
                {isPublic ? 'Public Profile' : 'Private Account'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isPublic} onChange={handleTogglePublic} disabled={updatingPublic} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          
          <div className="mt-3">
            <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
            <p className="text-sm text-gray-500 mt-1">
              @{user?.username || user?.id?.substring(0, 8)} • Member since {format(new Date(), 'MMM yyyy')}
            </p>
            {bio && (
              <p className="mt-4 text-gray-800 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                {bio}
              </p>
            )}
            
            {/* Stats Row */}
            <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span className="font-bold text-gray-900">{stats.posts}</span> Posts
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ImageIcon className="w-4 h-4" />
                <span className="font-bold text-gray-900">{stats.listings}</span> Listings
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 font-bold text-gray-900">
          <UserIcon className="w-5 h-5 text-blue-600" /> Personal Information
        </div>
        <form onSubmit={handleUpdateProfile} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} 
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="custom_username"
              />
            </div>
            {usernameStatus === 'checking' && <p className="text-xs text-blue-500 mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Checking availability...</p>}
            {usernameStatus === 'available' && <p className="text-xs text-green-500 mt-1 font-semibold">Username is available!</p>}
            {usernameStatus === 'taken' && <p className="text-xs text-red-500 mt-1 font-semibold">Username is already taken.</p>}
            {usernameStatus === 'invalid' && <p className="text-xs text-red-500 mt-1 font-semibold">Only lowercase letters, numbers, and underscores.</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number (Optional)</label>
              <input type="tel" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 9876543210" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell the community about yourself..." className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>
          <button type="submit" disabled={updatingProfile || usernameStatus === 'taken' || usernameStatus === 'invalid'} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition flex justify-center items-center gap-2 disabled:opacity-50">
            {updatingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 font-bold text-gray-900">
          <Key className="w-5 h-5 text-orange-500" /> Change Password
        </div>
        <form onSubmit={handleUpdatePassword} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={updatingPassword} className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition flex justify-center items-center gap-2 disabled:opacity-50">
            {updatingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden mt-8">
        <div className="p-4 border-b border-red-100 flex items-center gap-2 font-bold text-red-600 bg-red-50">
          <ShieldAlert className="w-5 h-5" /> Danger Zone
        </div>
        <div className="p-5 space-y-4">
          <button onClick={logout} className="w-full flex items-center justify-center p-3 border-2 border-gray-200 hover:bg-gray-50 rounded-xl transition text-gray-700 font-bold gap-2">
            <LogOut className="w-5 h-5" /> Log Out
          </button>
          
          <div className="pt-4 mt-4 border-t border-red-100">
            <p className="text-sm text-red-600 mb-3 text-center">Permanently remove your account and all data.</p>
            <button onClick={handleDeleteAccount} disabled={deleting} className="w-full flex items-center justify-center p-3 bg-red-500 hover:bg-red-600 rounded-xl transition text-white font-bold gap-2 disabled:opacity-50">
              {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
