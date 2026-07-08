'use client'

import { useEffect, useState } from 'react'
import { Clock, ArrowRight, Newspaper } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { GlassCard } from '@/components/glass-card'
import { OptimizedImage } from '@/components/optimized-image'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

interface NewsItem {
  id: string
  slug: string
  title: string
  content: string | null
  imageUrl: string | null
  source: string | null
  createdAt: string
  city: {
    id: string
    name: string
    slug: string
  }
}

interface BlogItem {
  id: string
  slug: string
  title: string
  coverImageUrl: string | null
  authorName: string
  createdAt: string
}

export function NewsSection() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const selectedCity = useAppStore((s) => s.selectedCity)
  const [news, setNews] = useState<NewsItem[]>([])
  const [blogs, setBlogs] = useState<BlogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cityId, setCityId] = useState<string | null>(null)

  // Fetch cityId from slug
  useEffect(() => {
    async function fetchCity() {
      try {
        const res = await fetch('/api/cities')
        if (res.ok) {
          const cities = await res.json()
          const cityArr = Array.isArray(cities) ? cities : (cities?.data || [])
          const city = cityArr.find((c: { slug: string; id: string }) => c.slug === selectedCity)
          if (city) setCityId(city.id)
        }
      } catch {
        // ignore
      }
    }
    fetchCity()
  }, [selectedCity])

  // Fetch news
  useEffect(() => {
    async function fetchNews() {
      if (!cityId) return
      setLoading(true)
      try {
        const res = await fetch(`/api/news?cityId=${cityId}`)
        if (res.ok) {
          const data = await res.json()
          setNews(Array.isArray(data) ? data : (data?.news || []))
        }
      } catch {
        // ignore
      }

      // Fetch Blogs
      try {
        const resBlogs = await fetch(`/api/blogs?cityId=${cityId}&limit=5`)
        if (resBlogs.ok) {
          const dataBlogs = await resBlogs.json()
          setBlogs(Array.isArray(dataBlogs) ? dataBlogs : [])
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [cityId])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHrs < 1) return 'Just now'
    if (diffHrs < 24) return `${diffHrs}h ago`
    const diffDays = Math.floor(diffHrs / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const placeholderImg =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNGM0Y0RjYiLz48dGV4dCB4PSIxMDAiIHk9IjY1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRDRBRjM3IiBmb250LXNpemU9IjIwIj7wn5m2PC90ZXh0Pjwvc3ZnPg=='

  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-lg font-bold text-gray-800"
        >
          📰 Local News
        </h2>
        <button
          className="flex items-center gap-1 text-sm text-[#4169E1] font-medium hover:underline active:scale-95 transition-transform"
        >
          View All <ArrowRight className="size-4" />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-video rounded-t-xl" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : news.length === 0 ? (
        <GlassCard className="!p-6 text-center">
          <Newspaper className="size-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No news yet for this area. Stay tuned!</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {news.slice(0, 6).map((item, index) => (
            <div key={item.id}>
              <Link href={`/news/${item.slug || item.id}`} className="block">
                <GlassCard className="!p-0 overflow-hidden cursor-pointer group">
                  {/* Image or Royal Glassmorphism gradient fallback */}
                  <div className="relative aspect-video w-full overflow-hidden">
                    {item.imageUrl ? (
                      <OptimizedImage
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#4169E1] to-[#D4AF37] rounded-t-xl flex items-center justify-center">
                        <Newspaper className="w-8 h-8 text-white/60" />
                      </div>
                    )}
                  </div>

                  <div className="p-3 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="size-3" />
                        <span className="text-[11px]">{formatDate(item.createdAt)}</span>
                      </div>
                      {item.source && (
                        <span className="text-[11px] text-[#4169E1] font-medium">
                          {item.source}
                        </span>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Informative Blogs Section */}
      <div className="flex items-center justify-between mb-3 mt-8">
        <h2 className="text-lg font-bold text-gray-800">
          📝 Informative Blogs
        </h2>
        <Link href="/blog" className="flex items-center gap-1 text-sm text-[#4169E1] font-medium hover:underline active:scale-95 transition-transform">
          View All <ArrowRight className="size-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-video rounded-t-xl" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <GlassCard className="!p-6 text-center">
          <Newspaper className="size-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No blogs available yet.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {blogs.map((blog) => (
            <div key={blog.id}>
              <Link href={`/blog/${blog.slug}`} className="block">
                <GlassCard className="!p-0 overflow-hidden cursor-pointer group">
                  <div className="relative aspect-video w-full overflow-hidden">
                    {blog.coverImageUrl ? (
                      <OptimizedImage
                        src={blog.coverImageUrl}
                        alt={blog.title}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#4169E1] to-[#D4AF37] rounded-t-xl flex items-center justify-center">
                        <Newspaper className="w-8 h-8 text-white/60" />
                      </div>
                    )}
                  </div>

                  <div className="p-3 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
                      {blog.title}
                    </h3>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="size-3" />
                        <span className="text-[11px]">{formatDate(blog.createdAt)}</span>
                      </div>
                      {blog.authorName && (
                        <span className="text-[11px] text-[#4169E1] font-medium line-clamp-1 text-right">
                          {blog.authorName}
                        </span>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
