'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  MessageSquare,
  Share2,
  ShoppingBag,
  Play,
  Pin,
  Star,
  MapPin,
  Send,
  Loader2,
  PlayCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ShortCategory = 'GENERAL' | 'PROMOTION' | 'NEWS'

export interface ShortVideo {
  id: string
  title: string
  youtubeVideoId: string
  category: ShortCategory
  cityId: string
  cityName: string
  isPinned: boolean
  isPromoted: boolean
  likesCount: number
  commentsCount: number
  sharesCount: number
  linkedListingId: string | null
  linkedListingType: 'product' | 'service' | 'real_estate' | null
  createdAt: string
  uploader: {
    id: string
    fullName: string
    avatarUrl: string | null
  }
}

interface ShortComment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    fullName: string
    avatarUrl: string | null
  }
}

/* ------------------------------------------------------------------ */
/*  Constants & Helpers                                                */
/* ------------------------------------------------------------------ */

const GOLD = '#D4AF37'

const CATEGORY_STYLES: Record<ShortCategory, { label: string; bg: string; text: string }> = {
  GENERAL: { label: 'General', bg: 'bg-white/15', text: 'text-white/90' },
  PROMOTION: { label: 'Promotion', bg: 'bg-amber-500/25', text: 'text-amber-200' },
  NEWS: { label: 'News', bg: 'bg-blue-500/25', text: 'text-blue-200' },
}

const CTA_LABELS: Record<string, string> = {
  product: 'Shop Now',
  service: 'Book Now',
  real_estate: 'View Property',
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

/* ------------------------------------------------------------------ */
/*  Double-Tap Heart Overlay                                           */
/* ------------------------------------------------------------------ */

function DoubleTapHeart({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 1] }}
          exit={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
        >
          <Heart
            className="w-24 h-24 text-red-500 drop-shadow-lg"
            fill="currentColor"
            strokeWidth={0}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/*  Action Button                                                      */
/* ------------------------------------------------------------------ */

interface ActionButtonProps {
  children: React.ReactNode
  count?: number
  active?: boolean
  activeColor?: string
  onClick?: () => void
  className?: string
}

function ActionButton({
  children,
  count,
  active = false,
  activeColor = GOLD,
  onClick,
  className,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 group transition-transform active:scale-90',
        className
      )}
    >
      <div
        className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center transition-colors group-hover:bg-white/20"
        style={active ? { backgroundColor: `${activeColor}30` } : undefined}
      >
        {children}
      </div>
      {count !== undefined && (
        <span
          className="text-[11px] font-medium text-white/80"
          style={active ? { color: activeColor } : undefined}
        >
          {formatCount(count)}
        </span>
      )}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Comment Bottom Sheet                                               */
/* ------------------------------------------------------------------ */

interface CommentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shortId: string
  comments: ShortComment[]
  onAddComment: (content: string) => void
  loading: boolean
}

