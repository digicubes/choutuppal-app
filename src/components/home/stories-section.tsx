'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Play, Music } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useAuth } from '@/lib/auth-context'
import { Skeleton } from '@/components/ui/skeleton'
import { OptimizedImage } from '@/components/optimized-image'

// Using next/dynamic with ssr: false to avoid window is not defined errors
// and hydration mismatches for heavy touch-based components.
import dynamic from 'next/dynamic'

const StoryViewer = dynamic(() => import('@/components/story-viewer'), { ssr: false })
const StoryCreator = dynamic(() => import('@/components/story-creator'), { ssr: false })

interface StoryItem {
  id: string
  title: string
  mediaType: 'IMAGE' | 'VIDEO'
  mediaUrl: string
  musicId: string | null
  musicName: string | null
  isPremium: boolean
  viewsCount: number
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

// Fallback placeholder SVG
const PLACEHOLDER_AVATAR =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIzMiIgZmlsbD0iI0YzRjRGNiIvPjx0ZXh0IHg9IjMyIiB5PSIzNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI0Q0QUYzNyIgZm9udC1zaXplPSIyMCI+8J+OpzwvdGV4dD48L3N2Zz4='

export function StoriesSection() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const selectedCity = useAppStore((s) => s.selectedCity)
  const { user, isAuthenticated } = useAuth()
  const [stories, setStories] = useState<StoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cityId, setCityId] = useState<string | null>(null)

  // Story Viewer state
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerStoryIndex, setViewerStoryIndex] = useState(0)

  // Story Creator state
  const [creatorOpen, setCreatorOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Viewed stories tracking (in-memory, per session)
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set())

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

  // Fetch stories
  const fetchStories = useCallback(() => {
    if (!cityId) return
    setLoading(true)
    fetch(`/api/stories?cityId=${cityId}`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setStories(Array.isArray(data) ? data : []))
      .catch(() => setStories([]))
      .finally(() => setLoading(false))
  }, [cityId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchStories() }, [fetchStories])

  // Handle story click - open viewer
  const handleStoryClick = (index: number) => {
    setViewerStoryIndex(index)
    setViewerOpen(true)
    // Mark as viewed
    const story = stories[index]
    if (story) {
      setViewedStories(prev => new Set([...prev, story.id]))
    }
  }

  // Handle "Your Story" click
  const handleYourStoryClick = () => {
    if (!isAuthenticated) return
    fileInputRef.current?.click()
  }

  // ─── ALWAYS render the Stories row — never return null ───
  // This ensures the Stories section is always visible below the Header,
  // even when there are no stories in the database yet.
  return (
    <>
      {/* z-20 ensures Stories stays above Banner/Hero content */}
      <div className="w-full bg-white border-b border-gray-100 py-3 relative z-20">
        {/* Horizontal Scroll Container */}
        <div className="flex overflow-x-auto gap-4 px-4 scrollbar-hide">

          {/* 1. "Add Your Story" Button — always visible */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button
              onClick={handleYourStoryClick}
              className="relative w-[68px] h-[68px] rounded-full flex items-center justify-center transition-transform active:scale-95"
            >
              {isAuthenticated && user?.avatarUrl ? (
                <div className="w-full h-full rounded-full border-2 border-transparent overflow-hidden relative">
                  <OptimizedImage
                    src={user.avatarUrl}
                    alt="Your Story"
                    fill
                    style={{ objectFit: 'cover' }}
                    fallbackType="avatar"
                  />
                </div>
              ) : (
                <div className="w-full h-full rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  <span className="text-gray-400 font-bold text-xs">You</span>
                </div>
              )}
              {/* Overlaid + Icon (WhatsApp style) */}
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10">
                <Plus className="text-white" strokeWidth={3} size={14} />
              </div>
            </button>
            <span className="text-[10px] text-gray-500 w-16 text-center truncate font-medium">Your Story</span>
          </div>

          {/* 2. Loading skeletons */}
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
              <Skeleton className="w-[68px] h-[68px] rounded-full" />
              <Skeleton className="w-16 h-3 rounded" />
            </div>
          ))}

          {/* 3. Empty state placeholder when no stories and not loading */}
          {!loading && stories.length === 0 && (
            <div className="flex items-center gap-3 px-2">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-[68px] h-[68px] rounded-full bg-gradient-to-br from-[#4169E1]/10 to-[#D4AF37]/10 flex items-center justify-center border border-gray-200">
                  <Play className="w-5 h-5 text-[#4169E1]/40" />
                </div>
                <span className="text-[10px] text-gray-400 w-16 text-center truncate font-medium">Coming Soon</span>
              </div>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-[68px] h-[68px] rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-[#4169E1]/10 flex items-center justify-center border border-gray-200">
                  <Music className="w-5 h-5 text-[#D4AF37]/40" />
                </div>
                <span className="text-[10px] text-gray-400 w-16 text-center truncate font-medium">Music</span>
              </div>
            </div>
          )}

          {/* 4. Map through actual stories */}
          {!loading && stories.map((story, index) => {
            const isViewed = viewedStories.has(story.id)
            const hasVideo = story.mediaType === 'VIDEO'
            const hasMusic = !!story.musicId
            const isPremium = story.isPremium || story.user?.subscriptionTier === 'premium' || story.user?.subscriptionTier === 'pro'

            return (
              <button
                key={story.id}
                onClick={() => handleStoryClick(index)}
                className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group transition-all duration-200 active:scale-95"
              >
                {/* Avatar Ring Logic */}
                <div className="relative">
                  <div
                    className={`w-[68px] h-[68px] rounded-full flex items-center justify-center p-[2px] transition-opacity ${
                      isPremium
                        ? 'bg-gradient-to-tr from-[#D4AF37] to-[#FDB931] shadow-md shadow-yellow-200'
                        : isViewed
                          ? 'bg-gray-200 opacity-50'
                          : 'bg-gradient-to-tr from-blue-600 to-purple-600'
                    }`}
                  >
                    <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gray-100 relative">
                      <OptimizedImage
                        src={story.mediaUrl || PLACEHOLDER_AVATAR}
                        alt={story.title}
                        fill
                        style={{ objectFit: 'cover' }}
                        fallbackType="avatar"
                      />
                    </div>
                  </div>

                  {/* Video / Music indicator badges */}
                  {(hasVideo || hasMusic) && (
                    <div className="absolute -bottom-0.5 -right-0.5 flex gap-0.5">
                      {hasVideo && (
                        <div className="w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center">
                          <Play className="w-2.5 h-2.5 text-[#4169E1] fill-[#4169E1]" />
                        </div>
                      )}
                      {hasMusic && (
                        <div className="w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center">
                          <Music className="w-2.5 h-2.5 text-[#D4AF37]" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Name Text */}
                <span className={`text-[10px] w-16 text-center truncate font-medium ${
                  isViewed ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  {story.user?.fullName || story.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Story Viewer - handles its own AnimatePresence internally */}
      {viewerOpen && (
        <StoryViewer
          stories={stories}
          initialStoryIndex={viewerStoryIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {/* Story Creator — mounts immediately so it can fire the native file picker.
          cityId/userId are passed but the component handles loading gracefully. */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            setPendingFile(file)
            setCreatorOpen(true)
          }
          e.target.value = ''
        }}
      />

      {/* Story Creator */}
      {creatorOpen && (
        <StoryCreator
          isOpen={creatorOpen}
          onClose={() => {
            setCreatorOpen(false)
            setPendingFile(null)
          }}
          cityId={cityId ?? ''}
          userId={user?.id ?? ''}
          onStoryCreated={() => {
            setCreatorOpen(false)
            setPendingFile(null)
            fetchStories()
          }}
          preselectedFile={pendingFile}
        />
      )}
    </>
  )
}
