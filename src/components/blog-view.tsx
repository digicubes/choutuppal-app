'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Calendar, User, Globe as GlobeIcon, Search, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  authorName: string | null
  authorId: string
  cityId: string | null
  isPublished: boolean
  createdAt: string
  author: { id: string; fullName: string }
  city: { id: string; name: string; slug: string } | null
}

const PLACEHOLDER_IMG = 'https://placehold.co/600x340/D4AF37/ffffff?text=Blog'

export default function BlogView() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const selectedCity = useAppStore((s) => s.selectedCity)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const setSelectedBlogSlug = useAppStore((s) => s.setSelectedBlogSlug)
  const themePrimary = useAppStore((s) => s.themePrimary)
  const themeSecondary = useAppStore((s) => s.themeSecondary)
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [cityId, setCityId] = useState('')

  // Resolve cityId from selectedCity slug
  useEffect(() => {
    fetch('/api/cities')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const matched = data.find((c: { slug: string }) => c.slug === selectedCity)
          setCityId(matched?.id || '')
        }
      })
      .catch(() => {})
  }, [selectedCity])

  // Fetch blogs
  const fetchBlogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (cityId) params.set('cityId', cityId)
      const res = await fetch(`/api/blogs?${params}`)
      const data = await res.json()
      setBlogs(Array.isArray(data) ? data : [])
    } catch {
      setBlogs([])
    } finally {
      setLoading(false)
    }
  }, [cityId])

  useEffect(() => {
    fetchBlogs()
  }, [fetchBlogs])

  // Filter blogs by search query
  const filteredBlogs = blogs.filter((blog) =>
    blog.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleCardClick = (slug: string) => {
    setSelectedBlogSlug(slug)
    navigateTo('blog-detail')
  }

  // Skeleton grid
  const SkeletonGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden bg-white md:bg-white/40 md:backdrop-blur-2xl border border-gray-100 md:border-white/30">
          <Skeleton className="w-full h-48 rounded-none" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Search */}
      <div className="flex justify-end">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl bg-white/60 border-gray-200/60 backdrop-blur-sm"
          />
        </div>
      </div>
      {/* Loading */}
      {loading ? (
        <SkeletonGrid />
      ) : filteredBlogs.length === 0 ? (
        <GlassCard className="text-center py-16">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${themePrimary}15` }}>
            <GlobeIcon className="size-8" style={{ color: themePrimary }} />
          </div>
          <p className="text-gray-500 font-medium text-lg">
            {searchQuery ? 'No articles match your search' : 'No blog articles yet'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery ? 'Try a different search term' : 'Check back later for new content'}
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {filteredBlogs.map((blog, index) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <GlassCard
                onClick={() => handleCardClick(blog.slug)}
                className="!p-0 overflow-hidden h-full flex flex-col"
              >
                {/* Cover Image */}
                <div className="relative w-full h-48 overflow-hidden">
                  <OptimizedImage
                    src={blog.coverImageUrl || PLACEHOLDER_IMG}
                    alt={blog.title}
                    fill
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                  {/* City badge on image */}
                  <div className="absolute top-3 right-3">
                    {blog.city ? (
                      <Badge
                        className="text-[10px] font-semibold border-none shadow-md"
                        style={{ backgroundColor: themeSecondary, color: '#fff' }}
                      >
                        {blog.city.name}
                      </Badge>
                    ) : (
                      <Badge className="bg-white/80 text-gray-600 text-[10px] font-semibold border-none shadow-md backdrop-blur-sm">
                        <GlobeIcon className="size-3 mr-1" />
                        Global
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 md:p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-900 text-base line-clamp-2 mb-2 leading-snug">
                    {blog.title}
                  </h3>

                  {/* Excerpt from content */}
                  {blog.content && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">
                      {blog.content.replace(/<[^>]*>/g, '').slice(0, 120)}...
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 md:border-white/20">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <User className="size-3.5" style={{ color: themePrimary }} />
                      <span className="font-medium">{blog.authorName || blog.author.fullName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="size-3" />
                      <span>{formatDate(blog.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Load more indicator if needed */}
      {!loading && filteredBlogs.length > 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            Showing {filteredBlogs.length} article{filteredBlogs.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
