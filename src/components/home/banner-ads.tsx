'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import useSWR from 'swr'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface BannerAd {
  id: string
  title: string
  imageUrl: string | null
  shopName: string
  offerText: string | null
  linkUrl: string | null
  isActive: boolean
}

const FALLBACK_ADS: BannerAd[] = [
  {
    id: 'fallback-1',
    title: '🎯 List Your Business — Just ₹99/Day!',
    imageUrl: null,
    shopName: 'Choutuppal Super App',
    offerText: 'ఉచితంగా లిస్ట్ చేయండి!',
    linkUrl: null,
    isActive: true,
  },
  {
    id: 'fallback-2',
    title: '🏠 Premium Real Estate Listings',
    imageUrl: null,
    shopName: 'Choutuppal Premium',
    offerText: '3x ఎక్కువ ఎంక్వైరీలు!',
    linkUrl: null,
    isActive: true,
  },
  {
    id: 'fallback-3',
    title: '📱 Get Your Business Online',
    imageUrl: null,
    shopName: 'Daily Spin Wheel',
    offerText: 'రోజూ కాయిన్స్ గెలుచ్చి!',
    linkUrl: null,
    isActive: true,
  },
]

const AD_GRADIENTS = [
  'from-[#D4AF37]/30 via-[#4169E1]/10 to-[#D4AF37]/20',
  'from-[#4169E1]/30 via-[#D4AF37]/10 to-[#4169E1]/20',
  'from-[#D4AF37]/20 via-[#4169E1]/20 to-[#D4AF37]/30',
]

