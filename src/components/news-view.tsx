'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Newspaper, Calendar, MapPin, ExternalLink, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { GlassCard } from '@/components/glass-card'
import { OptimizedImage } from '@/components/optimized-image'
import { useAppStore } from '@/lib/store'
import Link from 'next/link'
interface NewsArticle {
  id: string
  title: string
  slug: string
  content: string | null
  imageUrl: string | null
  source: string | null
  authorName: string | null
  isPublished: boolean
  createdAt: string
  city: {
    id: string
    name: string
    slug: string
  }
}

const PLACEHOLDER_IMG = null // Use Royal Glassmorphism gradient fallback instead of external image

export default function NewsView() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const selectedCity = useAppStore((s) => s.selectedCity)
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [cities, setCities] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [cityId, setCityId] = useState('')
  // Fetch cities for filter
  useEffect(() => {
    fetch('/api/cities')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCities(data)
          const matched = data.find((c: { slug: string }) => c.slug === selectedCity)
          setCityId(matched?.id || '')
        }
      })
      .catch(() => {})
  }, [selectedCity])

  // Fetch news
  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (cityId) params.set('cityId', cityId)

    fetch(`/api/news?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setArticles(Array.isArray(data) ? data : [])
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [cityId])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return formatDate(dateStr)
  }

  // Skeleton
  const SkeletonList = () => (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white border border-gray-100">
          <Skeleton className="w-28 h-28 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6">
      {/* Articles */}
      {loading ? (
        <SkeletonList />
      ) : articles.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Newspaper className="size-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No news articles yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Check back later for local updates
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {/* Featured article (first one) */}
          {articles[0] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Link href={`/news/${articles[0].slug || articles[0].id}`} className="block">
                <GlassCard variant="gold" className="!p-0 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative max-h-[250px] h-48 sm:h-[250px] overflow-hidden">
                    {articles[0].imageUrl ? (
                      <OptimizedImage
                        src={articles[0].imageUrl}
                        alt={articles[0].title}
                        fill
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#4169E1] to-[#D4AF37] flex items-center justify-center">
                        <Newspaper className="w-12 h-12 text-white/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                      <Badge className="bg-[#D4AF37] text-white border-none mb-2 text-xs">
                        Featured
                      </Badge>
                      <h2 className="text-lg sm:text-xl font-bold text-white mb-1 line-clamp-2">
                        {articles[0].title}
                      </h2>
                      <div className="flex items-center gap-3 text-xs text-white/80">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {formatDate(articles[0].createdAt)}
                        </span>
                        {articles[0].city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {articles[0].city.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {articles[0].content && (
                    <div className="p-4 sm:p-6">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {articles[0].content}
                      </p>
                    </div>
                  )}
                </GlassCard>
              </Link>
            </motion.div>
          )}

          {/* Other articles */}
          <div className="space-y-3">
            {articles.slice(1).map((article, idx) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
              >
                <Link href={`/news/${article.slug || article.id}`} className="block">
                  <GlassCard className="!p-0 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="flex gap-4 p-4">
                      {/* Thumbnail */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0">
                        {article.imageUrl ? (
                          <OptimizedImage
                            src={article.imageUrl}
                            alt={article.title}
                            fill
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#4169E1] to-[#D4AF37] flex items-center justify-center">
                            <Newspaper className="w-5 h-5 text-white/50" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                          {article.title}
                        </h3>
                        {article.content && (
                          <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                            {article.content}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {getTimeAgo(article.createdAt)}
                          </span>
                          {article.authorName && (
                            <span className="flex items-center gap-1">
                              <ExternalLink className="size-3" />
                              {article.authorName}
                            </span>
                          )}
                          {article.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3" />
                              {article.city.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
