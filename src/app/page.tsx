'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useAuth } from '@/lib/auth-context'
import { useAppConfig } from '@/hooks/use-app-config'
import { ErrorBoundary } from '@/components/error-boundary'

// ─── Static imports (lightweight, needed immediately) ───────────────────
import { StoriesSection } from '@/components/home/stories-section'
import { BannerAds } from '@/components/home/banner-ads'
import { CategoriesSection } from '@/components/home/categories-section'
import { FeaturedListings } from '@/components/home/featured-listings'
import { RealEstateSection } from '@/components/home/real-estate-section'
import { TestimonialsSection } from '@/components/home/testimonials-section'
import { PricingSection } from '@/components/home/pricing-section'
import { NewsSection } from '@/components/home/news-section'
import { DailySpinSection } from '@/components/home/daily-spin-section'
import { WhatsAppCommunitySection } from '@/components/home/whatsapp-community-section'
import { AnnouncementTicker } from '@/components/home/announcement-ticker'

import { FeaturedProfiles } from '@/components/home/featured-profiles'
import { ForbiddenPage } from '@/components/auth/forbidden-page'
import { DashboardHeaderSkeleton } from '@/components/skeleton-loaders'

// ─── Dynamic imports (ssr: false) ──────────────────────────────────────
// ALL view components use DEFAULT exports and simple import() without .then()
// This prevents "Invalid Element Type" errors from fragile .then() patterns.
//
// PATTERN: dynamic(() => import('...'), { ssr: false })

// HeroSection
const DynamicHeroSection = dynamic(
  () => import('@/components/home/hero-section'),
  {
    ssr: false,
    loading: () => (
      <div className="relative overflow-hidden max-h-[300px] mt-4 bg-gray-100 animate-pulse rounded-xl" />
    ),
  }
)

// Views — lazy-loaded to reduce initial compilation memory
const ListingView = dynamic(
  () => import('@/components/listing-view'),
  { ssr: false, loading: () => <div className="p-6 space-y-4"><div className="h-40 rounded-xl bg-gray-100 animate-pulse" /><div className="h-8 w-3/4 rounded bg-gray-100 animate-pulse" /></div> }
)

const ExploreView = dynamic(
  () => import('@/components/explore-view'),
  { ssr: false, loading: () => <div className="p-6 space-y-4"><div className="h-20 rounded-xl bg-gray-100 animate-pulse" /><div className="grid grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-40 rounded-xl bg-gray-100 animate-pulse" />)}</div></div> }
)

const NewsView = dynamic(
  () => import('@/components/news-view'),
  { ssr: false, loading: () => <div className="p-6 space-y-4"><div className="h-8 w-1/2 rounded bg-gray-100 animate-pulse" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-48 rounded-xl bg-gray-100 animate-pulse" />)}</div></div> }
)

const DashboardView = dynamic(
  () => import('@/components/dashboard-view'),
  { ssr: false, loading: () => <div className="max-w-5xl mx-auto px-4 py-6 space-y-6"><DashboardHeaderSkeleton /><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[1,2].map(i => <div key={i} className="h-40 rounded-xl bg-gray-100 animate-pulse" />)}</div></div> }
)


// Removed wrappers

const AgentDashboard = dynamic(
  () => import('@/components/agent-dashboard'),
  { ssr: false, loading: () => <div className="max-w-5xl mx-auto px-4 py-6 space-y-6"><DashboardHeaderSkeleton /></div> }
)

const SearchView = dynamic(
  () => import('@/components/search-view'),
  { ssr: false, loading: () => <div className="p-6 space-y-4"><div className="h-12 rounded-xl bg-gray-100 animate-pulse" /></div> }
)

