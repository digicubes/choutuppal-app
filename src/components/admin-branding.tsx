'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'
import { toast } from 'sonner'

export default function AdminBranding() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<any>({
    appName: '',
    primaryLogoUrl: '',
    pwaIconUrl: '',
    supportPhone: '',
    supportEmail: '',
    contactAddress: '',
    facebookUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    metaTitle: '',
    metaDescription: '',
    ogImageUrl: '',
    pwaPromptText: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings({ 
          ...settings, 
          ...data,
          primaryLogoUrl: data.logoUrl || ''
        })
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSettings((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      const resData = await res.json()
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to save settings')
      }
      toast.success('Settings updated successfully!')
    } catch (error: any) {
      toast.error('Save Failed: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setSaving(true)
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true
      })
      
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
      const { error } = await supabase.storage.from('listing-images').upload(fileName, compressedFile)
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(fileName)
      
      setSettings((prev: any) => ({ ...prev, [field]: publicUrl }))
      toast.success('Image uploaded successfully!')
    } catch (error: any) {
      console.error(error)
      toast.error('Upload Failed: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteImage = (field: string) => {
    if (!confirm('Are you sure you want to remove this image?')) return
    setSettings((prev: any) => ({ ...prev, [field]: '' }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Branding & Settings</h2>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (Forms) */}
        <div className="md:col-span-2 space-y-6">
          {/* App Identity & PWA */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">App Identity & PWA</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">App Name</label>
                <Input name="appName" value={settings.appName || ''} onChange={handleChange} className="mt-1" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Primary Logo</label>
                  <div className="mt-1 flex items-center gap-3">
                    {settings.primaryLogoUrl ? (
                      <div className="relative border p-2 rounded-lg bg-gray-50 flex items-center justify-center w-16 h-16">
                        <img src={settings.primaryLogoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                        <button type="button" onClick={() => handleDeleteImage('primaryLogoUrl')} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full hover:bg-red-200">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                        <Upload className="w-5 h-5 mb-1" />
                      </div>
                    )}
                    <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'primaryLogoUrl')} disabled={saving} className="flex-1" />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">PWA Icon (192x192)</label>
                  <div className="mt-1 flex items-center gap-3">
                    {settings.pwaIconUrl ? (
                      <div className="relative border p-2 rounded-lg bg-gray-50 flex items-center justify-center w-16 h-16">
                        <img src={settings.pwaIconUrl} alt="PWA Icon" className="max-w-full max-h-full object-contain" />
                        <button type="button" onClick={() => handleDeleteImage('pwaIconUrl')} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full hover:bg-red-200">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                        <Upload className="w-5 h-5 mb-1" />
                      </div>
                    )}
                    <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'pwaIconUrl')} disabled={saving} className="flex-1" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">PWA Custom Banner Text</label>
                <Input name="pwaPromptText" value={settings.pwaPromptText || ''} onChange={handleChange} className="mt-1" placeholder="Install our app for a better experience" />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Contact Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Support Phone</label>
                <Input name="contactPhone" value={settings.contactPhone || ''} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Support Email</label>
                <Input type="email" name="supportEmail" value={settings.supportEmail || ''} onChange={handleChange} className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Office Address</label>
                <Input name="contactAddress" value={settings.contactAddress || ''} onChange={handleChange} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Social Links</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Facebook URL</label>
                <Input name="facebookUrl" value={settings.facebookUrl || ''} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Instagram URL</label>
                <Input name="instagramUrl" value={settings.instagramUrl || ''} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">YouTube URL</label>
                <Input name="youtubeUrl" value={settings.youtubeUrl || ''} onChange={handleChange} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Global SEO & Sharing */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Global SEO & Sharing</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Share Title (Meta Title)</label>
                <Input name="metaTitle" value={settings.metaTitle || ''} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Share Description</label>
                <textarea 
                  name="metaDescription" 
                  value={settings.metaDescription || ''} 
                  onChange={handleChange} 
                  className="mt-1 w-full min-h-[80px] p-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Open Graph Image (OG Image)</label>
                <div className="mt-1 flex items-center gap-3">
                  {settings.ogImageUrl ? (
                    <div className="relative border p-2 rounded-lg bg-gray-50 flex items-center justify-center w-24 h-16">
                      <img src={settings.ogImageUrl} alt="OG" className="max-w-full max-h-full object-cover" />
                      <button type="button" onClick={() => handleDeleteImage('ogImageUrl')} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full hover:bg-red-200">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                      <Upload className="w-5 h-5 mb-1" />
                    </div>
                  )}
                  <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'ogImageUrl')} disabled={saving} className="flex-1" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Preview) */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
            <h3 className="font-semibold text-gray-900 mb-4">Theme Preview</h3>
            
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-md">
              {/* App Header Preview */}
              <div className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#D4AF37] p-4 text-white">
                <div className="flex items-center gap-2">
                  {settings.primaryLogoUrl ? (
                    <img src={settings.primaryLogoUrl} alt="Logo" className="w-8 h-8 rounded bg-white p-1" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-white/20" />
                  )}
                  <span className="font-bold">{settings.appName || 'App Name'}</span>
                </div>
              </div>
              
              {/* App Content Preview */}
              <div className="bg-gray-50 p-4 h-48 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#4169E1] to-[#D4AF37] rounded-full mb-3 flex items-center justify-center shadow-lg">
                  {settings.pwaIconUrl && <img src={settings.pwaIconUrl} alt="Icon" className="w-10 h-10 object-contain drop-shadow-md" />}
                </div>
                <h4 className="font-bold text-gray-800">{settings.appName || 'Your App'}</h4>
                <p className="text-xs text-gray-500 mt-1 px-4">{settings.metaDescription || 'Your app description will appear here...'}</p>
              </div>

              {/* Install Banner Preview */}
              {settings.pwaPromptText && (
                <div className="bg-[#4169E1]/10 border-t border-[#4169E1]/20 p-3 text-center">
                  <p className="text-xs text-[#4169E1] font-semibold">{settings.pwaPromptText}</p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Color Palette (Strict)</h4>
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-full bg-[#1E3A8A] shadow-sm border border-gray-100" title="Dark Blue" />
                <div className="w-10 h-10 rounded-full bg-[#2563EB] shadow-sm border border-gray-100" title="Primary Blue" />
                <div className="w-10 h-10 rounded-full bg-[#4169E1] shadow-sm border border-gray-100" title="Accent Blue" />
                <div className="w-10 h-10 rounded-full bg-[#D4AF37] shadow-sm border border-gray-100" title="Gold" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
