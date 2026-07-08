'use client'

import { useAppStore } from '@/lib/store'
import type { ViewType } from '@/lib/store'
import { Home, Compass, Newspaper, User, Phone, MessageCircle } from 'lucide-react'

const NAV_ITEMS: Array<{
  view: ViewType
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>
}> = [
  { view: 'home', label: 'Home', icon: Home },
  { view: 'explore', label: 'Explore', icon: Compass },
  { view: 'news', label: 'News', icon: Newspaper },
  { view: 'dashboard', label: 'You', icon: User },
]

interface MobileBottomWrapperProps {
  className?: string
}

/**
 * MobileBottomWrapper — Renders BottomNav or StickyCTA based on current view.
 *
 * On normal views (home/explore/news/dashboard): Shows 4-tab BottomNav
 * On detail views (listing with selectedListingSlug): Shows StickyCTA
 *
 * This is a flex-none child directly in the body flex column.
 * It is NOT position:fixed — it's a natural flex child pinned to bottom.
 */
export function MobileBottomWrapper({ className }: MobileBottomWrapperProps) {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const currentView = useAppStore((s) => s.currentView)
  const selectedListingSlug = useAppStore((s) => s.selectedListingSlug)

  // Check if we are on a detail page (Listing or Real Estate)
  const isDetailPage = currentView === 'listing' && !!selectedListingSlug

  return (
    <div className={`md:hidden ${className || ''}`}>
      {isDetailPage ? <StickyCTA key="cta" /> : <BottomNav key="nav" />}
    </div>
  )
}

// --- Bottom Navigation (WhatsApp Style) ---
function BottomNav() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const currentView = useAppStore((s) => s.currentView)
  const navigateTo = useAppStore((s) => s.navigateTo)

  return (
    <div className="h-16 bg-white border-t border-gray-200 flex justify-around items-center px-2 transition-all duration-200">
      {NAV_ITEMS.map((item) => {
        const isActive = currentView === item.view
        const Icon = item.icon

        return (
          <button
            key={item.view}
            onClick={() => navigateTo(item.view)}
            className="relative flex flex-col items-center justify-center min-w-[48px] min-h-[48px] active:scale-95 transition-transform"
          >
            {/* Active dot indicator — w-1.5 h-1.5 rounded-full bg-[#D4AF37] above icon */}
            {isActive && (
              <div className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#D4AF37] transition-all duration-200" />
            )}
            <Icon
              className={`size-[22px] transition-colors ${
                isActive ? 'text-[#D4AF37]' : 'text-gray-400'
              }`}
              strokeWidth={isActive ? 2.5 : 1.8}
            />
            <span
              className={`text-[10px] mt-0.5 font-medium transition-colors ${
                isActive ? 'text-[#D4AF37]' : 'text-gray-400'
              }`}
            >
              {item.label}
            </span>
          </button>
        )
      })}
      {/* iOS safe area */}
      <div className="absolute bottom-0 left-0 right-0 bg-white" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </div>
  )
}

// --- Sticky CTA for Detail Pages ---
function StickyCTA() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const selectedListingSlug = useAppStore((s) => s.selectedListingSlug)
  const setShowLeadForm = useAppStore((s) => s.setShowLeadForm)
  const setLeadFormListingId = useAppStore((s) => s.setLeadFormListingId)

  const handleConnect = () => {
    if (selectedListingSlug) {
      setLeadFormListingId(selectedListingSlug)
      setShowLeadForm(true)
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    'Hi, I found your business on Choutuppal Super App. I want to know more.'
  )}`

  return (
    <div
      className="bg-white border-t border-gray-200 p-3 flex gap-3 transition-all duration-200"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <button
        onClick={handleConnect}
        className="flex-1 bg-[#4169E1] text-white font-bold rounded-xl flex items-center justify-center gap-2 min-h-[48px] text-sm active:opacity-90"
      >
        <Phone className="size-4" />
        Connect via App
      </button>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 bg-[#25D366] text-white font-bold rounded-xl flex items-center justify-center gap-2 min-h-[48px] text-sm active:opacity-90"
      >
        <MessageCircle className="size-4" />
        WhatsApp Chat
      </a>
    </div>
  )
}
