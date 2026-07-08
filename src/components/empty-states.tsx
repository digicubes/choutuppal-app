'use client'

import { motion } from 'framer-motion'
import {
  Store, Inbox, Coins, Newspaper, Building2,
  Search, Plus, Crown, Star, ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/glass-card'

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  illustration?: 'listings' | 'leads' | 'coins' | 'news' | 'search' | 'realestate' | 'subscription'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <GlassCard className="text-center py-16 px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Decorative circle */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-[#4169E1]/10" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#D4AF37]/5 to-[#4169E1]/5 flex items-center justify-center">
            <Icon className="size-10 text-gray-300" />
          </div>
          {/* Small decorative dots */}
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#D4AF37]/30" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-[#4169E1]/30" />
        </div>

        <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
        <p className="text-sm text-gray-400 max-w-xs mx-auto mb-6">{description}</p>

        {actionLabel && onAction && (
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onAction}
              className="bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white font-semibold"
            >
              <Plus className="size-4 mr-1.5" />
              {actionLabel}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </GlassCard>
  )
}

// ─── Pre-built Empty States ────────────────────────────────────────
export function EmptyListings({ onAddListing }: { onAddListing?: () => void }) {
  return (
    <EmptyState
      icon={Store}
      title="No listings yet"
      description="Add your first business listing and reach thousands of local customers on Choutuppal."
      actionLabel="Add Your First Listing"
      onAction={onAddListing}
    />
  )
}

export function EmptyLeads() {
  return (
    <EmptyState
      icon={Inbox}
      title="No leads yet"
      description="Leads will appear here when customers enquire about your listings. Make sure your listings are active and visible!"
    />
  )
}

export function EmptyCoins() {
  return (
    <EmptyState
      icon={Coins}
      title="No transactions yet"
      description="Start earning coins by checking in daily, writing reviews, and sharing listings!"
    />
  )
}

export function EmptyNews() {
  return (
    <EmptyState
      icon={Newspaper}
      title="No news for this area"
      description="Stay tuned! Local news and updates will appear here soon."
    />
  )
}

export function EmptySearchResults({ query, onClear }: { query: string; onClear?: () => void }) {
  return (
    <GlassCard className="text-center py-16 px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-[#4169E1]/10" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#D4AF37]/5 to-[#4169E1]/5 flex items-center justify-center">
            <Search className="size-10 text-gray-300" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No results for &ldquo;{query}&rdquo;
        </h3>
        <p className="text-sm text-gray-400 max-w-xs mx-auto mb-6">
          Try a different search term or browse categories instead.
        </p>
        {onClear && (
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onClear}
              variant="outline"
              className="border-[#D4AF37]/30 text-[#D4AF37]"
            >
              <ArrowLeft className="size-4 mr-1.5" />
              Back to Explore
            </Button>
          </motion.div>
        )}
      </motion.div>
    </GlassCard>
  )
}

export function EmptyRealEstate() {
  return (
    <EmptyState
      icon={Building2}
      title="No properties listed"
      description="Real estate listings will appear here when available in your area."
    />
  )
}

export function EmptySubscriptions() {
  return (
    <EmptyState
      icon={Crown}
      title="No subscription history"
      description="Upgrade to Pro or Premium to unlock powerful features for your business!"
    />
  )
}
