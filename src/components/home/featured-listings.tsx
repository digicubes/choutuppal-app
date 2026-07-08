'use client'

import { useEffect, useState } from 'react'
import { Star, MapPin, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { GlassCard } from '@/components/glass-card'
import ListingCard from '@/components/listing-card'
import { WhatsAppButton } from '@/components/whatsapp-button'
import { OptimizedImage } from '@/components/optimized-image'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface Listing {
  id: string
  slug: string
  name: string
  category: string
  description: string | null
  images: string | null
  coverImage: string | null
  logoUrl: string | null
  whatsappNumber: string | null
  address: string | null
  isPremium: boolean
  isFeatured: boolean
  viewsCount: number
  rating: number
  operatingHours: string | null
  user: {
    id: string
    fullName: string
    avatarUrl: string | null
  }
  _count: {
    reviews: number
    leads: number
  }
}
export function FeaturedListings() {
  const selectedCity = useAppStore((s) => s.selectedCity)
  const setSelectedListing = useAppStore((s) => s.setSelectedListing)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const [listings, setListings] = useState<Listing[]>([])
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

  // Fetch featured listings
  useEffect(() => {
    async function fetchListings() {
      if (!cityId) return
      setLoading(true)
      try {
        const res = await fetch(`/api/listings?cityId=${cityId}&isFeatured=true&limit=8`)
        if (res.ok) {
          const data = await res.json()
          const apiListings = data.listings || []
          // Use API data only
          setListings(apiListings)
        }
      } catch {
        setListings([])
      } finally {
        setLoading(false)
      }
    }
    fetchListings()
  }, [cityId])

  const handleCardClick = (slug: string) => {
    setSelectedListing(slug)
    navigateTo('listing')
  }

  const getFirstImage = (images: string | null): string => {
    if (!images) return ''
    try {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : ''
    } catch {
      return ''
    }
  }

  // Placeholder image SVG
  const placeholderImg =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNGM0Y0RjYiLz48dGV4dCB4PSIxMDAiIHk9IjY1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRDRBRjM3IiBmb250LXNpemU9IjIwIj7wn5GAPC90ZXh0Pjwvc3ZnPg=='

  // Category icon colors for dummy cards
  const categoryColors: Record<string, string> = {
    Tiffin: 'from-orange-400 to-orange-600',
    Medicals: 'from-red-400 to-red-600',
    Salons: 'from-purple-400 to-purple-600',
    Electronics: 'from-indigo-400 to-indigo-600',
    Plumbers: 'from-blue-400 to-blue-600',
    Education: 'from-teal-400 to-teal-600',
    Tailors: 'from-pink-400 to-pink-600',
    Automobiles: 'from-gray-400 to-gray-600',
    Services: 'from-[#4169E1] to-[#6B8DD6]',
    'Real Estate': 'from-[#D4AF37] to-[#FFD700]',
  }

  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-800">
          ⭐ Featured Listings
        </h2>
        <button
          onClick={() => navigateTo('explore')}
          className="flex items-center gap-1 text-sm text-[#4169E1] font-medium hover:underline active:scale-95 transition-transform"
        >
          View All <ArrowRight className="size-4" />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-video rounded-t-xl" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </section>
  )
}
