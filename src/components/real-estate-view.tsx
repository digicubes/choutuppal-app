'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, MapPin, BedDouble, Maximize, Phone,
  IndianRupee, Search, SearchX, LandPlot, Home, Key,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/glass-card'
import { useAppStore } from '@/lib/store'
import { useAuth } from '@/lib/auth-context'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PropertyType = 'For Sale' | 'For Rent' | 'Plots/Land'

interface Property {
  id: string
  title: string
  priceLakhs: number
  location: string
  bedrooms: number | null
  areaSqft: number
  propertyType: PropertyType
  gradientFrom: string
  gradientTo: string
}

/* ------------------------------------------------------------------ */
/*  Mock data — Choutuppal / Bhongir / Yadadri                         */
/* ------------------------------------------------------------------ */

const MOCK_PROPERTIES: Property[] = [
  {
    id: 're1',
    title: '2BHK Flat near Bus Stand',
    priceLakhs: 18,
    location: 'Choutuppal, Main Road',
    bedrooms: 2,
    areaSqft: 950,
    propertyType: 'For Sale',
    gradientFrom: '#4169E1',
    gradientTo: '#6B8DD6',
  },
  {
    id: 're2',
    title: '3BHK Independent House',
    priceLakhs: 45,
    location: 'Bhongir, Old Town',
    bedrooms: 3,
    areaSqft: 1800,
    propertyType: 'For Sale',
    gradientFrom: '#D4AF37',
    gradientTo: '#E8C86A',
  },
  {
    id: 're3',
    title: '1BHK Furnished Apartment',
    priceLakhs: 6,
    location: 'Near Yadadri Temple, Yadadri',
    bedrooms: 1,
    areaSqft: 550,
    propertyType: 'For Rent',
    gradientFrom: '#10B981',
    gradientTo: '#6EE7B7',
  },
  {
    id: 're4',
    title: '200 sq yd Residential Plot',
    priceLakhs: 12,
    location: 'Choutuppal Mandal, NH-163',
    bedrooms: null,
    areaSqft: 1800,
    propertyType: 'Plots/Land',
    gradientFrom: '#8B5CF6',
    gradientTo: '#C4B5FD',
  },
  {
    id: 're5',
    title: '2BHK Flat — Park View',
    priceLakhs: 7,
    location: 'Bhongir, Colony Area',
    bedrooms: 2,
    areaSqft: 900,
    propertyType: 'For Rent',
    gradientFrom: '#F59E0B',
    gradientTo: '#FCD34D',
  },
  {
    id: 're6',
    title: '500 sq yd Agriculture Land',
    priceLakhs: 8,
    location: 'Choutuppal Rural, Yadadri Dist.',
    bedrooms: null,
    areaSqft: 4500,
    propertyType: 'Plots/Land',
    gradientFrom: '#059669',
    gradientTo: '#34D399',
  },
]

type TabFilter = 'All' | PropertyType
const TAB_FILTERS: TabFilter[] = ['All', 'For Sale', 'For Rent', 'Plots/Land']

const TYPE_COLORS: Record<PropertyType, string> = {
  'For Sale': 'bg-[#4169E1]/10 text-[#4169E1] border-[#4169E1]/20',
  'For Rent': 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  'Plots/Land': 'bg-[#D4AF37]/10 text-[#B8962E] border-[#D4AF37]/20',
}

const TYPE_ICONS: Record<PropertyType, typeof Home> = {
  'For Sale': Home,
  'For Rent': Key,
  'Plots/Land': LandPlot,
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function RealEstateView() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const selectedCityName = useAppStore((s) => s.selectedCityName)
  const { isAuthenticated, setShowLoginModal } = useAuth()

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<TabFilter>('All')

  /* ---------- Filtering ---------- */
  const filtered = MOCK_PROPERTIES.filter((prop) => {
    const matchesTab = activeTab === 'All' || prop.propertyType === activeTab
    const matchesSearch =
      !search ||
      prop.title.toLowerCase().includes(search.toLowerCase()) ||
      prop.location.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  /* ---------- Render ---------- */
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* ---- Header ---- */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          రియల్ ఎస్టేట్{' '}
          <span className="text-[#D4AF37]">/ Real Estate</span>
        </h1>
        <p className="text-sm text-gray-500">
          Properties &amp; plots in {selectedCityName} &amp; surrounding areas
        </p>
      </div>

      {/* ---- Search & Filter ---- */}
      <GlassCard className="!p-4 space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search properties, locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/50 border-white/40 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20"
          />
        </div>

        {/* Tab filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TAB_FILTERS.map((tab) => (
            <motion.button
              key={tab}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white shadow-md'
                  : 'bg-white/50 text-gray-600 border border-white/40 hover:bg-white/70'
              }`}
            >
              {tab}
            </motion.button>
          ))}
        </div>
      </GlassCard>

      {/* ---- Results count ---- */}
      <p className="text-sm text-gray-500">
        {filtered.length} propert{filtered.length !== 1 ? 'ies' : 'y'} found
      </p>

      {/* ---- Property Cards Grid ---- */}
      {filtered.length === 0 ? (
        <GlassCard className="text-center py-16">
          <SearchX className="size-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No properties match your search</p>
          <p className="text-sm text-gray-400 mt-1">
            Try adjusting your filters or search term
          </p>
          <Button
            variant="outline"
            className="mt-4 border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/5"
            onClick={() => {
              setSearch('')
              setActiveTab('All')
            }}
          >
            Clear Filters
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((prop, idx) => {
              const TypeIcon = TYPE_ICONS[prop.propertyType]
              return (
                <motion.div
                  key={prop.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                >
                  <GlassCard className="!p-0 overflow-hidden hover:shadow-xl transition-shadow h-full flex flex-col">
                    {/* Image placeholder — gradient */}
                    <div
                      className="relative aspect-video w-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${prop.gradientFrom}, ${prop.gradientTo})`,
                      }}
                    >
                      <Building2 className="size-12 text-white/40" />
                      {/* Type badge overlay */}
                      <Badge
                        variant="secondary"
                        className={`absolute top-3 right-3 text-xs ${TYPE_COLORS[prop.propertyType]}`}
                      >
                        <TypeIcon className="size-3 mr-1" />
                        {prop.propertyType}
                      </Badge>
                    </div>

                    <div className="p-4 flex flex-col flex-1 space-y-3">
                      {/* Title */}
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {prop.title}
                      </h3>

                      {/* Price */}
                      <p className="text-lg font-bold text-[#D4AF37] flex items-center gap-1">
                        <IndianRupee className="size-4" />
                        {prop.priceLakhs} Lakhs
                      </p>

                      {/* Location */}
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <MapPin className="size-3 shrink-0" />
                        {prop.location}
                      </p>

                      {/* Stats row */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {prop.bedrooms !== null && (
                          <span className="flex items-center gap-1">
                            <BedDouble className="size-3.5" />
                            {prop.bedrooms} BHK
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Maximize className="size-3.5" />
                          {prop.areaSqft.toLocaleString('en-IN')} sq ft
                        </span>
                      </div>

                      {/* Contact Owner button */}
                      <motion.div whileTap={{ scale: 0.95 }} className="mt-auto pt-1">
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white text-xs h-9"
                          onClick={() => {
                            if (!isAuthenticated) {
                              setShowLoginModal(true)
                            }
                          }}
                        >
                          <Phone className="size-3.5 mr-1.5" />
                          Contact Owner
                        </Button>
                      </motion.div>
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