const BlogView = dynamic(
  () => import('@/components/blog-view'),
  { ssr: false, loading: () => <div className="p-6 space-y-4"><div className="h-8 w-1/2 rounded bg-gray-100 animate-pulse" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-48 rounded-xl bg-gray-100 animate-pulse" />)}</div></div> }
)

const BlogDetailView = dynamic(
  () => import('@/components/blog-detail-view'),
  { ssr: false, loading: () => <div className="max-w-3xl mx-auto p-6 space-y-4"><div className="h-48 rounded-xl bg-gray-100 animate-pulse" /><div className="h-8 w-3/4 rounded bg-gray-100 animate-pulse" /><div className="h-4 w-full rounded bg-gray-100 animate-pulse" /></div> }
)

const LearnView = dynamic(
  () => import('@/components/learn-view'),
  { ssr: false, loading: () => <div className="p-6 space-y-4"><div className="h-8 w-1/2 rounded bg-gray-100 animate-pulse" /><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[1,2].map(i => <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />)}</div></div> }
)

const VideoPlayerView = dynamic(
  () => import('@/components/video-player-view'),
  { ssr: false, loading: () => <div className="aspect-video w-full bg-gray-100 animate-pulse rounded-xl" /> }
)



const CommunityFeed = dynamic(
  () => import('@/components/community-feed'),
  { ssr: false, loading: () => <div className="p-6 space-y-4"><div className="h-20 rounded-xl bg-gray-100 animate-pulse" />{[1,2].map(i => <div key={i} className="h-48 rounded-xl bg-gray-100 animate-pulse" />)}</div> }
)

const UpdatesView = dynamic(
  () => import('@/components/updates-view').then(m => ({ default: m.UpdatesView })),
  {
    loading: () => <DashboardHeaderSkeleton />,
    ssr: false,
  }
)

const ManaShortsFeed = dynamic(
  () => import('@/components/shorts-feed'),
  { ssr: false, loading: () => <div className="w-full h-[500px] bg-gray-50 animate-pulse rounded-xl" /> }
)

const Footer = dynamic(
  () => import('@/components/footer'),
  { ssr: false, loading: () => <div className="h-20 bg-gray-50 animate-pulse" /> }
)

const MaintenancePage = dynamic(
  () => import('@/components/maintenance-page'),
  { ssr: false, loading: () => <div className="fixed inset-0 bg-gray-900 animate-pulse" /> }
)

/**
 * HomeView — ONLY rendered when currentView === 'home'.
 * When currentView !== 'home', this component DOES NOT EXIST in the DOM.
 * The hero image inside this component CANNOT bleed into other views.
 *
 * FEATURE TOGGLES: Each section is conditionally rendered based on useAppConfig().
 * - enableListings → CategoriesSection, FeaturedListings
 * - enableRealEstate → RealEstateSection
 * - enableShorts → ManaShortsFeed (view-level, not here)
 * - enableLeaderProfiles → FeaturedProfiles
 * - enableSpinAndWin → DailySpinSection
 * - enableBlog → NewsSection
 */
function HomeView() {
  const { config } = useAppConfig()

  return (
    <div className="space-y-4 md:space-y-8">
      <ErrorBoundary name="StoriesSection"><StoriesSection /></ErrorBoundary>
      {/* Ticker sits directly below Stories, full-width with no padding */}
      <ErrorBoundary name="AnnouncementTicker"><AnnouncementTicker /></ErrorBoundary>
      <ErrorBoundary name="BannerAds"><BannerAds /></ErrorBoundary>
      <ErrorBoundary name="HeroSection"><DynamicHeroSection /></ErrorBoundary>
      {config.enableLeaderProfiles && (
        <ErrorBoundary name="FeaturedProfiles"><FeaturedProfiles /></ErrorBoundary>
      )}
      <ErrorBoundary name="WhatsAppCommunitySection"><WhatsAppCommunitySection /></ErrorBoundary>
      {config.enableSpinAndWin && (
        <ErrorBoundary name="DailySpinSection"><DailySpinSection /></ErrorBoundary>
      )}
      {config.enableListings && (
        <>
          <ErrorBoundary name="CategoriesSection"><CategoriesSection /></ErrorBoundary>
          <ErrorBoundary name="FeaturedListings"><FeaturedListings /></ErrorBoundary>
        </>
      )}
      {config.enableRealEstate && (
        <ErrorBoundary name="RealEstateSection"><RealEstateSection /></ErrorBoundary>
      )}
      {config.enableBlog && (
        <ErrorBoundary name="NewsSection"><NewsSection /></ErrorBoundary>
      )}
      <ErrorBoundary name="TestimonialsSection"><TestimonialsSection /></ErrorBoundary>
      <ErrorBoundary name="PricingSection"><PricingSection /></ErrorBoundary>

    </div>
  )
}

