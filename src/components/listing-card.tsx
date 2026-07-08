'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Star, MapPin, BadgeCheck } from 'lucide-react'
import { GlassCard } from '@/components/glass-card'
import { OptimizedImage } from '@/components/optimized-image'
import { Badge } from '@/components/ui/badge'

interface ListingCardProps {
  listing: {
    id: string
    slug: string
    name: string
    category: string
    address?: string | null
    coverImage?: string | null
    logoUrl?: string | null
    images?: string | null
    rating: number
    operatingHours?: string | null
    isPremium?: boolean
    isFeatured?: boolean
    userId?: string | null
    user?: {
      id: string
      fullName?: string | null
      avatarUrl?: string | null
    } | null
    _count?: {
      reviews?: number
    }
  }
}

export default function ListingCard({ listing }: ListingCardProps) {
  const router = useRouter()
  
  const getFirstImage = (imagesStr: string | null | undefined): string => {
    if (!imagesStr) return ''
    try {
      const parsed = JSON.parse(imagesStr)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : ''
    } catch {
      return ''
    }
  }

  const img = listing.coverImage || listing.logoUrl || getFirstImage(listing.images)
  const placeholderImg = 'https://placehold.co/400x250/D4AF37/ffffff?text=Business'

  return (
    <Link
      href={`/listing/${listing.slug || listing.id}`}
      className="block cursor-pointer transform transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <GlassCard
        variant={listing.isPremium ? 'gold' : 'default'}
        className="!p-0 overflow-hidden h-full flex flex-col border border-gray-100/80 bg-white"
      >
        {/* Image at Top */}
        <div className="relative aspect-video w-full overflow-hidden bg-gray-50 flex-shrink-0">
          <OptimizedImage
            src={img || placeholderImg}
            alt={listing.name}
            fill
            style={{ objectFit: 'cover' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          
          {/* Badge overlays */}
          {listing.isPremium && (
            <Badge className="absolute top-2 right-2 bg-[#D4AF37] text-white border-none text-xs font-semibold flex items-center gap-0.5">
              <BadgeCheck className="size-3" />
              Premium
            </Badge>
          )}
          {listing.isFeatured && !listing.isPremium && (
            <Badge className="absolute top-2 right-2 bg-[#4169E1] text-white border-none text-xs font-semibold">
              Featured
            </Badge>
          )}
        </div>

        {/* Details at Bottom */}
        <div className="p-4 flex-1 flex flex-col justify-between bg-white">
          <div className="space-y-1.5">
            <h3 className="font-bold text-gray-900 line-clamp-1 text-base">
              {listing.name}
            </h3>
            
            <Badge variant="secondary" className={`border-none text-[10px] py-0.5 font-bold inline-flex w-max ${listing.category === 'Real Estate' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-[#4169E1]/10 text-[#4169E1]'}`}>
              {listing.category}
            </Badge>
            
            {listing.address && (
              <p className="text-xs text-gray-500 line-clamp-1 flex items-center gap-1 mt-1">
                <MapPin className="size-3 shrink-0 text-gray-400" />
                {listing.address}
              </p>
            )}
            
            {(listing.user || listing.userId) && (
              <Link
                href={`/profile/${listing.user?.id || listing.userId}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 mt-2 hover:opacity-80 transition-opacity w-max"
              >
                <div className="w-5 h-5 rounded-full bg-blue-100 overflow-hidden shrink-0 flex items-center justify-center border border-blue-200">
                  {listing.user?.avatarUrl ? (
                    <img loading="lazy" decoding="async" src={listing.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] font-bold text-blue-600">{listing.user?.fullName?.[0] || 'U'}</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-600 font-semibold">{listing.user?.fullName || 'Owner'}</span>
              </Link>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-2.5 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <Star className="size-3.5 text-[#D4AF37] fill-[#D4AF37]" />
              <span className="text-xs font-bold text-gray-800">
                {listing.rating || 5.0}
              </span>
              {listing._count?.reviews !== undefined && (
                <span className="text-[10px] text-gray-400 font-medium">
                  ({listing._count.reviews})
                </span>
              )}
            </div>

            <div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${listing.operatingHours ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {listing.operatingHours ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  )
}
