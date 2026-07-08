'use client'

import { useState, useEffect } from 'react'
import { Home, Newspaper, BookOpen, Building2, UserCircle, Store, Landmark, PlusCircle, Users, Image as ImageIcon, Sparkles, Compass, Bell, Video } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { ViewType } from '@/lib/store'
import { useAuth } from '@/lib/auth-context'
import { useAppConfig } from '@/hooks/use-app-config'
import { usePathname, useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const currentView = useAppStore((s) => s.currentView)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const searchQuery = useAppStore((s) => s.searchQuery)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const selectedListingSlug = useAppStore((s) => s.selectedListingSlug)
  const showBottomNav = useAppStore((s) => s.showBottomNav)
  const isStoryOpen = useAppStore((s) => s.isStoryOpen)
  const { isAuthenticated, setShowLoginModal } = useAuth()
  const { config } = useAppConfig()

  const [postSheetOpen, setPostSheetOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/social/posts?limit=1')
        if (res.ok) {
          const data = await res.json()
          if (data.posts && data.posts.length > 0) {
            const latestPost = data.posts[0]
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
            if (new Date(latestPost.createdAt) > twentyFourHoursAgo && !latestPost.isDeleted) {
              const lastRead = localStorage.getItem('lastReadCommunityPosts')
              if (!lastRead || new Date(latestPost.createdAt) > new Date(lastRead)) {
                setHasUnread(true)
              }
            }
          }
        }
      } catch (err) {}
    }
    fetchUnread()
  }, [currentView])

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard') || pathname?.startsWith('/agent') || currentView === 'dashboard') {
    return null; // Force hide global menu
  }

  if (isStoryOpen) {
    return null; // Force hide when story viewer is open
  }

  const isDetailPage = currentView === 'listing' || pathname?.startsWith('/listing/')

  if (isDetailPage) return null

  if (!showBottomNav) return null

  const handleNavClick = (view: ViewType, requiresAuth?: boolean, query?: string) => {
    if (requiresAuth && !isAuthenticated) {
      setShowLoginModal(true)
      return
    }
    if (query !== undefined) {
      setSearchQuery(query)
    }
    navigateTo(view)
    if (pathname !== '/') {
      router.push('/')
    }
  }

  const handlePostAction = (type: 'listing' | 'real-estate' | 'story' | 'banner') => {
    setPostSheetOpen(false)
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }
    navigateTo('dashboard')
  }

  const isExploreActive = currentView === 'explore'
  const isUpdatesActive = currentView === 'news' || currentView === 'blog'

  return (
    <>
      {/* Nav bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="relative flex justify-around items-end h-16 px-1 pb-1 overflow-visible">
          {/* 1. Home */}
          <NavItem
            icon={Home}
            label="Home"
            isActive={currentView === 'home' && pathname !== '/shorts'}
            onClick={() => handleNavClick('home')}
          />

          {/* 2. Shorts */}
          <NavItem
            icon={Video}
            label="Shorts"
            isActive={pathname === '/shorts'}
            onClick={() => {
              if (pathname !== '/shorts') {
                router.push('/shorts')
              }
            }}
          />

          {/* 3. Explore */}
          <NavItem
            icon={Compass}
            label="Explore"
            isActive={isExploreActive && pathname !== '/shorts'}
            onClick={() => handleNavClick('explore', false, '')}
          />

          {/* 3. Center FAB */}
          {(config.enableListings || config.enableRealEstate) && (
            <button
              onClick={() => setPostSheetOpen(true)}
              className="relative flex flex-col items-center -mt-8 group shrink-0 px-2"
              aria-label="Create new post"
            >
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-tr from-[#4169E1] to-[#D4AF37] shadow-[0_8px_16px_rgba(65,105,225,0.4)] active:scale-95 transition-all duration-200 border-4 border-white">
                <PlusCircle className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[10px] mt-1 font-bold text-gray-700 group-active:text-[#4169E1] transition-colors">
                Add
              </span>
            </button>
          )}

          {/* 4. Community */}
          <NavItem
            icon={Users}
            label="Community"
            isActive={currentView === 'community'}
            onClick={() => handleNavClick('community')}
          />

          {/* 5. Updates */}
          <NavItem
            icon={Bell}
            label="Updates"
            isActive={currentView === 'updates' || currentView === 'news' || currentView === 'blog'}
            onClick={() => {
              setHasUnread(false)
              handleNavClick('updates')
            }}
            hasBadge={hasUnread}
          />

          {/* 6. You */}
          <NavItem
            icon={UserCircle}
            label="You"
            isActive={(currentView as string) === 'dashboard' || currentView === 'profile'}
            onClick={() => handleNavClick('dashboard', true)}
          />
        </div>
      </div>

      {/* Post bottom sheet */}
      <Sheet open={postSheetOpen} onOpenChange={setPostSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl backdrop-blur-md bg-white/95 border-t border-gray-100 shadow-2xl pb-safe-bottom">
          <SheetHeader className="pb-4 pt-2">
            <SheetTitle className="text-xl font-bold text-center">What do you want to create?</SheetTitle>
            <SheetDescription className="text-center">Choose an option below</SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3 p-4 pt-0 pb-8">
            {config.enableListings && (
              <button
                onClick={() => handlePostAction('listing')}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm active:scale-[0.98] transition-all duration-200 hover:shadow-md hover:border-blue-100 group"
              >
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                  <Store className="w-7 h-7 text-[#4169E1]" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">Add Business</p>
              </button>
            )}
            {config.enableRealEstate && (
              <button
                onClick={() => handlePostAction('real-estate')}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm active:scale-[0.98] transition-all duration-200 hover:shadow-md hover:border-yellow-100 group"
              >
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-yellow-50 group-hover:bg-yellow-100 transition-colors">
                  <Landmark className="w-7 h-7 text-[#D4AF37]" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">Add Property</p>
              </button>
            )}
            <button
              onClick={() => handlePostAction('story')}
              className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm active:scale-[0.98] transition-all duration-200 hover:shadow-md hover:border-purple-100 group"
            >
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-purple-50 group-hover:bg-purple-100 transition-colors">
                <Sparkles className="w-7 h-7 text-purple-500" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">Add Story</p>
            </button>
            <button
              onClick={() => handlePostAction('banner')}
              className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm active:scale-[0.98] transition-all duration-200 hover:shadow-md hover:border-emerald-100 group"
            >
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                <ImageIcon className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">Add Banner Ad</p>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

/* ─── Sub-components ──────────────────────────────────────────────────── */

/** Single nav tab item — no Framer Motion, pure Tailwind */
function NavItem({
  icon: Icon,
  label,
  isActive,
  onClick,
  hasBadge,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>
  label: string
  isActive: boolean
  onClick: () => void
  hasBadge?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center min-h-[48px] min-w-[48px] active:scale-90 transition-all duration-200"
    >
      <div className="relative">
        <Icon
          className={`w-6 h-6 mb-1 ${isActive ? 'text-[#4169E1]' : 'text-gray-500'}`}
          strokeWidth={isActive ? 2.5 : 2}
        />
        {hasBadge && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm" />
        )}
      </div>
      <span
        className={`whitespace-nowrap text-[10px] tracking-tight mt-0.5 transition-all duration-200 ${
          isActive ? 'text-[#4169E1] font-bold' : 'text-gray-400 font-medium'
        }`}
      >
        {label}
      </span>
      {/* Active highlight line */}
      <div
        className={`absolute -bottom-0 h-[2.5px] rounded-full bg-[#4169E1] transition-all duration-300 ${
          isActive ? 'w-5 scale-y-100' : 'w-0 scale-y-0'
        }`}
      />
    </button>
  )
}
