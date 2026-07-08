'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, Loader2, Save, CheckCircle, Upload, Image as ImageIcon, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'
import { useToast } from '@/hooks/use-toast'

interface SiteSettingsForm {
  id?: string
  appName: string
  tagline: string
  supportEmail: string
  whatsappSupportNumber: string
  appLogoUrl: string
  faviconUrl: string
  metaTitle: string
  metaDescription: string
  facebookUrl: string
  instagramUrl: string
  youtubeUrl: string
  xUrl: string
}

export default function AdminSettings() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [settings, setSettings] = useState<SiteSettingsForm>({
    appName: '',
    tagline: '',
    supportEmail: '',
    whatsappSupportNumber: '',
    appLogoUrl: '',
    faviconUrl: '',
    metaTitle: '',
    metaDescription: '',
    facebookUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    xUrl: ''
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  const isAuthorized = user?.role === 'admin' || user?.role === 'super_admin'

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || !isAuthorized) {
      setLoading(false)
      return
    }

    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from('SiteSetting')
          .select('*')
          .limit(1)
          .maybeSingle()
        
        if (error) throw error

        if (data) {
          setSettings({
            id: data.id,
            appName: data.appName || '',
            tagline: data.tagline || '',
            supportEmail: data.supportEmail || '',
            whatsappSupportNumber: data.whatsappSupportNumber || '',
            appLogoUrl: data.appLogoUrl || '',
            faviconUrl: data.faviconUrl || '',
            metaTitle: data.metaTitle || '',
            metaDescription: data.metaDescription || '',
            facebookUrl: data.facebookUrl || '',
            instagramUrl: data.instagramUrl || '',
            youtubeUrl: data.youtubeUrl || '',
            xUrl: data.xUrl || ''
          })
        }
      } catch (error) {
        console.error('Error fetching app settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [isLoading, isAuthenticated, isAuthorized])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSettings(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setSuccess(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      if (type === 'logo') setUploadingLogo(true)
      else setUploadingFavicon(true)

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: type === 'favicon' ? 256 : 1024,
        useWebWorker: true
      }
      
      const compressedFile = await imageCompression(file, options)
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
      
      const { data, error } = await supabase.storage
        .from('branding')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(fileName)

      setSettings(prev => ({
        ...prev,
        [type === 'logo' ? 'appLogoUrl' : 'faviconUrl']: publicUrl
      }))

    } catch (error: any) {
      console.error('Supabase Upload Error Detailed:', error)
      toast({
        title: 'Upload failed',
        description: error?.message || 'An unknown error occurred during upload',
        variant: 'destructive',
      })
    } finally {
      if (type === 'logo') setUploadingLogo(false)
      else setUploadingFavicon(false)
    }
  }

  const handleSave = async () => {
    if (!isAuthorized) return
    setSaving(true)
    setSuccess(false)

    try {
      const payload = {
        appName: settings.appName,
        tagline: settings.tagline,
        supportEmail: settings.supportEmail,
        whatsappSupportNumber: settings.whatsappSupportNumber,
        appLogoUrl: settings.appLogoUrl,
        faviconUrl: settings.faviconUrl,
        metaTitle: settings.metaTitle,
        metaDescription: settings.metaDescription,
        facebookUrl: settings.facebookUrl,
        instagramUrl: settings.instagramUrl,
        youtubeUrl: settings.youtubeUrl,
        xUrl: settings.xUrl
      }

      if (settings.id) {
        const { error } = await supabase
          .from('SiteSetting')
          .update(payload)
          .eq('id', settings.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('SiteSetting')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        if (data) setSettings(prev => ({ ...prev, id: data.id }))
      }
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleClearCache = async () => {
    setIsClearing(true)
    try {
      const res = await fetch('/api/admin/revalidate', { method: 'POST' })
      if (res.ok) {
        toast({ title: 'Success', description: 'Cache cleared successfully!' })
      } else {
        toast({ title: 'Error', description: 'Failed to clear cache', variant: 'destructive' })
      }
    } catch (err) {
      console.error(err)
      toast({ title: 'Error', description: 'An error occurred while clearing cache', variant: 'destructive' })
    } finally {
      setIsClearing(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!isAuthenticated || !isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-2xl border border-red-100">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500 text-center max-w-sm">
          You do not have the required permissions to view or edit branding settings.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Enterprise Branding Dashboard</h2>
        <p className="text-gray-500 mt-1">Manage your app's global identity, SEO metadata, and social links.</p>
      </div>

      {/* 1. General Info */}
      <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">1. General Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">App Name</label>
            <input type="text" name="appName" value={settings.appName} onChange={handleChange} placeholder="e.g. Choutuppal App" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
            <input type="text" name="tagline" value={settings.tagline} onChange={handleChange} placeholder="e.g. Your Hyper-Local Hub" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Support Phone</label>
            <input type="text" name="whatsappSupportNumber" value={settings.whatsappSupportNumber} onChange={handleChange} placeholder="e.g. +91 9999999999" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Support Email</label>
            <input type="email" name="supportEmail" value={settings.supportEmail} onChange={handleChange} placeholder="e.g. support@example.com" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
        </div>
      </section>

      {/* 2. Assets & Branding */}
      <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">2. Assets & Branding</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">App Logo</label>
            <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={(e) => handleFileUpload(e, 'logo')} />
            <div className="mt-2 flex items-center gap-4">
              <div className="w-24 h-24 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden relative">
                {settings.appLogoUrl ? (
                  <img src={settings.appLogoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
              <button onClick={() => logoInputRef.current?.click()} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload Logo
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Favicon</label>
            <input type="file" accept="image/*" className="hidden" ref={faviconInputRef} onChange={(e) => handleFileUpload(e, 'favicon')} />
            <div className="mt-2 flex items-center gap-4">
              <div className="w-24 h-24 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden relative">
                {settings.faviconUrl ? (
                  <img src={settings.faviconUrl} alt="Favicon" className="w-full h-full object-contain p-4" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                )}
                {uploadingFavicon && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
              <button onClick={() => faviconInputRef.current?.click()} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload Favicon
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SEO & Meta Tags */}
      <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">3. SEO & Meta Tags</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Global SEO Meta Title</label>
            <input type="text" name="metaTitle" value={settings.metaTitle} onChange={handleChange} placeholder="e.g. Choutuppal App - Hyperlocal News & Services" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Global SEO Meta Description</label>
            <textarea name="metaDescription" value={settings.metaDescription} onChange={handleChange} rows={3} placeholder="e.g. Find the best local businesses, real estate, and daily news..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" />
          </div>
        </div>
      </section>

      {/* 4. Social Media Links */}
      <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">4. Social Media Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Facebook URL</label>
            <input type="url" name="facebookUrl" value={settings.facebookUrl} onChange={handleChange} placeholder="https://facebook.com/..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Instagram URL</label>
            <input type="url" name="instagramUrl" value={settings.instagramUrl} onChange={handleChange} placeholder="https://instagram.com/..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">YouTube URL</label>
            <input type="url" name="youtubeUrl" value={settings.youtubeUrl} onChange={handleChange} placeholder="https://youtube.com/..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">X (Twitter) URL</label>
            <input type="url" name="xUrl" value={settings.xUrl} onChange={handleChange} placeholder="https://x.com/..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
        </div>
      </section>

      {/* 5. System Maintenance */}
      <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">5. System Maintenance</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Cache Management</h4>
            <p className="text-xs text-gray-500 mt-1 mb-4">Clear the Next.js cache across the entire application to force all pages to re-fetch fresh data.</p>
            <button
              onClick={handleClearCache}
              disabled={isClearing}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isClearing ? 'animate-spin' : ''}`} />
              {isClearing ? 'Clearing Cache...' : 'Clear App Cache & Refresh'}
            </button>
          </div>
        </div>
      </section>

      {/* Save Action */}
      <div className="sticky bottom-6 flex items-center justify-between bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
        <div>
          {success && (
            <span className="flex items-center text-sm font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
              <CheckCircle className="w-4 h-4 mr-1.5" />
              All changes saved securely!
            </span>
          )}
        </div>
        <button onClick={handleSave} disabled={saving || uploadingLogo || uploadingFavicon} className="flex items-center px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
          {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  )
}