function CommentSheet({
  open,
  onOpenChange,
  shortId,
  comments,
  onAddComment,
  loading,
}: CommentSheetProps) {
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = newComment.trim()
      if (!trimmed || submitting) return
      setSubmitting(true)
      try {
        await onAddComment(trimmed)
        setNewComment('')
      } finally {
        setSubmitting(false)
      }
    },
    [newComment, onAddComment, submitting]
  )

  // Auto-focus input when sheet opens
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => inputRef.current?.focus(), 400)
    return () => clearTimeout(timer)
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-zinc-950 border-zinc-800 rounded-t-2xl h-[70dvh] max-h-[70dvh] p-0 flex flex-col"
      >
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-zinc-800 shrink-0">
          <SheetTitle className="text-white text-base font-semibold">
            Comments {comments.length > 0 && `(${comments.length})`}
          </SheetTitle>
          <SheetDescription className="text-zinc-500 text-xs sr-only">
            Comments for this short video
          </SheetDescription>
        </SheetHeader>

        {/* Comments list */}
        <ScrollArea className="flex-1 px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs text-zinc-600">Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => {
                const initial = comment.user.fullName?.charAt(0)?.toUpperCase() || '?'
                return (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8 shrink-0 ring-1 ring-zinc-700">
                      {comment.user.avatarUrl ? (
                        <AvatarImage src={comment.user.avatarUrl} alt={comment.user.fullName} />
                      ) : null}
                      <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-zinc-300 text-sm font-medium truncate">
                          {comment.user.fullName}
                        </span>
                        <span className="text-zinc-600 text-[10px] shrink-0">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-zinc-100 text-sm mt-0.5 break-words">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Comment input */}
        <form
          onSubmit={handleSubmit}
          className="shrink-0 flex items-center gap-2 px-4 py-3 border-t border-zinc-800 bg-zinc-950"
        >
          <Input
            ref={inputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 h-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 rounded-full px-4 text-sm focus-visible:ring-[#D4AF37]/50 focus-visible:border-[#D4AF37]/50"
            disabled={submitting}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors disabled:opacity-30"
            style={{ backgroundColor: newComment.trim() ? GOLD : 'transparent' }}
          >
            <Send
              className="w-4 h-4"
              style={{ color: newComment.trim() ? '#000' : '#666' }}
            />
          </button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

/* ------------------------------------------------------------------ */
/*  Short Video Card                                                   */
/* ------------------------------------------------------------------ */

interface ShortVideoCardProps {
  short: ShortVideo
  isActive: boolean
  isLiked: boolean
  onLikeToggle: () => void
  onCommentOpen: () => void
  onShare: () => void
  onCTAClick: () => void
  onDoubleTapLike: () => void
}

function ShortVideoCard({
  short,
  isActive,
  isLiked,
  onLikeToggle,
  onCommentOpen,
  onShare,
  onCTAClick,
  onDoubleTapLike,
}: ShortVideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [showHeart, setShowHeart] = useState(false)
  const lastTapRef = useRef<number>(0)
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const categoryStyle = CATEGORY_STYLES[short.category] ?? CATEGORY_STYLES.GENERAL
  const ctaLabel = short.linkedListingType
    ? CTA_LABELS[short.linkedListingType] ?? 'View'
    : null

  // Handle play/pause via postMessage to YouTube iframe
  useEffect(() => {
    if (!iframeRef.current) return
    const command = isPlaying
      ? '{"event":"command","func":"playVideo","args":""}'
      : '{"event":"command","func":"pauseVideo","args":""}'
    iframeRef.current.contentWindow?.postMessage(command, '*')
  }, [isPlaying])

  // Reset state when card is not active
  useEffect(() => {
    if (!isActive) {
      setIsPlaying(false)
      setHasStarted(false)
    }
  }, [isActive])

  // Handle tap (single = play/pause, double = like)
  const handleTap = useCallback(() => {
    const now = Date.now()
    const timeSinceLastTap = now - lastTapRef.current
    lastTapRef.current = now

    if (timeSinceLastTap < 300) {
      // Double tap — like
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current)
        tapTimeoutRef.current = null
      }
      if (!isLiked) {
        onDoubleTapLike()
      }
      setShowHeart(true)
      setTimeout(() => setShowHeart(false), 700)
    } else {
      // Single tap — schedule play/pause (cancel if double tap follows)
      tapTimeoutRef.current = setTimeout(() => {
        setIsPlaying((prev) => !prev)
      }, 300)
    }
  }, [isLiked, onDoubleTapLike])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current)
    }
  }, [])

  const avatarInitial = short.uploader.fullName?.charAt(0)?.toUpperCase() || '?'
  const avatarSrc = short.uploader.avatarUrl

  return (
    <div className="relative w-full h-full snap-start snap-always shrink-0 overflow-hidden bg-black select-none">
      {/* ---- YouTube Iframe (background) ---- */}
      <div className="absolute inset-0">
        {!hasStarted ? (
          <div 
            className="w-full h-full relative cursor-pointer flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation()
              setHasStarted(true)
              setIsPlaying(true)
            }}
          >
            <img 
              src={`https://img.youtube.com/vi/${short.youtubeVideoId}/hqdefault.jpg`} 
              className="w-full h-full object-cover opacity-80" 
              alt={short.title} 
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <PlayCircle className="w-16 h-16 text-white drop-shadow-2xl" />
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${short.youtubeVideoId}?autoplay=1&loop=1&controls=0&playsinline=1&enablejsapi=1&playlist=${short.youtubeVideoId}&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1`}
            className="absolute inset-0 w-full h-full"
            style={{
              transform: 'scale(1.02)',
              transformOrigin: 'center center',
            }}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            frameBorder="0"
            title={short.title}
          />
        )}
      </div>

      {/* ---- Semi-transparent overlay for readability ---- */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* ---- Play/Pause Indicator ---- */}
      <AnimatePresence>
        {!isPlaying && isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-black/40 backdrop-blur-sm rounded-full p-5">
              <Play className="w-12 h-12 text-white ml-1" fill="white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Double-tap Heart Animation ---- */}
      <DoubleTapHeart show={showHeart} />

      {/* ---- Tap area for play/pause and double-tap ---- */}
      <div
        className="absolute inset-0 z-10"
        style={{ touchAction: 'manipulation' }}
        onClick={handleTap}
      />

      {/* ---- Right Side Action Bar ---- */}
      <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-5">
        {/* Profile Avatar */}
        <div className="relative">
          <Avatar className="w-11 h-11 ring-2 ring-white shadow-lg">
            {avatarSrc ? (
              <AvatarImage src={avatarSrc} alt={short.uploader.fullName} />
            ) : null}
            <AvatarFallback
              className="text-sm font-bold"
              style={{ backgroundColor: '#374151', color: GOLD }}
            >
              {avatarInitial}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Like Button */}
        <ActionButton
          count={short.likesCount}
          active={isLiked}
          activeColor="#ef4444"
          onClick={(e?: React.MouseEvent) => {
            e?.stopPropagation()
            onLikeToggle()
          }}
        >
          <motion.div
            key={isLiked ? 'liked' : 'unliked'}
            initial={{ scale: isLiked ? 0.5 : 1 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Heart
              className="w-6 h-6"
              fill={isLiked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={isLiked ? 0 : 2}
              style={{ color: isLiked ? '#ef4444' : 'white' }}
            />
          </motion.div>
        </ActionButton>

        {/* Comment Button */}
        <ActionButton
          count={short.commentsCount}
          onClick={(e?: React.MouseEvent) => {
            e?.stopPropagation()
            onCommentOpen()
          }}
        >
          <MessageSquare className="w-6 h-6 text-white" fill="none" />
        </ActionButton>

        {/* Share Button */}
        <ActionButton
          count={short.sharesCount}
          onClick={(e?: React.MouseEvent) => {
            e?.stopPropagation()
            onShare()
          }}
        >
          <Share2 className="w-5 h-5 text-white" />
        </ActionButton>

        {/* CTA Button (if linked listing) */}
        {short.linkedListingId && ctaLabel && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCTAClick()
            }}
            className="flex flex-col items-center gap-1 group"
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: GOLD }}
            >
              {short.linkedListingType === 'real_estate' ? (
                <MapPin className="w-5 h-5 text-black" />
              ) : (
                <ShoppingBag className="w-5 h-5 text-black" />
              )}
            </motion.div>
            <span className="text-[10px] font-bold text-white/80">{ctaLabel}</span>
          </button>
        )}
      </div>

      {/* ---- Bottom Info Area ---- */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        {/* Gradient overlay */}
        <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-24 pb-6 px-4">
          {/* Badges row */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap pointer-events-auto">
            {/* City tag */}
            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-white/15 backdrop-blur-sm text-white/80 px-2 py-0.5 rounded-full">
              <MapPin className="w-2.5 h-2.5" />
              {short.cityName}
            </span>

            {/* Category badge */}
            <span
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm',
                categoryStyle.bg,
                categoryStyle.text
              )}
            >
              {categoryStyle.label}
            </span>

            {/* Pinned */}
            {short.isPinned && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <Pin className="w-2.5 h-2.5" />
                Pinned
              </span>
            )}

            {/* Promoted */}
            {short.isPromoted && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <Star className="w-2.5 h-2.5" fill="currentColor" />
                Promoted
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 mb-1 pointer-events-auto">
            {short.title}
          </h3>

          {/* Uploader name */}
          <p className="text-white/60 text-sm font-medium">{short.uploader.fullName}</p>
        </div>
      </div>

      {/* ---- Progress bar for active card ---- */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 z-30 h-[2px] bg-white/10">
          <motion.div
            className="h-full"
            style={{ backgroundColor: GOLD }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 15, ease: 'linear' }}
          />
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                   */
/* ------------------------------------------------------------------ */

function ShortSkeleton() {
  return (
    <div className="w-full h-full snap-start snap-always shrink-0 bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
        <p className="text-zinc-600 text-sm">Loading shorts...</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */

function EmptyShorts() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black text-center px-8">
      <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
        <Play className="w-8 h-8 text-zinc-600" />
      </div>
      <h3 className="text-white text-lg font-semibold mb-1">No Shorts Yet</h3>
      <p className="text-zinc-500 text-sm max-w-xs">
        Short videos from your city will appear here. Check back soon!
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  ManaShortsFeed - Main Container                                    */
/* ------------------------------------------------------------------ */

export default function ManaShortsFeed() {
  /* ---- Store ---- */
  const currentCity = useAppStore((s) => s.currentCity)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const setSelectedListing = useAppStore((s) => s.setSelectedListing)

  /* ---- State ---- */
  const [shorts, setShorts] = useState<ShortVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [likedShorts, setLikedShorts] = useState<Set<string>>(new Set())
  const [commentsSheetOpen, setCommentsSheetOpen] = useState(false)
  const [commentsShortId, setCommentsShortId] = useState<string | null>(null)
  const [comments, setComments] = useState<ShortComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)

  /* ---- Refs ---- */
  const containerRef = useRef<HTMLDivElement>(null)
  const shortsFetchedRef = useRef(false)

  /* ---- Fetch shorts ---- */
  useEffect(() => {
    if (shortsFetchedRef.current) return
    const cityId = currentCity?.id
    if (!cityId) {
      setLoading(false)
      return
    }

    shortsFetchedRef.current = true
    setLoading(true)

    fetch(`/api/shorts?cityId=${cityId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.shorts ?? []
        setShorts(items)
      })
      .catch(() => {
        setShorts([])
      })
      .finally(() => setLoading(false))
  }, [currentCity?.id])

  /* ---- Scroll observer for active index ---- */
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const itemHeight = container.clientHeight
      const newIdx = Math.round(scrollTop / itemHeight)
      if (newIdx !== activeIndex && newIdx >= 0 && newIdx < shorts.length) {
        setActiveIndex(newIdx)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [activeIndex, shorts.length])

  /* ---- Like toggle ---- */
  const handleLikeToggle = useCallback(
    async (shortId: string) => {
      const isLiked = likedShorts.has(shortId)

      // Optimistic update
      setLikedShorts((prev) => {
        const next = new Set(prev)
        if (isLiked) next.delete(shortId)
        else next.add(shortId)
        return next
      })

      // Update local count
      setShorts((prev) =>
        prev.map((s) =>
          s.id === shortId
            ? { ...s, likesCount: Math.max(0, s.likesCount + (isLiked ? -1 : 1)) }
            : s
        )
      )

      try {
        await fetch(`/api/shorts/${shortId}/like`, { method: 'POST' })
      } catch {
        // Revert on failure
        setLikedShorts((prev) => {
          const next = new Set(prev)
          if (isLiked) next.add(shortId)
          else next.delete(shortId)
          return next
        })
        setShorts((prev) =>
          prev.map((s) =>
            s.id === shortId
              ? { ...s, likesCount: Math.max(0, s.likesCount + (isLiked ? 1 : -1)) }
              : s
          )
        )
      }
    },
    [likedShorts]
  )

  /* ---- Double-tap like ---- */
  const handleDoubleTapLike = useCallback(
    (shortId: string) => {
      if (!likedShorts.has(shortId)) {
        handleLikeToggle(shortId)
      }
    },
    [likedShorts, handleLikeToggle]
  )

  /* ---- Comments ---- */
  const handleCommentOpen = useCallback(async (shortId: string) => {
    setCommentsShortId(shortId)
    setCommentsSheetOpen(true)
    setCommentsLoading(true)
    setComments([])

    try {
      const res = await fetch(`/api/shorts/${shortId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(Array.isArray(data) ? data : data?.comments ?? [])
      }
    } catch {
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }, [])

  const handleAddComment = useCallback(
    async (content: string) => {
      if (!commentsShortId) return

      const tempId = `temp-${Date.now()}`
      const newComment: ShortComment = {
        id: tempId,
        content,
        createdAt: new Date().toISOString(),
        user: {
          id: 'me',
          fullName: 'You',
          avatarUrl: null,
        },
      }

      // Optimistic add
      setComments((prev) => [...prev, newComment])
      setShorts((prev) =>
        prev.map((s) =>
          s.id === commentsShortId
            ? { ...s, commentsCount: s.commentsCount + 1 }
            : s
        )
      )

      try {
        const res = await fetch(`/api/shorts/${commentsShortId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        })
        if (res.ok) {
          const saved = await res.json()
          // Replace temp with server response
          setComments((prev) =>
            prev.map((c) => (c.id === tempId ? (saved as ShortComment) : c))
          )
        }
      } catch {
        // Remove optimistic comment on failure
        setComments((prev) => prev.filter((c) => c.id !== tempId))
        setShorts((prev) =>
          prev.map((s) =>
            s.id === commentsShortId
              ? { ...s, commentsCount: Math.max(0, s.commentsCount - 1) }
              : s
          )
        )
      }
    },
    [commentsShortId]
  )

  /* ---- Share ---- */
  const handleShare = useCallback(
    async (short: ShortVideo) => {
      const url = `${window.location.origin}/shorts/${short.id}`
      const shareData = {
        title: short.title,
        text: `Check out this short: ${short.title}`,
        url,
      }

      try {
        if (navigator.share) {
          await navigator.share(shareData)
        } else {
          await navigator.clipboard.writeText(url)
        }
      } catch {
        // Fallback: copy link
        try {
          await navigator.clipboard.writeText(url)
        } catch {
          // silent fail
        }
      }

      // Update shares count
      setShorts((prev) =>
        prev.map((s) => (s.id === short.id ? { ...s, sharesCount: s.sharesCount + 1 } : s))
      )

      // Fire-and-forget share API call
      fetch(`/api/shorts/${short.id}/share`, { method: 'POST' }).catch(() => {})
    },
    []
  )

  /* ---- CTA Click ---- */
  const handleCTAClick = useCallback(
    (short: ShortVideo) => {
      if (short.linkedListingId) {
        setSelectedListing(short.linkedListingId)
        navigateTo('listing')
      }
    },
    [setSelectedListing, navigateTo]
  )

  /* ---- Current short for comments ---- */
  const currentCommentShort = useMemo(
    () => shorts.find((s) => s.id === commentsShortId),
    [shorts, commentsShortId]
  )

  /* ---- Render ---- */
  return (
    <div className="relative h-[calc(100dvh-4rem)] w-full bg-black overflow-hidden">
      {/* ---- Scroll Container ---- */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        <style>{`
          div[data-shorts-container]::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {loading ? (
          <ShortSkeleton />
        ) : shorts.length === 0 ? (
          <EmptyShorts />
        ) : (
          shorts.map((short, idx) => (
            <ShortVideoCard
              key={short.id}
              short={short}
              isActive={idx === activeIndex}
              isLiked={likedShorts.has(short.id)}
              onLikeToggle={() => handleLikeToggle(short.id)}
              onCommentOpen={() => handleCommentOpen(short.id)}
              onShare={() => handleShare(short)}
              onCTAClick={() => handleCTAClick(short)}
              onDoubleTapLike={() => handleDoubleTapLike(short.id)}
            />
          ))
        )}
      </div>

      {/* ---- Top gradient + header bar ---- */}
      <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="bg-gradient-to-b from-black/60 to-transparent pb-8 pt-3 px-4">
          <div className="flex items-center justify-between pointer-events-auto">
            <h2 className="text-white font-bold text-lg tracking-tight">
              <span style={{ color: GOLD }}>Mana</span> Shorts
            </h2>
            <div className="flex items-center gap-1">
              {shorts.length > 0 && (
                <span className="text-white/40 text-xs">
                  {activeIndex + 1}/{shorts.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Comment Bottom Sheet ---- */}
      <CommentSheet
        open={commentsSheetOpen}
        onOpenChange={setCommentsSheetOpen}
        shortId={commentsShortId ?? ''}
        comments={comments}
        onAddComment={handleAddComment}
        loading={commentsLoading}
      />
    </div>
  )
}


