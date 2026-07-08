'use client'
import { supabase } from '@/lib/supabase'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2, Image as ImageIcon, Film, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { IMAGE_GUIDELINES, validateImage, validateImageDimensions, getGuidelineHelperText } from '@/lib/image-guidelines'
import { SimpleImg } from '@/components/optimized-image'

interface MediaUploaderProps {
  /** Current value (URL string) */
  value?: string
  /** Callback when upload completes */
  onChange: (url: string) => void
  /** Guideline key for size recommendations: story, banner, listing, hero, news, logo, og */
  guideline?: string
  /** Cloudinary folder for organization */
  folder?: string
  /** Accept videos too? */
  acceptVideo?: boolean
  /** Allow multiple files? */
  multiple?: boolean
  /** Label for the uploader */
  label?: string
  /** Additional class */
  className?: string
}

export function MediaUploader({
  value,
  onChange,
  guideline = 'listing',
  folder = 'choutuppal/general',
  acceptVideo = false,
  multiple = false,
  label,
  className = '',
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [previewType, setPreviewType] = useState<'image' | 'video'>(value ? 'image' : 'image')
  const [dragActive, setDragActive] = useState(false)

  const guidelineInfo = IMAGE_GUIDELINES[guideline]

  const handleUpload = useCallback(async (file: File) => {
    // Validate file
    const validation = validateImage(file, guideline)
    if (validation.warnings.length > 0) {
      validation.warnings.forEach((w) => toast.warning(w))
    }

    let fileToUpload = file;
    // Auto compress if image
    if (file.type.startsWith('image/')) {
      try {
        const imageCompression = (await import('browser-image-compression')).default;
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 800,
          useWebWorker: true,
          initialQuality: 0.6,
        };
        fileToUpload = await imageCompression(file, options);
      } catch (error) {
        console.error('Compression error:', error);
      }
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(fileToUpload)
    setPreview(localUrl)
    setPreviewType(file.type.startsWith('video/') ? 'video' : 'image')

    // Check image dimensions
    if (file.type.startsWith('image/')) {
      const img = new window.Image()
      img.onload = () => {
        const dimValidation = validateImageDimensions(img.width, img.height, guideline)
        dimValidation.warnings.forEach((w) => toast.warning(w))
      }
      img.src = localUrl
    }

    // Upload to Cloudinary via our API
    setUploading(true)
    setProgress(10)

    try {
      const formData = new FormData()
      formData.append('file', fileToUpload)
      formData.append('folder', folder)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 15, 90))
      }, 500)

      const { data: uploadResult, error } = await supabase.storage
        .from('listing-images')
        .upload(`${folder}/${Date.now()}_${fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '')}`, fileToUpload, { cacheControl: '3600', upsert: false });

      clearInterval(progressInterval)

      if (error) {
        throw new Error('Upload failed')
      }

      const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(uploadResult.path);
      const data = { url: urlData.publicUrl };
      setProgress(100)

      // Clean up local blob URL and use Cloudinary URL
      URL.revokeObjectURL(localUrl)
      setPreview(data.url)
      onChange(data.url)
      toast.success('File uploaded successfully!')
    } catch (error) {
      URL.revokeObjectURL(localUrl)
      setPreview(value || null)
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [guideline, folder, onChange, value])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      if (multiple) {
        // Upload each file
        acceptedFiles.forEach((file) => handleUpload(file))
      } else {
        handleUpload(acceptedFiles[0])
      }
    }
  }, [handleUpload, multiple])

  const acceptTypes: Record<string, string[]> = acceptVideo
    ? { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'], 'video/mp4': ['.mp4'], 'video/webm': ['.webm'] }
    : { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptTypes,
    maxFiles: multiple ? 10 : 1,
    maxSize: acceptVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  })

  const handleRemove = () => {
    setPreview(null)
    onChange('')
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <ImageIcon className="size-3" />
          {label}
        </label>
      )}

      {/* Drop Zone */}
      {!preview ? (
        <div
          {...getRootProps()}
          className={`
            relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200
            ${isDragActive || dragActive
              ? 'border-[#D4AF37] bg-[#D4AF37]/5 scale-[1.02]'
              : 'border-gray-200 bg-white/30 hover:border-[#4169E1]/50 hover:bg-[#4169E1]/5'
            }
            p-6 text-center
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isDragActive ? 'bg-[#D4AF37]/10' : 'bg-gray-100'}`}>
              <Upload className={`size-5 ${isDragActive ? 'text-[#D4AF37]' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {isDragActive ? 'Drop file here' : 'Drag & drop or click to browse'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {acceptVideo ? 'JPG, PNG, WebP, MP4, WebM' : 'JPG, PNG, WebP'} • Max {acceptVideo ? '50MB' : '10MB'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          {/* Preview */}
          {previewType === 'video' ? (
            <video
              src={preview}
              className="w-full h-40 object-cover rounded-xl"
              controls
              muted
            />
          ) : (
            <SimpleImg
              src={preview}
              alt="Preview"
              className="w-full h-40 object-cover rounded-xl"
            />
          )}

          {/* Remove button */}
          {!uploading && (
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/90 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
            >
              <X className="size-3.5" />
            </button>
          )}

          {/* Upload progress overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center rounded-xl">
              <Loader2 className="size-8 text-white animate-spin mb-2" />
              <p className="text-white text-sm font-medium">Uploading...</p>
              <div className="w-32 h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-[#D4AF37] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guideline helper text */}
      {guidelineInfo && (
        <p className="text-xs text-gray-400 flex items-start gap-1">
          {preview ? (
            <>
              <Film className="size-3 mt-0.5 shrink-0" />
              {guidelineInfo.aspectRatio} — {guidelineInfo.description}
            </>
          ) : (
            <>
              <AlertTriangle className="size-3 mt-0.5 shrink-0" />
              Recommended: {getGuidelineHelperText(guideline)}
            </>
          )}
        </p>
      )}
    </div>
  )
}

/**
 * Multi-file uploader for listing galleries
 */
export function MultiMediaUploader({
  value = [],
  onChange,
  guideline = 'listing',
  folder = 'choutuppal/listings',
  maxFiles = 8,
  label = 'Gallery Images',
  className = '',
}: {
  value?: string[]
  onChange: (urls: string[]) => void
  guideline?: string
  folder?: string
  maxFiles?: number
  label?: string
  className?: string
}) {
  const [uploading, setUploading] = useState(false)
  const guidelineInfo = IMAGE_GUIDELINES[guideline]

  const handleUpload = useCallback(async (file: File) => {
    const validation = validateImage(file, guideline)
    if (validation.warnings.length > 0) {
      validation.warnings.forEach((w) => toast.warning(w))
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const { data: uploadResult, error } = await supabase.storage
        .from('listing-images')
        .upload(`${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`, file, { cacheControl: '3600', upsert: false });

      if (error) {
        throw new Error('Upload failed')
      }

      const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(uploadResult.path);
      const data = { url: urlData.publicUrl };
      onChange([...value, data.url])
      toast.success('Image uploaded!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [guideline, folder, onChange, value])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => handleUpload(file))
  }, [handleUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: maxFiles - value.length,
    maxSize: 10 * 1024 * 1024,
    disabled: uploading || value.length >= maxFiles,
  })

  const handleRemove = (index: number) => {
    const updated = value.filter((_, i) => i !== index)
    onChange(updated)
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
        <ImageIcon className="size-3" />
        {label}
        <span className="text-xs text-gray-400 ml-1">({value.length}/{maxFiles})</span>
      </label>

      {/* Image Previews Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {value.map((url, idx) => (
            <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
              <SimpleImg src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop Zone (only if under max) */}
      {value.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`
            cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 p-4 text-center
            ${isDragActive
              ? 'border-[#D4AF37] bg-[#D4AF37]/5'
              : 'border-gray-200 bg-white/30 hover:border-[#4169E1]/50 hover:bg-[#4169E1]/5'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-1">
            {uploading ? (
              <>
                <Loader2 className="size-5 text-[#D4AF37] animate-spin" />
                <p className="text-xs text-gray-500">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="size-5 text-gray-400" />
                <p className="text-xs text-gray-500">
                  {isDragActive ? 'Drop images here' : 'Click or drag to add images'}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Guideline text */}
      {guidelineInfo && (
        <p className="text-xs text-gray-400 flex items-start gap-1">
          <AlertTriangle className="size-3 mt-0.5 shrink-0" />
          Recommended: {guidelineInfo.aspectRatio} ({guidelineInfo.recommendedWidth}×{guidelineInfo.recommendedHeight}px) — {guidelineInfo.description}
        </p>
      )}
    </div>
  )
}
