'use client'

import { useState, useCallback, useEffect } from 'react'
import { X, Send, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────
interface StoryCreatorProps {
  isOpen: boolean
  onClose: () => void
  cityId: string
  userId: string
  onStoryCreated: () => void
  preselectedFile?: File | null
}

// ─── Component ────────────────────────────────────────────────────
export default function StoryCreator({
  isOpen,
  onClose,
  cityId,
  userId,
  onStoryCreated,
  preselectedFile,
}: StoryCreatorProps) {
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [ctaLink, setCtaLink] = useState('')
  const [posting, setPosting] = useState(false)

  // Load the preselected file if available
  useEffect(() => {
    if (isOpen && preselectedFile) {
      const url = URL.createObjectURL(preselectedFile)
      setMediaFile(preselectedFile)
      setMediaPreview(url)
      
      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [isOpen, preselectedFile])

  // Reset state whenever the modal closes
  useEffect(() => {
    if (!isOpen) {
      setMediaPreview(null)
      setMediaFile(null)
      setCaption('')
      setCtaLink('')
      setPosting(false)
    }
  }, [isOpen])

  // Post the story
  const handlePost = useCallback(async () => {
    if (!mediaFile || posting) return
    if (!userId) {
      toast.error('Please login to post a story')
      window.location.href = '/login'
      return
    }

    setPosting(true)
    try {
      let finalFile = mediaFile

      // Strict compression to 500KB
      if (mediaFile.type.startsWith('image/')) {
        try {
          const imageCompression = (await import('browser-image-compression')).default
          const options = {
            maxSizeMB: 0.5, // 500KB strict
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            initialQuality: 0.8
          }
          finalFile = await imageCompression(mediaFile, options)
        } catch (compressErr) {
          console.warn('Image compression failed, using original file', compressErr)
        }
      }

      // Generate a unique file path in storage
      const fileExt = mediaFile.name.split('.').pop() || 'jpg'
      const fileName = `story-${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      // Upload to Supabase Storage - ONLY to 'stories' bucket
      const { supabase } = await import('@/lib/supabase')
      
      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(filePath, finalFile, { cacheControl: '3600', upsert: true })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Retrieve the public URL
      const { data: urlData } = supabase.storage
        .from('stories')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded story media')
      }

      const mediaUrl = urlData.publicUrl

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          cityId,
          text: caption.trim() || null,
          ctaLink: ctaLink.trim() || null,
          mediaType: mediaFile.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
          mediaUrl,
          musicId: null,
          musicName: null,
          isPremium: false,
        }),
      })

      if (res.ok) {
        toast.success('Story posted!')
        onStoryCreated()
        onClose()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to post story')
        setPosting(false)
      }
    } catch (err: any) {
      console.error('Story post error:', err)
      toast.error(err.message || 'Something went wrong')
      setPosting(false)
    }
  }, [mediaFile, posting, caption, ctaLink, userId, cityId, onStoryCreated, onClose])

  return (
    <AnimatePresence>
      {isOpen && mediaPreview && (
        <motion.div
          key="story-creator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[99999] bg-black flex flex-col"
        >
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center px-4 pt-4 pb-10 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
            <button
              className="pointer-events-auto p-2 rounded-full hover:bg-white/10 transition-colors"
              onClick={onClose}
              aria-label="Cancel"
            >
              <X className="w-7 h-7 text-white" />
            </button>
          </div>

          {/* Media Preview - WhatsApp Style (Object Contain) */}
          <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative pb-32">
            {mediaFile?.type.startsWith('video/') ? (
              <video
                src={mediaPreview}
                className="w-full h-full object-contain"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={mediaPreview}
                alt="Story preview"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Bottom Input Area - Strictly below image in gradient wrapper */}
          <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-12 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col gap-3 pointer-events-auto">
            {/* Optional CTA Link input */}
            <div className="w-full max-w-lg mx-auto">
              <input
                type="url"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                placeholder="Add Call-to-Action Link (Optional URL)..."
                className="w-full bg-black/60 backdrop-blur-md border border-white/20 text-white placeholder:text-white/40 rounded-xl py-2 px-4 outline-none text-xs font-semibold focus:border-[#4169E1] transition-all"
              />
            </div>

            <div className="flex items-center gap-3 w-full max-w-lg mx-auto">
              {/* Caption Input */}
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                maxLength={200}
                className="flex-1 bg-black/60 backdrop-blur-md border border-white/25 text-white placeholder:text-white/60 rounded-full py-3 px-5 outline-none text-sm focus:border-white/60 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handlePost()
                  }
                }}
              />

              {/* Send Button */}
              <button
                onClick={handlePost}
                disabled={posting}
                className="flex-shrink-0 w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#20c25e] active:bg-[#1dae55] transition-colors flex items-center justify-center shadow-lg shadow-black/40 disabled:opacity-70"
                aria-label="Post story"
              >
                {posting ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Send className="w-5 h-5 text-white translate-x-0.5 -translate-y-0.5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
