'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bookmark, BookmarkX, Store, Briefcase, Building2,
  LogIn, Trash2, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/glass-card'
import { useAppStore } from '@/lib/store'
import { useAuth } from '@/lib/auth-context'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SavedCategory = 'Listing' | 'Job' | 'Real Estate'

interface SavedItem {
  id: string
  title: string
  category: SavedCategory
  savedDate: string
  subtitle: string
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_SAVED: SavedItem[] = [
  {
    id: 's1',
    title: 'Sri Lakshmi Tiffin Center',
    category: 'Listing',
    savedDate: '2025-01-15',
    subtitle: 'Best dosa & idli in Choutuppal',
  },
  {
    id: 's2',
    title: 'Panchayat Secretary — Yadadri',
    category: 'Job',
    savedDate: '2025-01-18',
    subtitle: 'Government job, ₹30k-45k/mo',
  },
  {
    id: 's3',
    title: '2BHK Flat near Bus Stand, Bhongir',
    category: 'Real Estate',
    savedDate: '2025-01-20',
    subtitle: '₹18 Lakhs · 950 sq ft · For Sale',
  },
  {
    id: 's4',
    title: 'Digital Marketing Intern',
    category: 'Job',
    savedDate: '2025-01-22',
    subtitle: 'Mana Digital Solutions, Choutuppal',
  },
]

type TabFilter = 'All' | SavedCategory
const TAB_FILTERS: TabFilter[] = ['All', 'Listing', 'Job', 'Real Estate']

const CATEGORY_ICONS: Record<SavedCategory, typeof Store> = {
  Listing: Store,
  Job: Briefcase,
  'Real Estate': Building2,
}

const CATEGORY_COLORS: Record<SavedCategory, string> = {
  Listing: 'bg-[#4169E1]/10 text-[#4169E1] border-[#4169E1]/20',
  Job: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  'Real Estate': 'bg-[#D4AF37]/10 text-[#B8962E] border-[#D4AF37]/20',
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SavedView() {
  const { isAuthenticated, setShowLoginModal } = useAuth()
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const selectedCityName = useAppStore((s) => s.selectedCityName)

  const [activeTab, setActiveTab] = useState<TabFilter>('All')
  const [savedItems, setSavedItems] = useState<SavedItem[]>(MOCK_SAVED)

  /* ---------- Filtering ---------- */
  const filtered = savedItems.filter(
    (item) => activeTab === 'All' || item.category === activeTab
  )

  /* ---------- Remove handler ---------- */
  const handleRemove = (id: string) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id))
  }

  /* ---------- Date formatter ---------- */
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  /* ---------- Not authenticated prompt ---------- */
  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <GlassCard className="text-center py-16">
          <div className="size-16 rounded-full bg-[#4169E1]/10 flex items-center justify-center mx-auto mb-4">
            <LogIn className="size-8 text-[#4169E1]" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to view saved items</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Log in to access your bookmarked listings, jobs, and real estate across {selectedCityName}.
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
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bookmark className="size-7 text-[#D4AF37] fill-[#D4AF37]" />
            Saved Items
          </h1>
          <p className="text-sm text-gray-500">
            {savedItems.length} item{savedItems.length !== 1 ? 's' : ''} saved
          </p>
        </div>
      </div>

      {/* ---- Tab filters ---- */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TAB_FILTERS.map((tab) => (
          <motion.button
            key={tab}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white shadow-md'
                : 'bg-white/50 text-gray-600 border border-white/40 hover:bg-white/70'
            }`}
          >
            {tab}
            {tab !== 'All' && (
              <span className="ml-1 opacity-70">
                ({savedItems.filter((i) => i.category === tab).length})
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* ---- Content ---- */}
      {filtered.length === 0 ? (
        <GlassCard className="text-center py-16">
          <BookmarkX className="size-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No saved items yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Browse listings, jobs, or real estate and tap the bookmark icon to save them here.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, idx) => {
              const Icon = CATEGORY_ICONS[item.category]
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                >
                  <GlassCard className="!p-0 overflow-hidden hover:shadow-xl transition-shadow h-full flex flex-col">
                    {/* Top accent */}
                    <div className="h-1 bg-gradient-to-r from-[#D4AF37] to-[#4169E1]" />

                    <div className="p-4 flex flex-col flex-1 space-y-3">
                      {/* Category badge + icon */}
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Icon className="size-4 text-gray-500" />
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${CATEGORY_COLORS[item.category]}`}
                        >
                          {item.category}
                        </Badge>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {item.title}
                      </h3>

                      {/* Subtitle */}
                      <p className="text-xs text-gray-500">{item.subtitle}</p>

                      {/* Bottom row */}
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="size-3" />
                          Saved {formatDate(item.savedDate)}
                        </span>
                        <motion.div whileTap={{ scale: 0.9 }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                            onClick={() => handleRemove(item.id)}
                          >
                            <Trash2 className="size-4" />
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
