'use client'

import { useEffect, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { useAppStore } from '@/lib/store'

interface Announcement {
  id: string
  text: string
  isActive: boolean
  citySlug: string | null
}

export function AnnouncementTicker() {
  const selectedCity = useAppStore((s) => s.selectedCity)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [ready, setReady] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch('/api/announcements?activeOnly=true')
        if (res.ok) {
          const data: Announcement[] = await res.json()
          if (Array.isArray(data)) {
            const filtered = data.filter(
              (a) => !a.citySlug || a.citySlug === selectedCity
            )
            setAnnouncements(filtered)
          }
        }
      } catch {
        // Silently fail — ticker is non-critical
      } finally {
        setReady(true)
      }
    }
    fetch_()
  }, [selectedCity])

  if (!ready || announcements.length === 0) return null

  // Join with bullet separators, triple for seamless CSS marquee loop
  const tickerText = announcements.map((a) => a.text).join('   •   ')
  const repeatedText = `${tickerText}   •   ${tickerText}   •   ${tickerText}`

  return (
    <div className="w-full flex items-center bg-yellow-400 overflow-hidden select-none">
      
      {/* Pause / Play toggle button (moved to front) */}
      <button
        onClick={() => setIsPaused((p) => !p)}
        className="flex-shrink-0 flex items-center justify-center w-12 h-full bg-yellow-500 hover:bg-yellow-600 transition-colors self-stretch shadow-[2px_0_10px_rgba(0,0,0,0.1)] z-10"
        aria-label={isPaused ? 'Resume ticker' : 'Pause ticker'}
        title={isPaused ? 'Resume' : 'Pause'}
      >
        {isPaused ? (
          <Play className="w-4 h-4 text-black" fill="currentColor" />
        ) : (
          <Pause className="w-4 h-4 text-black" fill="currentColor" />
        )}
      </button>

      {/* Scrolling ticker text */}
      <div 
        className="flex-1 overflow-hidden py-2.5"
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className="flex whitespace-nowrap"
          style={{
            animation: 'ticker-scroll 10s linear infinite',
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          <span className="text-black text-[13px] font-bold px-6 whitespace-nowrap">
            {repeatedText}
          </span>
        </div>
      </div>

      {/* Inline keyframe style */}
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  )
}
