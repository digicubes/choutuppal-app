'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Image as ImageIcon, UploadCloud } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import useSWR from 'swr'

const RichTextEditor = dynamic(() => import('@/components/rich-text-editor').then(mod => mod.RichTextEditor), { ssr: false })

export function AgentBlogForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch agent profile to get their cityId
  const { data: profile } = useSWR(user?.id ? `/api/agent/profile?userId=${user.id}` : null, async (url) => {
    const res = await supabase.from('User').select('agentCityId').eq('id', user!.id).single()
    return res.data
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      toast.loading('Uploading image...', { id: 'upload-blog' })
      const { default: imageCompression } = await import('browser-image-compression')
      const compressedFile = await imageCompression(file, { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true })
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
      const { error } = await supabase.storage.from('listing-images').upload(`blogs/${fileName}`, compressedFile)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(`blogs/${fileName}`)
      
      setCoverImageUrl(publicUrl)
      toast.success('Image uploaded successfully!', { id: 'upload-blog' })
    } catch (error) {
      console.error("Upload error:", error)
      toast.error('Failed to upload image', { id: 'upload-blog' })
    }
  }

  const handleSubmit = async () => {
    if (!title) return toast.error('Title is required')
    if (!content) return toast.error('Content is required')
    
    setLoading(true)
    try {
      const cityId = profile?.agentCityId || 'temp'
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()

      const payload = {
        title,
        slug,
        content,
        coverImageUrl,
        cityId,
        isPublished: true, // Agent submissions are automatically APPROVED
      }
      
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success('Blog posted successfully! It is now live.')
        setTitle('')
        setContent('')
        setCoverImageUrl('')
        onSuccess()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to post blog')
      }
    } catch (err) {
      console.error(err)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Blog Title</label>
        <Input placeholder="Enter blog title..." value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 bg-gray-50 border-gray-200" />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Cover Image</label>
        <div className="flex items-center gap-4">
          <div className="relative w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center">
            {coverImageUrl ? (
              <Image src={coverImageUrl} alt="Cover" fill className="object-cover" />
            ) : (
              <ImageIcon className="text-gray-400 size-8" />
            )}
          </div>
          <div className="flex-1">
            <label className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors w-max">
              <UploadCloud className="size-5 text-[#4169E1]" />
              <span className="font-semibold text-gray-700">Upload Cover</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={loading} />
            </label>
            <p className="text-sm text-gray-500 mt-2">Recommended: 1200x630px. Max 5MB.</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Blog Content</label>
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <RichTextEditor content={content} onChange={setContent} />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-end">
        <Button onClick={handleSubmit} disabled={loading} className="bg-[#4169E1] hover:bg-blue-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg">
          {loading ? 'Posting...' : 'Post Blog'}
        </Button>
      </div>
    </div>
  )
}
