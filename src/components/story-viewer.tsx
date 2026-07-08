'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, VolumeX, Pause, Play, Trash2, Eye, Heart, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface StoryItem {
  id: string
  title: string
  mediaType: 'IMAGE' | 'VIDEO'
  mediaUrl: string
  musicId: string | null
  musicName: string | null
  isPremium: boolean
  viewsCount: number
  views?: number
  likes?: number
  comments?: any
  replies?: any
  viewers?: any
  ctaLink?: string | null
  text?: string | null
  createdAt: string
  expiresAt: string
  user: {
    id: string
    fullName: string
    avatarUrl: string | null
    subscriptionTier: string
  }
  music: {
    id: string
    name: string
    audioUrl: string
    artist: string
  } | null
}

interface StoryViewerProps {
  stories: StoryItem[]
  initialStoryIndex: number
  onClose: () => void
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function groupByUser(stories: StoryItem[]): Map<string, StoryItem[]> {
  const map = new Map<string, StoryItem[]>()
  for (const s of stories) {
    const arr = map.get(s.user.id)
    if (arr) arr.push(s)
    else map.set(s.user.id, [s])
  }
  return map
}

const IMAGE_DURATION = 5000 // 5 seconds for images

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function StoryViewer({ stories, initialStoryIndex, onClose }: StoryViewerProps) {
  const userGroups = useMemo(() => groupByUser(stories), [stories])
  const userIds = useMemo(() => [...userGroups.keys()], [userGroups])

  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.min(initialStoryIndex, Math.max(stories.length - 1, 0))
  )

  const { user: currentUser } = useAuth()
  const setShowBottomNav = useAppStore((s) => s.setShowBottomNav)
  const setIsStoryOpen = useAppStore((s) => s.setIsStoryOpen)

  // Portal & Lock setup
  useEffect(() => {
    setShowBottomNav(false)
    setIsStoryOpen(true)
    return () => {
      setShowBottomNav(true)
      setIsStoryOpen(false)
    }
  }, [setShowBottomNav, setIsStoryOpen])

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const bottomContainerRef = useRef<HTMLDivElement>(null)

  // Native event listener for preventing touch bleed-through
  useEffect(() => {
    if (!mounted) return
    const el = bottomContainerRef.current
    if (!el) return
    
    const blockTouch = (e: Event) => {
      e.stopPropagation()
    }
    
    el.addEventListener('touchstart', blockTouch, { passive: false })
    el.addEventListener('pointerdown', blockTouch, { passive: false })
    el.addEventListener('touchend', blockTouch, { passive: false })
    el.addEventListener('touchmove', blockTouch, { passive: false })
    
    return () => {
      el.removeEventListener('touchstart', blockTouch)
      el.removeEventListener('pointerdown', blockTouch)
      el.removeEventListener('touchend', blockTouch)
      el.removeEventListener('touchmove', blockTouch)
    }
  }, [mounted, currentIndex])

  const [localLikes, setLocalLikes] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [commentInput, setCommentInput] = useState('')

  const currentStory = stories[currentIndex] ?? null

  useEffect(() => {
    if (!currentStory) return
    setLocalLikes((currentStory as any).likes || 0)
    setIsLiked(false)
  }, [currentStory])

  const handleReplySubmit = async () => {
    if (!currentStory) return
    if (!currentUser) {
      toast.error('Please login to interact')
      return
    }
    if (!commentInput.trim()) return

    const text = commentInput.trim()
    setCommentInput('')
    toast.success('Reply sent!')

    try {
      await fetch(`/api/stories/${currentStory.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          userId: currentUser.id,
          fullName: currentUser.fullName || 'User',
          avatarUrl: currentUser.avatarUrl,
          text
        })
      })
    } catch (e) {
      console.error(e)
    }
  }

  const handleLikeClick = async () => {
    if (!currentStory) return
    if (!currentUser) {
      toast.error('Please login to interact')
      return
    }

    if (!isLiked) {
      setIsLiked(true)
      setLocalLikes((prev) => prev + 1)
      toast.success('Liked story!')

      try {
        await fetch(`/api/stories/${currentStory.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'like', userId: currentUser.id })
        })
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleDelete = async () => {
    if (!currentStory || !currentUser || currentUser.id !== currentStory.user.id) return
    if (confirm('Delete this story?')) {
      try {
        const res = await fetch(`/api/stories/${currentStory.id}`, { method: 'DELETE' })
        if (res.ok) {
          toast.success('Story deleted')
          onClose()
        }
      } catch (e) {
        toast.error('Failed to delete story')
      }
    }
  }

