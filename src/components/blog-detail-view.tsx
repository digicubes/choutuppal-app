'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, User, Globe as GlobeIcon, ArrowLeft, Share2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sanitizeHtml } from '@/lib/sanitize'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/glass-card'
import { useAppStore } from '@/lib/store'
import { OptimizedImage } from '@/components/optimized-image'
import { Skeleton } from '@/components/ui/skeleton'

interface BlogPost {
  id: string
  title: string
  slug: string
  coverImageUrl: string | null
  content: string | null
  authorId: string
  cityId: string | null
  isPublished: boolean
  createdAt: string
  author: { id: string; fullName: string }
  city: { id: string; name: string; slug: string } | null
}

const PLACEHOLDER_IMG = 'https://placehold.co/1200x675/D4AF37/ffffff?text=Blog+Article'

export default function BlogDetailView() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const selectedBlogSlug = useAppStore((s) => s.selectedBlogSlug)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const setSelectedBlogSlug = useAppStore((s) => s.setSelectedBlogSlug)
  const themePrimary = useAppStore((s) => s.themePrimary)
  const themeSecondary = useAppStore((s) => s.themeSecondary)
  const [blog, setBlog] = useState<BlogPost | null>(null)
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null)
  const [relatedBlogs, setRelatedBlogs] = useState<BlogPost[]>([])
  const [relatedLoadedSlug, setRelatedLoadedSlug] = useState<string | null>(null)

  // Derive loading from whether the current slug matches the loaded one
  const loading = selectedBlogSlug !== loadedSlug
  const relatedLoading = selectedBlogSlug !== relatedLoadedSlug

  // Fetch blog by slug
  useEffect(() => {
    if (!selectedBlogSlug) return
    let cancelled = false
    fetch(`/api/blogs?slug=${encodeURIComponent(selectedBlogSlug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (data && !data.error) {
          setBlog(Array.isArray(data) ? data[0] || null : data)
        } else {
          setBlog(null)
        }
        setLoadedSlug(selectedBlogSlug)
      })
      .catch(() => {
        if (!cancelled) {
          setBlog(null)
          setLoadedSlug(selectedBlogSlug)
        }
      })
    return () => { cancelled = true }
  }, [selectedBlogSlug])

  // Fetch related blogs
  useEffect(() => {
    let cancelled = false
    fetch('/api/blogs')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (Array.isArray(data)) {
          const filtered = data
            .filter((b: BlogPost) => b.slug !== selectedBlogSlug)
            .slice(0, 3)
          setRelatedBlogs(filtered)
        }
        setRelatedLoadedSlug(selectedBlogSlug)
      })
      .catch(() => {
        if (!cancelled) {
          setRelatedBlogs([])
          setRelatedLoadedSlug(selectedBlogSlug)
        }
      })
    return () => { cancelled = true }
  }, [selectedBlogSlug])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleShareWhatsApp = () => {
    if (!blog) return
    const text = `Check out this article: ${blog.title}`
    const url = window.location.href
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleRelatedClick = (slug: string) => {
    setSelectedBlogSlug(slug)
    navigateTo('blog-detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setSelectedBlogSlug(null)
    navigateTo('blog')
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Skeleton className="w-full aspect-video rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    )
  }

  // Not found
  if (!blog) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <GlobeIcon className="size-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Article Not Found</h2>
        <p className="text-gray-500 mb-6">The blog article you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Button
          onClick={handleBack}
          className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white font-semibold shadow-md"
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Blog
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Back button */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <Button
          variant="ghost"
          onClick={handleBack}
          className="rounded-xl text-gray-600 hover:text-gray-900 -ml-2"
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Blog
        </Button>
      </motion.div>

      {/* Cover Image */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full aspect-video overflow-hidden rounded-2xl md:rounded-3xl shadow-lg"
      >
        <OptimizedImage
          src={blog.coverImageUrl || PLACEHOLDER_IMG}
          alt={blog.title}
          fill
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* City badge overlay */}
        <div className="absolute top-4 right-4">
          {blog.city ? (
            <Badge
              className="text-xs font-semibold border-none shadow-lg px-3 py-1"
              style={{ backgroundColor: themeSecondary, color: '#fff' }}
            >
              {blog.city.name}
            </Badge>
          ) : (
            <Badge className="bg-white/80 text-gray-600 text-xs font-semibold border-none shadow-lg backdrop-blur-sm px-3 py-1">
              <GlobeIcon className="size-3 mr-1" />
              Global
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Title & Meta */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="space-y-4"
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
          {blog.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4">
          {/* Author */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: themePrimary }}
            >
              {blog.author.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{blog.author.fullName}</p>
              <p className="text-xs text-gray-400">Author</p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Calendar className="size-4" style={{ color: themePrimary }} />
            <span>{formatDate(blog.createdAt)}</span>
          </div>

          {/* Share on WhatsApp */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareWhatsApp}
            className="ml-auto rounded-xl text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
          >
            <Share2 className="size-4 mr-1.5" />
            Share on WhatsApp
          </Button>
        </div>
      </motion.div>

      {/* Separator */}
      <div
        className="h-0.5 rounded-full"
        style={{ background: `linear-gradient(to right, ${themePrimary}, ${themeSecondary}, transparent)` }}
      />

      {/* Content */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-img:rounded-xl"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(blog.content || '<p>No content available.</p>') }}
      />

      {/* Bottom share bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-between pt-6 border-t border-gray-100"
      >
        <Button
          variant="ghost"
          onClick={handleBack}
          className="rounded-xl text-gray-600"
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Blog
        </Button>

        <Button
          onClick={handleShareWhatsApp}
          className="rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md"
        >
          <Share2 className="size-4 mr-2" />
          Share on WhatsApp
        </Button>
      </motion.div>

      {/* Related Blogs */}
      {!relatedLoading && relatedBlogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="pt-8 space-y-4"
        >
          <h2 className="text-lg font-bold text-gray-900">Related Articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedBlogs.map((related, idx) => (
              <motion.div
                key={related.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + idx * 0.1, duration: 0.4 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <GlassCard
                  onClick={() => handleRelatedClick(related.slug)}
                  className="!p-0 overflow-hidden cursor-pointer"
                >
                  <div className="relative w-full h-36 overflow-hidden">
                    <OptimizedImage
                      src={related.coverImageUrl || PLACEHOLDER_IMG}
                      alt={related.title}
                      fill
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
                      {related.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                      <User className="size-3" />
                      <span>{related.author.fullName}</span>
                      <span>·</span>
                      <Calendar className="size-3" />
                      <span>{formatDate(related.createdAt)}</span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
