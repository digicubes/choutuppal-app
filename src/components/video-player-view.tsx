'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ThumbsUp, Share2, Bookmark, Lock, Eye,
  Clock, ChevronDown, ChevronUp, Play, Crown, Loader2,
  ListVideo, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { GlassCard } from '@/components/glass-card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import { OptimizedImage } from '@/components/optimized-image'

// ─── Types ───────────────────────────────────────────────────────────────────

interface LongVideo {
  id: string
  title: string
  description?: string | null
  thumbnailUrl?: string | null
  youtubeVideoId: string
  duration?: string | null
  views: number
  likes?: number
  isPremium: boolean
  playlistId?: string | null
  createdAt: string
  creator?: { id: string; fullName: string } | null
  playlist?: { id: string; title: string; isPremium: boolean } | null
  category?: { id: string; name: string; slug: string } | null
}

const PLACEHOLDER_THUMB = 'https://placehold.co/640x360/D4AF37/ffffff?text=Mana+Learn'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return count.toString()
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
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

export default function VideoPlayerView() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const selectedVideoId = useAppStore((s) => s.selectedVideoId)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const setSelectedVideoId = useAppStore((s) => s.setSelectedVideoId)
  const currentUser = useAppStore((s) => s.currentUser)
  const themePrimary = useAppStore((s) => s.themePrimary)
  const themeSecondary = useAppStore((s) => s.themeSecondary)

  // Data state
  const [video, setVideo] = useState<LongVideo | null>(null)
  const [playlistVideos, setPlaylistVideos] = useState<LongVideo[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [shareToast, setShareToast] = useState(false)

  const isPremiumUser = currentUser?.subscriptionTier === 'premium' || currentUser?.subscriptionTier === 'pro'

  // ─── Fetch video details ─────────────────────────────────────────────────

  useEffect(() => {
    if (!selectedVideoId) {
      navigateTo('learn')
      return
    }

    let cancelled = false
    // Use requestAnimationFrame to avoid synchronous setState in effect
    requestAnimationFrame(() => {
      if (!cancelled) setLoading(true)
    })
    fetch(`/api/long-videos/${selectedVideoId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Video not found')
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setVideo(data)
        setLikeCount(data.likes || 0)
        // Check if premium content needs modal
        if (data.isPremium && !isPremiumUser) {
          setShowPremiumModal(true)
        }
      })
      .catch(() => {
        if (!cancelled) setVideo(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [selectedVideoId, navigateTo, isPremiumUser])

  // ─── Fetch playlist videos ───────────────────────────────────────────────

  useEffect(() => {
    if (!video?.playlistId) {
      return
    }

    let cancelled = false
    fetch(`/api/long-videos?playlistId=${video.playlistId}`)
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setPlaylistVideos(Array.isArray(data) ? data : []) })
      .catch(() => { if (!cancelled) setPlaylistVideos([]) })

    return () => { cancelled = true }
  }, [video?.playlistId])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleBack = () => {
    setSelectedVideoId(null)
    navigateTo('learn')
  }

  const handleSwitchVideo = (videoId: string) => {
    setSelectedVideoId(videoId)
    // Reset states for new video
    setLiked(false)
    setSaved(false)
    setDescriptionOpen(false)
    setShowPremiumModal(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
  }

  const handleShare = async () => {
    const shareData = {
      title: video?.title || 'Mana Learn Video',
      text: `Check out this video: ${video?.title}`,
      url: window.location.href,
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2000)
      } catch {
        // Clipboard write failed
      }
    }
  }

  const handleUpgrade = () => {
    setShowPremiumModal(false)
    // Navigate to pricing section on home page
    navigateTo('home')
    // Scroll to pricing after a short delay
    setTimeout(() => {
      const pricingEl = document.getElementById('pricing-section')
      pricingEl?.scrollIntoView({ behavior: 'smooth' })
    }, 500)
  }

  // ─── Loading State ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-5xl mx-auto px-4 py-4 space-y-4"
      >
        {/* Player skeleton */}
        <Skeleton className="w-full aspect-video rounded-xl" />
        {/* Info skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-7 w-3/4" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </motion.div>
    )
  }

  if (!video) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-5xl mx-auto px-4 py-12 text-center"
      >
        <GlassCard className="py-16">
          <ListVideo className="size-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-lg">Video not found</p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={handleBack}>
            <ArrowLeft className="size-4 mr-2" />
            Back to Learn
          </Button>
        </GlassCard>
      </motion.div>
    )
  }

  // ─── Main Render ─────────────────────────────────────────────────────────

  const isPremiumLocked = video.isPremium && !isPremiumUser

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto px-0 sm:px-4 py-0 sm:py-4 space-y-0 sm:space-y-5"
    >
      {/* ── Back Button (mobile) ── */}
      <div className="px-4 py-2 sm:hidden">
        <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-xl -ml-2">
          <ArrowLeft className="size-4 mr-1" />
          Back
        </Button>
      </div>

      {/* ── Player Area ── */}
      <div className="relative w-full bg-black">
        <div className="relative w-full aspect-video">
          {isPremiumLocked ? (
            // Premium locked overlay on player
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
              <OptimizedImage
                src={video.thumbnailUrl || PLACEHOLDER_THUMB}
                alt={video.title}
                fill
                className="w-full h-full object-cover opacity-30"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mb-4">
                  <Lock className="size-7 text-[#D4AF37]" />
                </div>
                <p className="text-white font-semibold text-lg">Premium Content</p>
                <p className="text-gray-400 text-sm mt-1">Upgrade to watch this full course</p>
                <Button
                  onClick={() => setShowPremiumModal(true)}
                  className="mt-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white font-semibold shadow-lg"
                >
                  <Crown className="size-4 mr-2" />
                  Upgrade Now
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              src={`https://www.youtube.com/embed/${video.youtubeVideoId}?autoplay=1&rel=0`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              style={{ border: 0 }}
            />
          )}
        </div>
      </div>

      {/* ── Content below player ── */}
      <div className="px-4 space-y-4 pt-4">
        {/* ── Video Info Section ── */}
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
            {video.title}
          </h1>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-1.5 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="size-3.5" />
              {formatViews(video.views)} views
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {formatDate(video.createdAt)}
            </span>
            {video.category && (
              <>
                <span>•</span>
                <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                  {video.category.name}
                </Badge>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {/* Like */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                liked
                  ? 'bg-[#4169E1]/10 text-[#4169E1]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ThumbsUp className={`size-4 ${liked ? 'fill-[#4169E1]' : ''}`} />
              <span>{formatViews(likeCount)}</span>
            </motion.button>

            {/* Share */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Share2 className="size-4" />
              Share
            </motion.button>

            {/* Save */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setSaved(!saved)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                saved
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {saved ? <Check className="size-4" /> : <Bookmark className="size-4" />}
              {saved ? 'Saved' : 'Save'}
            </motion.button>

            {/* Enroll Course (premium CTA) */}
            {video.isPremium && !isPremiumUser && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPremiumModal(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white shadow-md ml-auto"
              >
                <Lock className="size-3.5" />
                Enroll Course
              </motion.button>
            )}
          </div>

          {/* Share toast */}
          <AnimatePresence>
            {shareToast && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg inline-flex items-center gap-1.5"
              >
                <Check className="size-3" />
                Link copied to clipboard
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Creator Card + Description ── */}
        <GlassCard className="!p-3 sm:!p-4 space-y-3">
          {/* Creator */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0"
              style={{
                background: `linear-gradient(135deg, ${themeSecondary || '#4169E1'}, ${themePrimary || '#D4AF37'})`,
              }}
            >
              {video.creator?.fullName?.charAt(0) || 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {video.creator?.fullName || 'Mana Learn'}
              </p>
              <p className="text-xs text-gray-500">Educator</p>
            </div>
            {video.playlist && (
              <Badge variant="outline" className="text-[10px] shrink-0">
                <ListVideo className="size-3 mr-1" />
                {video.playlist.title}
              </Badge>
            )}
          </div>

          {/* Collapsible Description */}
          {video.description && (
            <Collapsible open={descriptionOpen} onOpenChange={setDescriptionOpen}>
              <CollapsibleContent
                forceMount
                className={`text-sm text-gray-600 leading-relaxed whitespace-pre-wrap overflow-hidden transition-all duration-300 ${
                  descriptionOpen ? 'max-h-[600px]' : 'max-h-16'
                }`}
              >
                <div className={descriptionOpen ? '' : 'relative'}>
                  {video.description}
                  {!descriptionOpen && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
                  )}
                </div>
              </CollapsibleContent>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-1 text-xs font-semibold text-[#4169E1] hover:text-[#3155C1] mt-1 transition-colors">
                  {descriptionOpen ? (
                    <>
                      Show less <ChevronUp className="size-3" />
                    </>
                  ) : (
                    <>
                      Show more <ChevronDown className="size-3" />
                    </>
                  )}
                </button>
              </CollapsibleTrigger>
            </Collapsible>
          )}

          {/* Description fallback if no description */}
          {!video.description && (
            <p className="text-sm text-gray-400 italic">No description available</p>
          )}
        </GlassCard>

        {/* ── Playlist / Up Next Section ── */}
        {playlistVideos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ListVideo className="size-5 text-[#4169E1]" />
                {video.playlist?.title || 'Playlist'}
              </h2>
              <span className="text-xs text-gray-400">
                {playlistVideos.length} video{playlistVideos.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2">
              {playlistVideos.map((pv, idx) => {
                const isCurrentVideo = pv.id === selectedVideoId

                return (
                  <motion.div
                    key={pv.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.25 }}
                  >
                    <div
                      onClick={() => !isCurrentVideo && handleSwitchVideo(pv.id)}
                      className={`flex gap-3 p-2.5 rounded-xl transition-all ${
                        isCurrentVideo
                          ? 'bg-[#D4AF37]/8 border border-[#D4AF37]/20'
                          : 'hover:bg-gray-50 cursor-pointer active:scale-[0.98]'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-28 sm:w-36 shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <OptimizedImage
                          src={pv.thumbnailUrl || PLACEHOLDER_THUMB}
                          alt={pv.title}
                          fill
                          className="w-full h-full object-cover"
                        />
                        {/* Current playing indicator */}
                        {isCurrentVideo ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="flex items-center gap-0.5">
                              <div className="w-0.5 h-3 bg-[#D4AF37] rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                              <div className="w-0.5 h-4 bg-[#D4AF37] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                              <div className="w-0.5 h-2 bg-[#D4AF37] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/10">
                            <Play className="size-6 text-white" fill="white" />
                          </div>
                        )}
                        {/* Duration */}
                        {pv.duration && (
                          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-medium px-1 py-0.5 rounded">
                            {pv.duration}
                          </div>
                        )}
                        {/* Premium lock */}
                        {pv.isPremium && (
                          <div className="absolute top-1 right-1">
                            <Lock className="size-3 text-[#D4AF37] drop-shadow" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 py-0.5">
                        <h4
                          className={`text-sm font-medium line-clamp-2 leading-snug ${
                            isCurrentVideo ? 'text-[#D4AF37]' : 'text-gray-900'
                          }`}
                        >
                          {isCurrentVideo && (
                            <span className="text-[10px] font-bold mr-1 uppercase tracking-wider">Playing</span>
                          )}
                          {pv.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {pv.creator?.fullName || 'Mana Learn'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400">
                          <span>{formatViews(pv.views)} views</span>
                          <span>•</span>
                          <span>{getTimeAgo(pv.createdAt)}</span>
                        </div>
                      </div>

                      {/* Index number */}
                      <div className="flex items-center shrink-0">
                        <span className={`text-xs font-medium ${isCurrentVideo ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                          {idx + 1}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Back to Learn link */}
        <div className="pt-2 pb-4">
          <Button
            variant="outline"
            onClick={handleBack}
            className="rounded-xl w-full sm:w-auto"
          >
            <ArrowLeft className="size-4 mr-2" />
            Back to Mana Learn
          </Button>
        </div>
      </div>

      {/* ── Premium Modal ── */}
      <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader className="text-center sm:text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center bg-[#D4AF37]/10">
              <Crown className="size-8 text-[#D4AF37]" />
            </div>
            <DialogTitle className="text-xl">Upgrade to Premium</DialogTitle>
            <DialogDescription className="text-gray-500 mt-2">
              Unlock this full course and all premium content on Mana Learn. Get unlimited access to expert-led courses in Telugu and English.
            </DialogDescription>
          </DialogHeader>

          {/* Benefits */}
          <div className="space-y-2.5 my-4">
            {[
              'Access all premium courses & videos',
              'Download videos for offline learning',
              'Priority support from educators',
              'Certificate of completion',
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Check className="size-3 text-green-600" />
                </div>
                {benefit}
              </div>
            ))}
          </div>

          <DialogFooter className="sm:justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPremiumModal(false)}
              className="rounded-xl"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleUpgrade}
              className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white font-semibold shadow-lg hover:opacity-90"
            >
              <Crown className="size-4 mr-2" />
              Upgrade Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
