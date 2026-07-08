'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, Search, Play, Lock, Clock, Eye,
  ChevronRight, BookOpen, Loader2, X, ListVideo,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { GlassCard } from '@/components/glass-card'
import { useAppStore } from '@/lib/store'
import { OptimizedImage } from '@/components/optimized-image'

// ─── Skeleton Components (outside render to avoid lint error) ──────────────

function CategoryChipsSkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
      ))}
    </div>
  )
}

function FeaturedPlaylistsSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="shrink-0 w-[280px] sm:w-[340px]">
          <Skeleton className="w-full aspect-video rounded-xl" />
          <div className="mt-2 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function VideoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="w-full aspect-video rounded-xl" />
          <div className="space-y-1.5 px-1">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface VideoCategory {
  id: string
  name: string
  slug: string
  icon?: string | null
}

interface VideoPlaylist {
  id: string
  title: string
  description?: string | null
  thumbnailUrl?: string | null
  isFeatured: boolean
  isPremium: boolean
  categoryId?: string | null
  creator?: { id: string; fullName: string } | null
  videos?: LongVideo[]
  _count?: { videos: number }
}

interface LongVideo {
  id: string
  title: string
  description?: string | null
  thumbnailUrl?: string | null
  youtubeVideoId: string
  duration?: string | null
  views: number
  isPremium: boolean
  playlistId?: string | null
  createdAt: string
  creator?: { id: string; fullName: string } | null
  playlist?: { id: string; title: string; isPremium: boolean } | null
  category?: { id: string; name: string; slug: string } | null
}

