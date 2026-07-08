'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, SlidersHorizontal, Star, MapPin, BadgeCheck,
  Phone, ChevronDown, Store, Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GlassCard } from '@/components/glass-card'
import { OptimizedImage } from '@/components/optimized-image'
import { useAppStore } from '@/lib/store'
import ListingCard from '@/components/listing-card'
import FilterDrawer from '@/components/filter-drawer'
import { RealEstateView } from '@/components/real-estate-view'
import { useInView } from 'react-intersection-observer'

interface Listing {
  id: string
  slug: string
  name: string
  category: string
  description: string | null
  images: string | null
  coverImage?: string | null
  logoUrl?: string | null
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
  city: {
    id: string
    name: string
    slug: string
  }
  _count: {
    reviews: number
    leads: number
  }
}

interface City {
  id: string
  name: string
  slug: string
}

const CATEGORIES = [
  'All',
  'Tiffin',
  'Medical',
  'Salon',
  'Plumber',
  'Real Estate',
  'Services',
  'Electronics',
  'Automobile',
  'Tailor',
  'Hardware',
  'Education',
]

const PLACEHOLDER_IMG = 'https://placehold.co/400x250/D4AF37/ffffff?text=Business'

export default function ExploreView() {
  const selectedCity = useAppStore((s) => s.selectedCity)
  const storeSearchQuery = useAppStore((s) => s.searchQuery)
  const setSelectedListing = useAppStore((s) => s.setSelectedListing)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const setShowLeadForm = useAppStore((s) => s.setShowLeadForm)
  const setLeadFormListingId = useAppStore((s) => s.setLeadFormListingId)
  const [listings, setListings] = useState<Listing[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedCityId, setSelectedCityId] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState<'listings' | 'real-estate'>(storeSearchQuery === 'real estate' ? 'real-estate' : 'listings')

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  useEffect(() => {
    if (inView && !loading && !loadingMore && page < totalPages) {
      handleLoadMore()
    }
  }, [inView, loading, loadingMore, page, totalPages])

  // Sync store's searchQuery to local state
  // When user clicks "Real Estate" in bottom nav, it sets store.searchQuery
  // We pick that up here and apply it as a category filter
  useEffect(() => {
    if (storeSearchQuery) {
      // Check if the searchQuery matches a category name
      const matchedCategory = CATEGORIES.find(
        (cat) => cat !== 'All' && cat.toLowerCase() === storeSearchQuery.toLowerCase()
      )
      if (matchedCategory) {
        setCategory(matchedCategory)
        setSearch('')
      } else {
        setSearch(storeSearchQuery)
        setCategory('All')
      }
    } else {
      setSearch('')
      setCategory('All')
    }
  }, [storeSearchQuery])

  // Fetch cities
  useEffect(() => {
    fetch('/api/cities')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCities(data)
          if (data.length > 0 && !selectedCityId) {
            const matched = data.find((c: City) => c.slug === selectedCity)
            setSelectedCityId(matched?.id || data[0]?.id || '')
          }
        }
      })
      .catch(() => {})
  }, [selectedCity, selectedCityId])

  // Fetch listings
  const fetchListings = useCallback(
    async (pageNum: number, reset = false) => {
      if (pageNum === 1) setLoading(true)
      else setLoadingMore(true)

      try {
        const params = new URLSearchParams()
        params.set('page', pageNum.toString())
        params.set('limit', '12')
        if (selectedCityId) params.set('cityId', selectedCityId)
        if (category && category !== 'All') params.set('category', category)
        if (search) params.set('search', search)
        
        // Append advanced filters
        Object.keys(filters).forEach(key => {
          if (filters[key] !== undefined && filters[key] !== null) {
            params.set(key, String(filters[key]))
          }
        })

        const res = await fetch(`/api/listings?${params}`)
        if (res.ok) {
          const data = await res.json()
          const listingsData = Array.isArray(data?.listings) ? data.listings : []
          const totalPagesNum = data?.pagination?.totalPages || 1

          if (reset) {
            setListings(listingsData)
            setTotalPages(listingsData.length > 0 ? totalPagesNum : 1)
          } else {
            setListings((prev) => [...prev, ...listingsData])
            setTotalPages(totalPagesNum)
          }
        }
      } catch {
        // Handle error by showing empty list
        if (reset) setListings([])
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [selectedCityId, category, search, filters]
  )

  useEffect(() => {
    setPage(1)
    fetchListings(1, true)
  }, [fetchListings])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchListings(nextPage)
  }

  const handleCardClick = (slug: string) => {
    setSelectedListing(slug)
    navigateTo('listing')
  }

  const handleGetQuote = (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation()
    setLeadFormListingId(listingId)
    setShowLeadForm(true)
  }

  // Category icon colors for dummy cards
  const categoryColors: Record<string, string> = {
    Tiffin: 'from-orange-400 to-orange-600',
    Medical: 'from-red-400 to-red-600',
    Salon: 'from-purple-400 to-purple-600',
    Plumber: 'from-blue-400 to-blue-600',
    'Real Estate': 'from-[#D4AF37] to-[#FFD700]',
    Services: 'from-[#4169E1] to-[#6B8DD6]',
    Electronics: 'from-indigo-400 to-indigo-600',
    Automobile: 'from-gray-400 to-gray-600',
    Tailor: 'from-pink-400 to-pink-600',
    Hardware: 'from-amber-400 to-amber-600',
    Education: 'from-teal-400 to-teal-600',
  }

  // Skeleton grid
  const SkeletonGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden">
          <Skeleton className="w-full aspect-video rounded-t-xl" />
          <div className="p-4 space-y-2 bg-white/40 backdrop-blur-xl">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Tab Toggle */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-full max-w-sm mx-auto shadow-inner">
        <button
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'listings' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('listings')}
        >
          Business Listings
        </button>
        <button
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'real-estate' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('real-estate')}
        >
          Real Estate
        </button>
      </div>

      {activeTab === 'real-estate' ? (
        <RealEstateView />
      ) : (
        <>
          {/* Search & Filter Bar */}
      <GlassCard className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Search businesses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/50 border-white/40 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="bg-white/50 border-white/40 hover:bg-white shrink-0 relative"
              onClick={() => setIsFilterOpen(true)}
            >
              <Filter className="size-4 text-gray-700" />
              {Object.keys(filters).length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4169E1] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4169E1]"></span>
                </span>
              )}
            </Button>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[150px] bg-white/50 border-white/40">
                <SlidersHorizontal className="size-4 mr-1 text-gray-400" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {cities.length > 0 && (
              <Select value={selectedCityId} onValueChange={setSelectedCityId}>
                <SelectTrigger className="w-[140px] bg-white/50 border-white/40">
                  <MapPin className="size-4 mr-1 text-gray-400" />
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors active:scale-95 ${
                category === cat
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white shadow-md'
                  : 'bg-white/50 text-gray-600 border border-white/40 hover:bg-white/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          {category !== 'All' ? `${category} ` : ''}Explore Businesses
          {!loading && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              {listings.length} found
            </span>
          )}
        </h2>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <SkeletonGrid />
      ) : listings.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Store className="size-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No businesses found</p>
          <p className="text-sm text-gray-400 mt-1">
            Try adjusting your filters or search term
          </p>
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {/* Infinite Scroll Trigger */}
          {page < totalPages && (
            <div ref={loadMoreRef} className="text-center pt-4 flex justify-center py-6">
              <div className="size-6 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
            </div>
          )}
        </>
      )}
      
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        type={category === 'Real Estate' ? 'real_estate' : 'business'}
        currentFilters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters)
          setPage(1)
        }}
      />
      </>
      )}
    </div>
  )
}
