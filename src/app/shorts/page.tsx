'use client'

import { useEffect, useState, useRef } from 'react'

import { useInView } from 'react-intersection-observer'
import { Loader2, MessageCircle, PlayCircle } from 'lucide-react'



interface ShortVideo {
  id: string
  youtubeUrl: string
  title: string
  channel: {
    channelName: string
  }
}

export default function ShortsPage() {
  const [shorts, setShorts] = useState<ShortVideo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchShorts = async () => {
      try {
        const res = await fetch('/api/shorts/feed')
        if (res.ok) {
          const data = await res.json()
          setShorts(data.shorts || [])
        }
      } catch (e) {
        console.error('Error fetching shorts:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchShorts()
  }, [])

  const openWhatsApp = () => {
    window.open('https://wa.me/918790083706?text=హలో, నేను చౌటుప్పల్ యాప్లో నా వీడియో ప్రమోట్ చేయాలనుకుంటున్నాను', '_blank')
  }

  if (loading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  if (shorts.length === 0) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-black text-white p-4 text-center">
        <p className="text-xl font-bold mb-2">No videos yet</p>
        <p className="text-white/60">Check back later for new content.</p>
      </div>
    )
  }

  return (
    <div className="relative h-[100dvh] w-full bg-black overflow-hidden">
      {/* Scroll Snap Container */}
      <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide pb-[env(safe-area-inset-bottom,0px)]">
        {shorts.map((short) => (
          <ShortPlayer key={short.id} short={short} />
        ))}
        {/* Padding for bottom nav */}
        <div className="h-20 snap-end"></div>
      </div>

      {/* Floating WhatsApp CTA */}
      <div className="fixed bottom-20 left-4 right-4 z-50 bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center justify-between shadow-2xl pointer-events-auto">
        <p className="text-white font-medium text-sm">🌟 మీ వీడియో ఇక్కడ రావాలా?</p>
        <button 
          onClick={openWhatsApp} 
          className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 px-4 rounded-full shadow-lg shrink-0"
        >
          వాట్సాప్ చేయండి
        </button>
      </div>
    </div>
  )
}

function ShortPlayer({ short }: { short: ShortVideo }) {
  const { ref, inView } = useInView({
    threshold: 0.6,
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const videoId = short.youtubeUrl.split('v=')[1]

  useEffect(() => {
    if (!inView) {
      setIsPlaying(false)
    }
  }, [inView])

  return (
    <div ref={ref} className="h-screen w-full snap-start relative flex items-center justify-center bg-black group">
      <div className="absolute inset-0 z-0">
        {!isPlaying ? (
          <div 
            className="w-full h-full relative cursor-pointer flex items-center justify-center"
            onClick={() => setIsPlaying(true)}
          >
            <img 
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} 
              className="w-full h-full object-cover opacity-80" 
              alt={short.title} 
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <PlayCircle className="w-16 h-16 text-white drop-shadow-2xl" />
            </div>
          </div>
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            className="w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            frameBorder="0"
            title={short.title}
          />
        )}
      </div>

      {/* Top Gradient for text readability */}
      {!isPlaying && (
        <div className="absolute top-0 left-0 w-full p-4 pt-12 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none">
          <h2 className="text-white font-bold text-lg drop-shadow-md">{short.channel.channelName}</h2>
          <p className="text-white/80 text-sm line-clamp-2 drop-shadow-md">{short.title}</p>
        </div>
      )}
    </div>
  )
}