const PLACEHOLDER_THUMB = 'https://placehold.co/640x360/D4AF37/ffffff?text=Mana+Learn'
const PLACEHOLDER_PLAYLIST = 'https://placehold.co/640x360/4169E1/ffffff?text=Playlist'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return count.toString()
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LearnView() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const navigateTo = useAppStore((s) => s.navigateTo)
  const setSelectedVideoId = useAppStore((s) => s.setSelectedVideoId)
  const currentUser = useAppStore((s) => s.currentUser)
  const themePrimary = useAppStore((s) => s.themePrimary)
  const themeSecondary = useAppStore((s) => s.themeSecondary)

  // Data state
  const [categories, setCategories] = useState<VideoCategory[]>([])
  const [featuredPlaylists, setFeaturedPlaylists] = useState<VideoPlaylist[]>([])
  const [videos, setVideos] = useState<LongVideo[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingPlaylists, setLoadingPlaylists] = useState(true)
  const [loadingVideos, setLoadingVideos] = useState(true)

  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activePlaylist, setActivePlaylist] = useState<VideoPlaylist | null>(null)

  const chipsRef = useRef<HTMLDivElement>(null)

  // ─── Fetch data on mount ─────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/video-categories')
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false))

    fetch('/api/video-playlists?isFeatured=true')
      .then((res) => res.json())
      .then((data) => setFeaturedPlaylists(Array.isArray(data) ? data : []))
      .catch(() => setFeaturedPlaylists([]))
      .finally(() => setLoadingPlaylists(false))

    fetch('/api/long-videos')
      .then((res) => res.json())
      .then((data) => setVideos(Array.isArray(data) ? data : []))
      .catch(() => setVideos([]))
      .finally(() => setLoadingVideos(false))
  }, [])

  // ─── Derived data ────────────────────────────────────────────────────────

  const filteredVideos = videos.filter((v) => {
    const matchesCategory =
      selectedCategory === 'all' || v.category?.id === selectedCategory || v.playlist?.id === selectedCategory
    const matchesSearch =
      !searchQuery ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.creator?.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const playlistVideos = activePlaylist
    ? videos.filter((v) => v.playlistId === activePlaylist.id)
    : []

  const isPremiumUser = currentUser?.subscriptionTier === 'premium' || currentUser?.subscriptionTier === 'pro'

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleVideoClick = (video: LongVideo) => {
    // If premium video and user not premium, still navigate (player will show modal)
    setSelectedVideoId(video.id)
    navigateTo('video-player')
  }

  const handlePlaylistClick = (playlist: VideoPlaylist) => {
    setActivePlaylist(playlist)
  }

  const handleBackFromPlaylist = () => {
    setActivePlaylist(null)
  }

  // ─── Render: Playlist Detail ─────────────────────────────────────────────

  if (activePlaylist) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="max-w-6xl mx-auto px-4 py-6 space-y-6"
      >
        {/* Back button + Playlist header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={handleBackFromPlaylist} className="shrink-0 rounded-xl mt-1">
            <ChevronRight className="size-5 rotate-180" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 line-clamp-2">
              {activePlaylist.title}
            </h2>
            {activePlaylist.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{activePlaylist.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-gray-500">
                {playlistVideos.length} video{playlistVideos.length !== 1 ? 's' : ''}
              </span>
              {activePlaylist.isPremium && (
                <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 text-xs">
                  <Lock className="size-3 mr-1" /> Premium
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Playlist videos list */}
        {playlistVideos.length === 0 ? (
          <GlassCard className="text-center py-12">
            <ListVideo className="size-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No videos in this playlist yet</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {playlistVideos.map((video, idx) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
              >
                <GlassCard
                  onClick={() => handleVideoClick(video)}
                  className="!p-0 overflow-hidden cursor-pointer hover:bg-gray-50 md:hover:bg-white/50 active:scale-[0.98] transition-transform"
                >
                  <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
                    {/* Thumbnail */}
                    <div className="relative w-32 sm:w-44 shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <OptimizedImage
                        src={video.thumbnailUrl || PLACEHOLDER_THUMB}
                        alt={video.title}
                        fill
                        className="w-full h-full object-cover"
                      />
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
                        <Play className="size-8 text-white drop-shadow-lg" fill="white" />
                      </div>
                      {/* Duration badge */}
                      {video.duration && (
                        <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                          {video.duration}
                        </div>
                      )}
                      {video.isPremium && (
                        <div className="absolute top-1.5 left-1.5">
                          <Lock className="size-3.5 text-[#D4AF37] drop-shadow" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 py-0.5">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 leading-snug">
                        {video.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {video.creator?.fullName || 'Mana Learn'}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Eye className="size-3" />
                          {formatViews(video.views)} views
                        </span>
                        <span>•</span>
                        <span>{getTimeAgo(video.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    )
  }

  // ─── Render: Main Browse View ────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto px-4 py-4 sm:py-6 space-y-5 sm:space-y-6"
    >
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${themeSecondary || '#4169E1'}15` }}
          >
            <GraduationCap className="size-5" style={{ color: themeSecondary || '#4169E1' }} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mana Learn</h1>
            <p className="text-sm text-gray-500">Skills & knowledge for everyone</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search courses & videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl bg-white/60 border-gray-200/60 backdrop-blur-sm h-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Category Chips ── */}
      {loadingCategories ? (
        <CategoryChipsSkeleton />
      ) : (
        <div
          ref={chipsRef}
          className="flex gap-2 overflow-x-auto scrollbar-none scroll-snap-x scroll-snap-mandatory pb-1 -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* "All" chip */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all scroll-snap-start ${
              selectedCategory === 'all'
                ? 'bg-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/25'
                : 'bg-white/10 text-gray-600 border border-gray-200/80 hover:bg-white/20'
            }`}
          >
            All
          </motion.button>

          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all scroll-snap-start ${
                selectedCategory === cat.id
                  ? 'bg-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/25'
                  : 'bg-white/10 text-gray-600 border border-gray-200/80 hover:bg-white/20'
              }`}
            >
              {cat.name}
            </motion.button>
          ))}
        </div>
      )}

      {/* ── Featured Playlists Carousel ── */}
      {!searchQuery && featuredPlaylists.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="size-5 text-[#4169E1]" />
              Featured Courses
            </h2>
          </div>

          {loadingPlaylists ? (
            <FeaturedPlaylistsSkeleton />
          ) : (
            <div
              className="flex gap-4 overflow-x-auto scrollbar-none scroll-snap-x scroll-snap-mandatory pb-2 -mx-4 px-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {featuredPlaylists.map((playlist, idx) => (
                <motion.div
                  key={playlist.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.08, duration: 0.35 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() => handlePlaylistClick(playlist)}
                  className="shrink-0 w-[280px] sm:w-[340px] cursor-pointer group scroll-snap-start"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                    <OptimizedImage
                      src={playlist.thumbnailUrl || PLACEHOLDER_PLAYLIST}
                      alt={playlist.title}
                      fill
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    {/* Play All overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37] text-white text-sm font-semibold shadow-lg">
                        <Play className="size-4" fill="white" />
                        Play All
                      </div>
                    </div>

                    {/* Premium badge */}
                    {playlist.isPremium && (
                      <div className="absolute top-3 right-3">
                        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-[#D4AF37] text-xs font-semibold px-2 py-1 rounded-full">
                          <Lock className="size-3" />
                          Premium
                        </div>
                      </div>
                    )}

                    {/* Video count badge */}
                    <div className="absolute bottom-3 left-3">
                      <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full">
                        <Play className="size-3" />
                        {playlist._count?.videos ?? playlist.videos?.length ?? 0} videos
                      </div>
                    </div>
                  </div>

                  {/* Playlist info */}
                  <div className="mt-2.5 px-0.5">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-snug">
                      {playlist.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {playlist.creator?.fullName || 'Mana Learn'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Video Grid ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Play className="size-5 text-[#D4AF37]" />
            {selectedCategory === 'all' ? 'All Videos' : 'Filtered Videos'}
          </h2>
          {!loadingVideos && (
            <span className="text-xs text-gray-400">
              {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loadingVideos ? (
          <VideoGridSkeleton />
        ) : filteredVideos.length === 0 ? (
          <GlassCard className="text-center py-16">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: `${themePrimary || '#D4AF37'}15` }}
            >
              <GraduationCap className="size-8" style={{ color: themePrimary || '#D4AF37' }} />
            </div>
            <p className="text-gray-500 font-medium text-lg">
              {searchQuery ? 'No videos match your search' : 'No videos available yet'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? 'Try a different search term' : 'Check back later for new content'}
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVideos.map((video, idx) => (
              <VideoCard
                key={video.id}
                video={video}
                index={idx}
                onClick={() => handleVideoClick(video)}
                isPremiumUser={isPremiumUser}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── VideoCard Sub-component ────────────────────────────────────────────────

interface VideoCardProps {
  video: LongVideo
  index: number
  onClick: () => void
  isPremiumUser: boolean
}

function VideoCard({ video, index, onClick, isPremiumUser }: VideoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={onClick}
      className="cursor-pointer group"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-sm">
        <OptimizedImage
          src={video.thumbnailUrl || PLACEHOLDER_THUMB}
          alt={video.title}
          fill
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/15">
          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Play className="size-5 text-white ml-0.5" fill="white" />
          </div>
        </div>

        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-medium px-1.5 py-0.5 rounded">
            {video.duration}
          </div>
        )}

        {/* Premium lock */}
        {video.isPremium && !isPremiumUser && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 bg-[#D4AF37]/90 backdrop-blur-sm text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
              <Lock className="size-2.5" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-2.5 px-0.5">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-snug">
          {video.title}
        </h3>
        <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
          {video.creator?.fullName || 'Mana Learn'}
        </p>
        <div className="flex items-center gap-1.5 mt-1 text-gray-400 text-[11px] sm:text-xs">
          <span className="flex items-center gap-0.5">
            <Eye className="size-3" />
            {formatViews(video.views)}
          </span>
          <span>•</span>
          <span className="flex items-center gap-0.5">
            <Clock className="size-3" />
            {getTimeAgo(video.createdAt)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
