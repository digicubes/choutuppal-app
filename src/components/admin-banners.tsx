'use client'

import { useState, useEffect, useRef } from 'react'
import { getAdminBanners, deleteAdminBanner } from '@/app/actions/admin-actions'
import { Loader2, Trash2, Calendar, Link as LinkIcon, Building2, UploadCloud, Plus, X, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminBanners() {
  const [banners, setBanners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchBanners()
  }, [])

  async function fetchBanners() {
    setLoading(true)
    try {
      const data = await getAdminBanners()
      setBanners(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true }
      try {
        const compressedFile = await imageCompression(file, options)
        setImageFile(compressedFile)
        setImagePreview(URL.createObjectURL(compressedFile))
      } catch (err) {
        toast.error('Failed to compress image')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !imageFile) {
      toast.error('Title and Image are required')
      return
    }
    
    setIsUploading(true)
    const toastId = toast.loading('Uploading banner...')
    
    try {
      const fileName = `banners/${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(fileName, imageFile, { cacheControl: '3600', upsert: false })
        
      if (uploadError) throw new Error('Image upload failed: ' + uploadError.message)
      
      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName)
        
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          linkUrl,
          imageUrl: publicUrl,
          isActive: true
        })
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create banner')
      }
      
      toast.success('Banner created successfully (24-hour expiry set)!', { id: toastId })
      setShowForm(false)
      setTitle('')
      setLinkUrl('')
      setImageFile(null)
      setImagePreview('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchBanners()
    } catch (error: any) {
      toast.error(error.message, { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner? This action cannot be undone.')) return
    try {
      await deleteAdminBanner(id)
      fetchBanners()
      toast.success('Banner deleted')
    } catch (error) {
      toast.error('Error deleting banner')
    }
  }

  if (loading && banners.length === 0) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Banner Management</h2>
          <p className="text-sm text-gray-500">Banners automatically expire 24 hours after creation.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"} className={!showForm ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}>
          {showForm ? <><X className="w-4 h-4 mr-2" /> Cancel</> : <><Plus className="w-4 h-4 mr-2" /> Add Banner</>}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banner Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., Diwali Mega Sale"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Link (Optional)</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="https://example.com/offer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition ${imagePreview ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'}`}
              >
                {imagePreview ? (
                  <img loading="lazy" decoding="async" src={imagePreview} alt="Preview" className="max-h-48 object-contain rounded-lg" />
                ) : (
                  <>
                    <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Click to upload image</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB (Will be compressed)</p>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            <Button type="submit" disabled={isUploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6">
              {isUploading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading...</> : <><Send className="w-5 h-5 mr-2" /> Publish Banner (24h Expiry)</>}
            </Button>
          </form>
        </div>
      )}

      {banners.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500">
          No banners found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map(banner => {
            const isExpired = banner.expiresAt ? new Date(banner.expiresAt) < new Date() : false;
            return (
              <div key={banner.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col ${isExpired ? 'opacity-60 grayscale' : ''}`}>
                <div className="aspect-[21/9] bg-gray-100 relative">
                  {banner.imageUrl ? (
                    <img loading="lazy" decoding="async" src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
                    <Badge variant={banner.isActive && !isExpired ? 'default' : 'secondary'} className={banner.isActive && !isExpired ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {banner.isActive ? (isExpired ? 'Expired' : 'Active') : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-900 line-clamp-1 text-lg mb-1">{banner.title}</h3>
                  
                  <div className="space-y-2 mt-2 flex-1">
                    {banner.linkUrl && (
                      <div className="flex items-center text-sm text-gray-600">
                        <LinkIcon className="w-4 h-4 mr-2 text-gray-400" />
                        <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline line-clamp-1">
                          {banner.linkUrl}
                        </a>
                      </div>
                    )}
                    {banner.expiresAt && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        Expires: {new Date(banner.expiresAt).toLocaleString()}
                      </div>
                    )}
                  </div>
  
                  <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDelete(banner.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
