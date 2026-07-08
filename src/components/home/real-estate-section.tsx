'use client'

import { useEffect, useState } from 'react'
import { Bed, Maximize, MapPin, ArrowRight, Building2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { GlassCard } from '@/components/glass-card'
import { OptimizedImage } from '@/components/optimized-image'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface RealEstateListing {
  id: string
  title: string
  price: string
  listingType: string | null
  images: string | null
  address: string | null
  bedroomCount: number | null
  area: string | null
  isFeatured: boolean
  ownerPhone: string
  city: {
    id: string
    name: string
    slug: string
  }
}

export function RealEstateSection() {
  const selectedCity = useAppStore((s) => s.selectedCity)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const [listings, setListings] = useState<RealEstateListing[]>([])
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

  // Fetch real estate listings
  useEffect(() => {
    async function fetchListings() {
      if (!cityId) return
      setLoading(true)
      try {
        const res = await fetch(`/api/realestate?cityId=${cityId}`)
        if (res.ok) {
          const data = await res.json()
          const apiListings = Array.isArray(data) ? data : (data?.listings || [])
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

  const getFirstImage = (images: string | null): string => {
    if (!images) return ''
    try {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : ''
    } catch {
      return ''
    }
  }

  const placeholderImg =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNGM0Y0RjYiLz48dGV4dCB4PSIxMDAiIHk9IjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRDRBRjM3IiBmb250LXNpemU9IjI0Ij7wn5GAPC90ZXh0Pjwvc3ZnPg=='

  const handleViewAll = () => {
    setSearchQuery('Real Estate')
    navigateTo('explore')
  }

  // Don't return null anymore — always show the section with dummy data
  if (!loading && listings.length === 0) return null

  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-800">
          🏠 Real Estate
        </h2>
        <button
          onClick={handleViewAll}
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
          {listings.map((listing, index) => {
            const img = getFirstImage(listing.images)
            const hasImage = !!img
            return (
              <div
                key={listing.id}
                className="w-full transform transition-all duration-200 hover:shadow-lg active:scale-[0.97] cursor-pointer"
              >
                <GlassCard
                  variant={listing.isFeatured ? 'gold' : 'default'}
                  className="!p-0 overflow-hidden group"
                  onClick={() => toast.info('Real estate detail view coming soon!')}
                >
                  {/* Image or gradient placeholder */}
                  <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                    {hasImage ? (
                      <OptimizedImage
                        src={img || placeholderImg}
                        alt={listing.title}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#D4AF37] to-[#B8962E] flex items-center justify-center">
                        <Building2 className="size-12 text-white/50" />
                      </div>
                    )}

                    {listing.isFeatured && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-white text-[10px] border-0 shadow-sm">
                          👑 Featured
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">
                        {listing.price}
                      </h3>
                      {listing.listingType && (
                        <Badge variant="outline" className={listing.listingType?.toLowerCase() === 'rent' ? 'text-purple-600 bg-purple-50 border-purple-200' : 'text-blue-600 bg-blue-50 border-blue-200'}>
                          {listing.listingType}
                        </Badge>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-gray-700 line-clamp-1">
                      {listing.title}
                    </h4>

                    <div className="flex items-center gap-3 pt-2 text-xs text-gray-500 font-medium">
                      {listing.bedroomCount !== null && (
                        <div className="flex items-center gap-1">
                          <Bed className="size-3.5" />
                          <span>{listing.bedroomCount} BHK</span>
                        </div>
                      )}
                      {listing.area && (
                        <div className="flex items-center gap-1">
                          <Maximize className="size-3.5" />
                          <span>{listing.area}</span>
                        </div>
                      )}
                    </div>

                    {listing.address && (
                      <div className="flex items-center gap-1 text-gray-400">
                        <MapPin className="size-3 flex-shrink-0" />
                        <span className="text-[11px] truncate">{listing.address}</span>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