  /* ---- Auto-advance Logic ---- */
  const videoRef = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    if (!currentStory || paused) return
    let timeout: NodeJS.Timeout
    if (currentStory.mediaType === 'IMAGE') {
      timeout = setTimeout(() => handleNextStory(), IMAGE_DURATION)
    }
    return () => clearTimeout(timeout)
  }, [currentIndex, currentStory, paused])

  const handleNextStory = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      onClose()
    }
  }, [currentIndex, stories.length, onClose])

  const handlePrevStory = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }, [currentIndex])

  /* ---- Navigation Tap Areas ---- */
  const handleTap = (e: React.MouseEvent) => {
    const screenWidth = window.innerWidth
    const clickX = e.clientX
    if (clickX < screenWidth * 0.3) {
      handlePrevStory()
    } else {
      handleNextStory()
    }
  }

  // Ensure owner view tracks views properly by pinging the view endpoint if we are NOT the owner
  useEffect(() => {
    if (!currentStory || !currentUser || currentUser.id === currentStory.user.id) return
    const pingView = async () => {
      try {
        await fetch(`/api/stories/${currentStory.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'view', 
            userId: currentUser.id,
            fullName: currentUser.fullName || 'User',
            avatarUrl: currentUser.avatarUrl
          })
        })
      } catch (e) {
        console.error(e)
      }
    }
    pingView()
  }, [currentStory, currentUser])

  if (!mounted || !currentStory) return null

  // Current user group
  const userStories = userGroups.get(currentStory.user.id) || []
  const userStoryIndex = userStories.findIndex((s) => s.id === currentStory.id)

  const avatarInitial = currentStory.user.fullName?.charAt(0).toUpperCase() || 'U'
  const timeStr = formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })

  // Render Portal
  return createPortal(
    <AnimatePresence>
      <motion.div
        key="story-viewer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] w-screen h-[100dvh] bg-black flex flex-col touch-none isolation-auto pointer-events-auto overflow-hidden"
      >
        {/* Progress Bars & Controls */}
        <div className="absolute top-0 left-0 right-0 z-50 pt-2 px-2 pb-4 bg-gradient-to-b from-black/80 to-transparent flex flex-col pointer-events-none">
          <div className="flex gap-1 items-center mb-3">
            {userStories.map((s, idx) => {
              const isCompleted = idx < userStoryIndex
              const isActive = idx === userStoryIndex
              return (
                <div key={idx} className="h-1 flex-1 bg-white/30 rounded overflow-hidden">
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: isCompleted ? '100%' : '0%' }}
                    animate={{ width: isCompleted ? '100%' : isActive && !paused ? '100%' : isActive && paused ? '0%' : '0%' }}
                    transition={{
                      duration: isActive && !paused ? (s.mediaType === 'VIDEO' ? 15 : 5) : 0,
                      ease: 'linear'
                    }}
                  />
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between pointer-events-auto px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4169E1] to-[#D4AF37] text-white font-bold flex items-center justify-center text-sm flex-shrink-0 overflow-hidden shadow-lg border border-white/20">
                {currentStory.user.avatarUrl ? (
                  <img src={currentStory.user.avatarUrl} alt={currentStory.user.fullName} className="w-full h-full object-cover" />
                ) : avatarInitial}
              </div>
              <div className="flex flex-col drop-shadow-md">
                <span className="text-white font-bold text-sm tracking-wide">{currentStory.user.fullName}</span>
                <span className="text-white/80 text-[11px] font-medium">{timeStr}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {currentUser?.id === currentStory.user.id && (
                <button onClick={handleDelete} className="p-2 text-white/80 hover:text-red-500 transition-colors bg-black/20 rounded-full">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              {currentStory.mediaType === 'VIDEO' && (
                <button onClick={() => setMuted(!muted)} className="p-2 text-white bg-black/20 rounded-full hover:bg-white/20">
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              )}
              <button onClick={() => setPaused(!paused)} className="p-2 text-white bg-black/20 rounded-full hover:bg-white/20">
                {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
              <button onClick={onClose} className="p-2 text-white hover:text-white/80 bg-black/20 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Media Container - Object Contain WhatsApp Style */}
        <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden" onClick={handleTap}>
          {currentStory.mediaType === 'VIDEO' ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              muted={muted}
              onEnded={handleNextStory}
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt={currentStory.title}
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Caption below image */}
        {currentStory.text && (
          <div className="w-full bg-gradient-to-t from-black via-black/90 to-transparent p-5 pb-8 pt-10 text-center flex-shrink-0 z-20 pointer-events-none">
            <p className="text-white text-[15px] font-medium leading-relaxed drop-shadow-lg max-w-lg mx-auto">{currentStory.text}</p>
          </div>
        )}

        {/* Bottom Actions */}
        <div 
          ref={bottomContainerRef}
          className="w-full bg-black flex-shrink-0 z-[99999] pointer-events-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          {currentUser?.id === currentStory.user.id ? (
            // Owner View: Just Stats, No swipe drawer
            <div className="flex justify-center items-center gap-8 py-2">
              <div className="flex items-center gap-2 text-white/80 font-bold bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                <Eye className="w-5 h-5" />
                <span>{currentStory.viewsCount || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-white/80 font-bold bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                <Heart className="w-5 h-5" />
                <span>{localLikes || 0}</span>
              </div>
            </div>
          ) : (
            // Viewer View: Reply & Like
            <div className="flex items-center gap-3 w-full max-w-lg mx-auto">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={`Reply to ${currentStory.user.fullName}...`}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 rounded-full py-3.5 pl-5 pr-12 outline-none text-sm font-medium focus:border-white/50 focus:bg-white/15 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleReplySubmit()
                  }}
                />
                <button
                  onClick={handleReplySubmit}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all disabled:opacity-50"
                  disabled={!commentInput.trim()}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleLikeClick}
                className={`p-3.5 rounded-full backdrop-blur-md border transition-all pointer-events-auto ${
                  isLiked 
                    ? 'bg-red-500/20 border-red-500/50 text-red-500 scale-110' 
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>
          )}
        </div>

      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
