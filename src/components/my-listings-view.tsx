'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Eye, Edit3, LogIn, Store, Clock, CheckCircle2,
  Star, Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/glass-card'
import { useAppStore } from '@/lib/store'
import { useAuth } from '@/lib/auth-context'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ListingStatus = 'Pending' | 'Approved' | 'Featured'

interface MyListing {
  id: string
  title: string
  category: string
  status: ListingStatus
  viewsCount: number
  gradientFrom: string
  gradientTo: string
  createdAt: string
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_LISTINGS: MyListing[] = [
  {
    id: 'ml1',
    title: 'Sri Lakshmi Tiffin Center',
    category: 'Tiffin',
    status: 'Approved',
    viewsCount: 342,
    gradientFrom: '#D4AF37',
    gradientTo: '#E8C86A',
    createdAt: '2025-01-10',
  },
  {
    id: 'ml2',
    title: 'Rayudu Agri Services',
    category: 'Services',
    status: 'Featured',
    viewsCount: 1205,
    gradientFrom: '#4169E1',
    gradientTo: '#6B8DD6',
    createdAt: '2024-12-28',
  },
  {
    id: 'ml3',
    title: 'Choutuppal Tailoring Works',
    category: 'Tailor',
    status: 'Pending',
    viewsCount: 0,
    gradientFrom: '#F59E0B',
    gradientTo: '#FCD34D',
    createdAt: '2025-01-25',
  },
  {
    id: 'ml4',
    title: 'Venkateshwara Medical & General Store',
    category: 'Medical',
    status: 'Approved',
    viewsCount: 189,
    gradientFrom: '#10B981',
    gradientTo: '#6EE7B7',
    createdAt: '2025-01-05',
  },
  {
    id: 'ml5',
    title: 'Ramesh Electronics Repair',
    category: 'Electronics',
    status: 'Pending',
    viewsCount: 0,
    gradientFrom: '#8B5CF6',
    gradientTo: '#C4B5FD',
    createdAt: '2025-01-26',
  },
]

type TabFilter = 'All' | ListingStatus
const TAB_FILTERS: TabFilter[] = ['All', 'Pending', 'Approved', 'Featured']

const STATUS_CONFIG: Record<ListingStatus, { icon: typeof Clock; color: string; label: string }> = {
  Pending: {
    icon: Clock,
    color: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    label: 'Pending Review',
  },
  Approved: {
    icon: CheckCircle2,
    color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    label: 'Approved',
  },
  Featured: {
    icon: Star,
    color: 'bg-[#D4AF37]/10 text-[#B8962E] border-[#D4AF37]/20',
    label: 'Featured',
  },
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MyListingsView() {
  const { isAuthenticated, setShowLoginModal } = useAuth()
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const selectedCityName = useAppStore((s) => s.selectedCityName)

  const [activeTab, setActiveTab] = useState<TabFilter>('All')

  /* ---------- Filtering ---------- */
  const filtered = MOCK_LISTINGS.filter(
    (item) => activeTab === 'All' || item.status === activeTab
  )

  /* ---------- Not authenticated prompt ---------- */
  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <GlassCard className="text-center py-16">
          <div className="size-16 rounded-full bg-[#4169E1]/10 flex items-center justify-center mx-auto mb-4">
            <LogIn className="size-8 text-[#4169E1]" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to view your listings</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Log in to manage your business listings, track views, and update details in {selectedCityName}.
          </p>
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              className="bg-gradient-to-r from-[#4169E1] to-[#3155c7] text-white"
              onClick={() => setShowLoginModal(true)}
            >
              <LogIn className="size-4 mr-2" />
              Login / Sign Up
            </Button>
          </motion.div>
        </GlassCard>
      </div>
    )
  }

  /* ---------- Authenticated view ---------- */
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="size-7 text-[#4169E1]" />
            My Listings
          </h1>
          <p className="text-sm text-gray-500">
            {MOCK_LISTINGS.length} listing{MOCK_LISTINGS.length !== 1 ? 's' : ''} total
          </p>
        </div>

        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            className="bg-gradient-to-r from-[#4169E1] to-[#3155c7] text-white"
          >
            <Plus className="size-4 mr-1.5" />
            Add New
          </Button>
        </motion.div>
      </div>

      {/* ---- Tab filters ---- */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TAB_FILTERS.map((tab) => (
          <motion.button
            key={tab}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === tab
                ? 'bg-gradient-to-r from-[#4169E1] to-[#3155c7] text-white shadow-md'
                : 'bg-white/50 text-gray-600 border border-white/40 hover:bg-white/70'
            }`}
          >
            {tab}
            {tab !== 'All' && (
              <span className="opacity-70">
                ({MOCK_LISTINGS.filter((l) => l.status === tab).length})
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* ---- Content ---- */}
      {filtered.length === 0 ? (
        <GlassCard className="text-center py-16">
          <Store className="size-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No listings in this category</p>
          <p className="text-sm text-gray-400 mt-1">
            {activeTab === 'Pending'
              ? 'Your submitted listings will appear here while under review.'
              : 'Start by adding a new business listing.'}
          </p>
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              className="mt-4 bg-gradient-to-r from-[#4169E1] to-[#3155c7] text-white"
            >
              <Plus className="size-4 mr-1.5" />
              Add Listing
            </Button>
          </motion.div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((listing, idx) => {
              const statusCfg = STATUS_CONFIG[listing.status]
              const StatusIcon = statusCfg.icon

              return (
                <motion.div
                  key={listing.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                >
                  <GlassCard
                    variant={listing.status === 'Featured' ? 'gold' : 'default'}
                    className="!p-0 overflow-hidden hover:shadow-xl transition-shadow h-full flex flex-col"
                  >
                    {/* Image placeholder — gradient */}
                    <div
                      className="relative aspect-video w-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${listing.gradientFrom}, ${listing.gradientTo})`,
                      }}
                    >
                      <ImageIcon className="size-10 text-white/40" />

                      {/* Status badge */}
                      <Badge
                        variant="secondary"
                        className={`absolute top-3 right-3 text-xs ${statusCfg.color}`}
                      >
                        <StatusIcon className="size-3 mr-1" />
                        {listing.status}
                      </Badge>
                    </div>

                    <div className="p-4 flex flex-col flex-1 space-y-3">
                      {/* Title */}
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {listing.title}
                      </h3>

                      {/* Category */}
                      <Badge
                        variant="secondary"
                        className="w-fit text-xs bg-[#4169E1]/10 text-[#4169E1] border-[#4169E1]/20"
                      >
                        {listing.category}
                      </Badge>

                      {/* Bottom row: Views + Edit */}
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Eye className="size-3.5" />
                          {listing.viewsCount.toLocaleString('en-IN')} views
                        </span>
                        <motion.div whileTap={{ scale: 0.9 }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#4169E1] hover:text-[#3155c7] hover:bg-[#4169E1]/5 h-8 gap-1"
                          >
                            <Edit3 className="size-3.5" />
                            Edit
                          </Button>
                        </motion.div>
                      </div>
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