export function BannerAds() {
  const [ads, setAds] = useState<BannerAd[]>(FALLBACK_ADS)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Refs for swipe gesture tracking on main carousel
  const carouselRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const isDragging = useRef(false)

  // Refs for swipe in lightbox
  const lightboxRef = useRef<HTMLDivElement>(null)
  const lbTouchStartX = useRef(0)

  const { data } = useSWR(
    `/api/banners?active=true`,
    (url: string) => fetch(url, { cache: 'no-store' }).then(res => res.json()),
    { revalidateOnMount: true, revalidateIfStale: true, revalidateOnFocus: false }
  )

  useEffect(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      setAds(data)
    } else if (data && Array.isArray(data) && data.length === 0) {
      setAds(FALLBACK_ADS)
    }
    setLoading(false)
  }, [data])

  const adsCount = ads.length

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % adsCount)
  }, [adsCount])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + adsCount) % adsCount)
  }, [adsCount])

  // Auto-scroll (pauses when lightbox open)
  useEffect(() => {
    if (isLightboxOpen) return
    const interval = setInterval(goToNext, 4000)
    return () => clearInterval(interval)
  }, [goToNext, isLightboxOpen])

  // Main carousel swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    isDragging.current = true
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    // Optional: prevent default if you want to stop vertical scroll while swiping horizontally
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      if (diff > 0) goToNext(); else goToPrev()
    }
    isDragging.current = false
  }

  // Lightbox navigation
  const lightboxNext = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % adsCount)
  }, [adsCount])
  const lightboxPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + adsCount) % adsCount)
  }, [adsCount])

  const handleLbTouchStart = (e: React.TouchEvent) => {
    lbTouchStartX.current = e.touches[0].clientX
  }
  const handleLbTouchMove = (e: React.TouchEvent) => {
    // track move
  }
  const handleLbTouchEnd = (e: React.TouchEvent) => {
    const diff = lbTouchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      if (diff > 0) lightboxNext(); else lightboxPrev()
    }
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setIsLightboxOpen(true)
  }

  if (loading) {
    return (
      <div className="w-full bg-white py-3">
        <div className="px-4">
          <div className="w-full aspect-[16/9] bg-gray-100 animate-pulse rounded-lg" />
        </div>
      </div>
    )
  }

  const currentAd = ads[currentIndex]
  const hasImage = !!currentAd?.imageUrl

  return (
    <div className="w-full bg-white py-3 relative z-10">
      {/* ─── Main Swipeable Banner ─── */}
      <div
        ref={carouselRef}
        className="relative w-full overflow-hidden px-4 cursor-pointer pointer-events-auto touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => openLightbox(currentIndex)}
      >
        <div
          className="w-full aspect-[16/9] md:max-w-3xl md:mx-auto md:rounded-xl md:my-4 overflow-hidden bg-gray-100 rounded-lg relative shadow-sm border-2 border-transparent"
          style={{
            backgroundClip: 'padding-box, border-box',
            backgroundImage: 'linear-gradient(white, white), linear-gradient(to right, #4169E1, #D4AF37)',
          }}
        >
          {hasImage ? (
            <img
              src={currentAd.imageUrl!}
              alt={currentAd.title || 'Promotion'}
              className="w-full h-full object-cover rounded-lg"
              fetchPriority="high"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-r ${AD_GRADIENTS[currentIndex % AD_GRADIENTS.length]} flex items-center justify-center`}>
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(212,175,55,0.3) 10px, rgba(212,175,55,0.3) 11px)',
              }} />
              <div className="relative z-10 text-center px-6">
                {currentAd?.offerText && (
                  <p className="text-xs sm:text-sm font-bold text-[#D4AF37] mb-1">{currentAd.offerText}</p>
                )}
                <p className="text-sm sm:text-base font-bold text-gray-800 leading-tight">{currentAd?.title}</p>
              </div>
            </div>
          )}

          {/* Offer badge */}
          {currentAd?.offerText && (
            <div className="absolute top-2 right-2 bg-[#D4AF37] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md z-10">
              {currentAd.offerText}
            </div>
          )}

          {/* Glassmorphism Bottom Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/60 backdrop-blur-md p-2 z-10">
            <p className="text-xs font-bold text-gray-900 truncate">
              {currentAd?.shopName || currentAd?.title || 'Choutuppal Super App'}
            </p>
            <p className="text-[10px] text-gray-700 truncate">
              {currentAd?.shopName ? currentAd.title : 'Promoted listing on Choutuppal'}
            </p>
          </div>
        </div>
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center items-center gap-1 mt-2">
        {ads.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'w-4 bg-[#D4AF37]' : 'w-1.5 bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* ─── Full-Screen Lightbox ─── */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 bg-black/95 z-[99999] flex flex-col items-center justify-center pointer-events-auto touch-none"
          onClick={(e) => { if (e.target === e.currentTarget) setIsLightboxOpen(false) }}
        >
          {/* Close button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full z-[110] transition-colors"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-semibold z-[110]">
            {lightboxIndex + 1} / {adsCount}
          </div>

          {/* Swipeable content area */}
          <div
            className="w-full max-w-2xl px-4 flex items-center justify-center pointer-events-auto"
            onTouchStart={handleLbTouchStart}
            onTouchMove={handleLbTouchMove}
            onTouchEnd={handleLbTouchEnd}
          >
            {/* Prev arrow */}
            {adsCount > 1 && (
              <button
                onClick={lightboxPrev}
                className="hidden sm:flex shrink-0 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full mr-4 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Active slide */}
            <div className="flex-1 flex items-center justify-center">
              {ads[lightboxIndex]?.imageUrl ? (
                <img
                  src={ads[lightboxIndex].imageUrl!}
                  alt={ads[lightboxIndex].title || 'Banner'}
                  className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className={`w-full aspect-[16/9] bg-gradient-to-r ${AD_GRADIENTS[lightboxIndex % AD_GRADIENTS.length]} rounded-xl flex items-center justify-center p-8`}>
                  <div className="text-center">
                    {ads[lightboxIndex]?.offerText && (
                      <p className="text-[#D4AF37] font-bold text-lg mb-2">{ads[lightboxIndex].offerText}</p>
                    )}
                    <p className="text-gray-800 font-bold text-xl">{ads[lightboxIndex]?.title}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Next arrow */}
            {adsCount > 1 && (
              <button
                onClick={lightboxNext}
                className="hidden sm:flex shrink-0 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full ml-4 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Caption */}
          <div className="mt-4 text-center px-4">
            <p className="text-white font-semibold text-sm">{ads[lightboxIndex]?.shopName}</p>
            <p className="text-white/60 text-xs mt-0.5">{ads[lightboxIndex]?.title}</p>
          </div>

          {/* Dot indicators inside lightbox */}
          {adsCount > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-4">
              {ads.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === lightboxIndex ? 'w-5 h-1.5 bg-[#D4AF37]' : 'w-1.5 h-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Mobile swipe hint */}
          <p className="mt-3 text-white/40 text-xs sm:hidden">Swipe to browse</p>
        </div>
      )}
    </div>
  )
}