/**
 * CityPage — BULLETPROOF View Routing
 *
 * ═══════════════════════════════════════════════════════════════
 * CRITICAL RULES ENFORCED:
 *
 * 1. NO AnimatePresence on the main content area.
 *    AnimatePresence keeps old views in the DOM during exit animation,
 *    which causes the HomeView hero image to bleed into other views.
 *    REMOVED ENTIRELY.
 *
 * 2. STRICT conditional rendering via switch statement.
 *    Only ONE view component exists in the DOM at any time.
 *    When currentView === 'news', HomeView returns null and
 *    its hero image is COMPLETELY REMOVED from the DOM.
 *
 * 3. Zero exit animations. The previous view is destroyed instantly.
 *    No fade-out, no slide-out, no delay. Instant swap.
 *
 * 4. ALL views are dynamically imported with ssr: false.
 *    This reduces initial compilation memory and prevents OOM crashes.
 *    Each view is lazy-loaded when the user navigates to it.
 * ═══════════════════════════════════════════════════════════════
 */
export default function CityPage() {
  // const params = useParams()
  const cityName = 'choutuppal'
  // CRITICAL: Use individual selectors, NOT useAppStore() — subscribing to the
  // entire store re-renders on EVERY state change (even unrelated ones)
  const currentView = useAppStore((s) => s.currentView)
  const selectedCity = useAppStore((s) => s.selectedCity)
  const setCity = useAppStore((s) => s.setCity)
  const setAvailableCities = useAppStore((s) => s.setAvailableCities)
  const currentCity = useAppStore((s) => s.currentCity)
  const fetchSiteSettings = useAppStore((s) => s.fetchSiteSettings)
  const fetchPlatformSettings = useAppStore((s) => s.fetchPlatformSettings)

  // Feature toggle config
  const { config, isLoaded: configLoaded } = useAppConfig()
  const { user } = useAuth()

  // Sync URL slug → store on mount and when URL changes
  useEffect(() => {
    if (cityName && cityName !== selectedCity) {
      setCity(cityName, cityName.charAt(0).toUpperCase() + cityName.slice(1))
    }
  }, [cityName, selectedCity, setCity])

  // Fetch cities and settings on mount
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/cities')
        if (res.ok) {
          const data = await res.json()
          const cities = Array.isArray(data) ? data : (data?.data || [])
          setAvailableCities(cities)
          const match = cities.find((c: { slug: string }) => c.slug === cityName)
          if (match) {
            setCity(match.slug, match.name)
          }
        }
      } catch { /* non-critical */ }
    }
    init()
    fetchSiteSettings()
    fetchPlatformSettings()
  }, [cityName, setCity, setAvailableCities, fetchSiteSettings, fetchPlatformSettings])

  // Update document title
  useEffect(() => {
    try {
      const titles: Record<string, string> = {
        home: `${currentCity.brandName || 'Choutuppal'} 2.0 - Your Hyper-Local Super App`,
        explore: 'Explore Businesses',
        news: 'Local News',
        listing: 'Business Listing',
        dashboard: 'My Dashboard',

        search: 'Search',
        blog: 'Blog',
        'blog-detail': 'Blog Article',
        updates: 'Updates',
        community: 'Community',
        shorts: 'Mana Shorts',
        learn: 'Mana Learn',
        'video-player': 'Watch Video',
      }
      document.title = titles[currentView] || titles.home
    } catch { /* non-critical */ }
  }, [currentView, currentCity.brandName])

  /**
   * renderView — STRICT ONE-TO-ONE MAPPING with FEATURE TOGGLES.
   *
   * This is a plain switch statement. NO AnimatePresence.
   * NO exit animations. NO transition delays.
   *
   * Feature toggles are enforced here:
   * - enableShorts === false → 'shorts' view redirects to HomeView
   * - enableListings === false → 'explore' view redirects to HomeView
   * - enableRealEstate === false → 'explore' with 'Real Estate' query → HomeView
   * - enableBlog === false → 'blog'/'blog-detail'/'news' → HomeView
   * - enableLeaderProfiles === false → 'leader-profile' → HomeView
   */
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />
      case 'explore':
        // If listings are disabled, don't show explore view
        if (!config.enableListings && !config.enableRealEstate) return <HomeView />
        return <ErrorBoundary name="ExploreView"><ExploreView /></ErrorBoundary>
      case 'news':
        if (!config.enableBlog) return <HomeView />
        return <ErrorBoundary name="NewsView"><NewsView /></ErrorBoundary>
      case 'listing':
        if (!config.enableListings) return <HomeView />
        return <ErrorBoundary name="ListingView"><ListingView /></ErrorBoundary>
      case 'dashboard':
        return <ErrorBoundary name="DashboardView"><DashboardView /></ErrorBoundary>

      case 'search':
        return <ErrorBoundary name="SearchView"><SearchView /></ErrorBoundary>
      case 'blog':
        if (!config.enableBlog) return <HomeView />
        return <ErrorBoundary name="BlogView"><BlogView /></ErrorBoundary>
      case 'blog-detail':
        if (!config.enableBlog) return <HomeView />
        return <ErrorBoundary name="BlogDetailView"><BlogDetailView /></ErrorBoundary>
      case 'updates':
        return <ErrorBoundary name="UpdatesView"><UpdatesView /></ErrorBoundary>
      case 'community':
        return <ErrorBoundary name="CommunityFeed"><CommunityFeed /></ErrorBoundary>
      case 'shorts':
        if (!config.enableShorts) return <HomeView />
        return <ErrorBoundary name="ManaShortsFeed"><ManaShortsFeed /></ErrorBoundary>
      case 'learn':
        return <ErrorBoundary name="LearnView"><LearnView /></ErrorBoundary>
      case 'video-player':
        return <ErrorBoundary name="VideoPlayerView"><VideoPlayerView /></ErrorBoundary>
      default:
        return <HomeView />
    }
  }

  if (
    configLoaded &&
    config.maintenanceMode
  ) {
    return (
      <ErrorBoundary name="MaintenancePage">
        <MaintenancePage />
      </ErrorBoundary>
    )
  }

  // Full-screen views (no container padding, no footer, no max-width)
  const isFullScreenView = currentView === 'shorts' || currentView === 'individual-profile' || currentView === 'leader-profile'

  if (isFullScreenView) {
    return (
      <div className={currentView === 'shorts' ? 'w-full h-[calc(100dvh-3.5rem)] md:h-screen' : 'w-full min-h-screen'}>
        <ErrorBoundary name="FullScreenView">
          {renderView()}
        </ErrorBoundary>
      </div>
    )
  }

  return (
    <div className="w-full min-h-full flex flex-col">
      <div className={`flex-1 mx-auto w-full py-3 md:py-6 md:pb-6 ${
        currentView === 'dashboard'
          ? 'max-w-md px-4 pb-20 md:max-w-7xl md:px-6'
          : 'max-w-7xl px-3 md:px-6 pb-20'
      }`}>
        <ErrorBoundary name="MainContent">
          {renderView()}
        </ErrorBoundary>
      </div>
      <ErrorBoundary name="Footer"><Footer /></ErrorBoundary>
    </div>
  )
}
