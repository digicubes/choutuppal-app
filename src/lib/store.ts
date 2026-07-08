import { create } from 'zustand'
import {
  getRoutingConfig,
  getCityUrl,
  extractCityFromPath,
  type RoutingConfig,
} from '@/lib/city-routing'

export type ViewType = 'home' | 'explore' | 'news' | 'listing' | 'dashboard' | 'admin' | 'super-admin' | 'search' | 'blog' | 'blog-detail' | 'community' | 'updates' | 'profile' | 'individual-profile' | 'leader-profile' | 'shorts' | 'learn' | 'video-player'

interface Notification {
  id: string
  message: string
  time: string
}

interface CurrentUser {
  id: string
  fullName: string
  role: string
  coinsBalance: number
  subscriptionTier: string
  managedCityId?: string | null
  agentCityId?: string | null
  isAgentApproved?: boolean
  totalEarnings?: number
  pendingPayout?: number
  upiId?: string | null
}

export interface SiteSettings {
  id: string
  logoUrl: string | null
  appLogoUrl: string | null
  faviconUrl: string | null
  pwaIconUrl: string | null
  affiliateBaseUrl: string | null
  heroHeadline: string | null
  heroDescription: string | null
  heroImageUrl: string | null
  primaryColor: string
  accentColor: string
  metaTitle: string | null
  metaDescription: string | null
  ogImageUrl: string | null
  whatsappSupportNumber: string
  whatsappCommunityLink: string
  whatsappChannelLink: string
  heroWhatsappText: string
  franchiseWhatsappText: string
  agentWhatsappText: string
  instagramUrl: string
  facebookUrl: string
  youtubeUrl: string
  xUrl: string
  appName: string
  tagline: string | null
  supportEmail: string | null
  contactName: string
  contactAddress: string
  contactPhone: string
}

export interface CityData {
  id: string
  name: string
  slug: string
  subdomain: string
  state: string
  brandName: string
  logoUrl: string | null
  heroImageUrl: string | null
  primaryColor: string
  secondaryColor: string
  latitude: number
  longitude: number
}

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: '',
  logoUrl: '/brand-logo.png',
  appLogoUrl: '/brand-logo.png',
  faviconUrl: '/icons/icon-192x192.png?v=new',
  pwaIconUrl: '/icons/icon-512x512.png?v=new',
  affiliateBaseUrl: 'https://choutuppal.com',
  heroHeadline: 'Discover Choutuppal — Your Town, One App',
  heroDescription: 'Find the best local businesses, services, real estate, news, and more — all in one super app built for Choutuppal.',
  heroImageUrl: null,
  primaryColor: '#D4AF37',
  accentColor: '#4169E1',
  metaTitle: null,
  metaDescription: null,
  ogImageUrl: null,
  whatsappSupportNumber: '918790083706',
  whatsappCommunityLink: '',
  whatsappChannelLink: '',
  heroWhatsappText: 'నమస్కారం, చౌతుప్పల్ యాప్ గురించి సమాచారం కావాలి',
  franchiseWhatsappText: 'నా నగరానికి ఫ్రాంచైజీ కోసం అప్లై చేయాలనుకుంటున్నాను',
  agentWhatsappText: 'చౌతుప్పల్ యాప్ లో ఏజెంట్ గా చేరాలనుకుంటున్నాను',
  instagramUrl: '',
  facebookUrl: '',
  youtubeUrl: '',
  contactName: 'Citizen CSC',
  contactAddress: 'Choutuppal, Yadadri, Telangana-508252',
  contactPhone: '8790083706',
  xUrl: '',
  appName: 'Choutuppal App',
  tagline: '',
  supportEmail: '',
}

const DEFAULT_CITY: CityData = {
  id: '',
  name: 'Choutuppal',
  slug: 'choutuppal',
  subdomain: 'choutuppal',
  state: 'Telangana',
  brandName: 'Choutuppal App',
  logoUrl: null,
  heroImageUrl: null,
  primaryColor: '#4169E1',
  secondaryColor: '#D4AF37',
  latitude: 17.2985,
  longitude: 78.9256,
}

interface AppState {
  // Navigation
  currentView: ViewType
  selectedListingSlug: string | null
  selectedBlogSlug: string | null
  selectedVideoId: string | null
  isStoryOpen: boolean
  setIsStoryOpen: (open: boolean) => void
  setSelectedListing: (slug: string | null) => void
  setSelectedBlogSlug: (slug: string | null) => void
  setSelectedVideoId: (id: string | null) => void
  navigateTo: (view: ViewType) => void

  // City (Multi-Tenancy)
  selectedCity: string
  selectedCityName: string
  currentCity: CityData
  availableCities: CityData[]
  locationDetected: boolean
  locationLoading: boolean
  setCity: (slug: string, name: string) => void
  /** Smart city switch — uses navigateToCity() which respects routing config */
  switchCity: (slug: string) => void
  setCityData: (city: CityData) => void
  setAvailableCities: (cities: CityData[]) => void
  detectLocation: () => void

  // Routing Configuration (domain-aware)
  routingConfig: RoutingConfig
  setRoutingConfig: (config: Partial<RoutingConfig>) => void

  // User (synced from auth context)
  currentUser: CurrentUser | null
  setCurrentUser: (user: CurrentUser | null) => void

  // Site Settings
  siteSettings: SiteSettings
  setSiteSettings: (settings: SiteSettings) => void
  fetchSiteSettings: () => Promise<void>

  // Agent Role
  agentRole: string | null

  // Platform Settings
  platformSettings: Record<string, string>
  fetchPlatformSettings: () => Promise<void>

  // Dynamic Theme Colors
  themePrimary: string
  themeSecondary: string
  applyCityTheme: (city: CityData) => void

  // UI State
  showBottomNav: boolean
  setShowBottomNav: (show: boolean) => void
  isSearchOpen: boolean
  setSearchOpen: (open: boolean) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  showSpinWheel: boolean
  setShowSpinWheel: (show: boolean) => void
  showLeadForm: boolean
  setShowLeadForm: (show: boolean) => void
  leadFormListingId: string | null
  setLeadFormListingId: (id: string | null) => void

  // Admin state
  adminTab: string
  setAdminTab: (tab: string) => void

  // Dashboard state
  dashboardTab: string
  setDashboardTab: (tab: string) => void

  // Social Network state
  selectedProfileUserId: string | null
  setSelectedProfileUserId: (userId: string | null) => void
  profileType: 'individual' | 'leader' | null
  setProfileType: (type: 'individual' | 'leader' | null) => void
  communityTab: 'feed' | 'leaders'
  setCommunityTab: (tab: 'feed' | 'leaders') => void

  // Notification
  notifications: Notification[]
  addNotification: (message: string) => void
  clearNotifications: () => void
}

// Haversine distance in km
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentView: 'home',
  selectedListingSlug: null,
  selectedBlogSlug: null,
  selectedVideoId: null,
  isStoryOpen: false,
  setIsStoryOpen: (open) => set({ isStoryOpen: open }),
  setSelectedListing: (slug) => set({ selectedListingSlug: slug, showBottomNav: !slug }),
  setSelectedBlogSlug: (slug) => set({ selectedBlogSlug: slug }),
  setSelectedVideoId: (id) => set({ selectedVideoId: id }),
  navigateTo: (view) => set({ currentView: view, showBottomNav: view !== 'listing' && view !== 'video-player' && view !== 'shorts' && view !== 'individual-profile' && view !== 'leader-profile' }),

  // City (Multi-Tenancy)
  selectedCity: 'choutuppal',
  selectedCityName: 'Choutuppal',
  currentCity: DEFAULT_CITY,
  availableCities: [],
  locationDetected: false,
  locationLoading: false,
  setCity: (slug, name) => {
    const cities = get().availableCities
    const city = cities.find(c => c.slug === slug)
    if (city) {
      set({ selectedCity: slug, selectedCityName: name, currentCity: city })
      get().applyCityTheme(city)
    } else {
      set({ selectedCity: slug, selectedCityName: name })
    }
  },
  /**
   * Smart city switch — uses navigateToCity() from city-routing.ts
   * - Path mode (default): navigates to /city/[slug]
   * - Subdomain mode (when enabled): navigates to [slug].[baseDomain]
   */
  switchCity: (slug: string) => {
    if (typeof window === 'undefined') return

    const config = get().routingConfig
    const targetUrl = getCityUrl(slug, config)

    // For path-based routing, check if we're already on this city
    if (config.routingMode === 'path' || !config.isCustomDomainActive) {
      const currentPath = window.location.pathname
      const targetPath = `/city/${slug}`

      if (currentPath === targetPath || currentPath.startsWith(targetPath + '/')) {
        // Already on this city — just update local state
        const cities = get().availableCities
        const city = cities.find(c => c.slug === slug || c.subdomain === slug)
        if (city) {
          set({ selectedCity: city.slug, selectedCityName: city.name, currentCity: city })
          get().applyCityTheme(city)
        }
        return
      }
    }

    // Navigate to the new city URL
    window.location.href = targetUrl
  },
  setCityData: (city) => set({ currentCity: city }),
  setAvailableCities: (cities) => set({ availableCities: cities }),
  detectLocation: () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    set({ locationLoading: true })
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const cities = get().availableCities
        let closestCity: CityData | null = null
        let minDist = Infinity
        for (const city of cities) {
          const dist = getDistanceKm(latitude, longitude, city.latitude, city.longitude)
          if (dist < minDist) { minDist = dist; closestCity = city }
        }
        if (closestCity && minDist <= 100) {
          get().setCity(closestCity.slug, closestCity.name)
        }
        set({ locationDetected: true, locationLoading: false })
      },
      () => { set({ locationDetected: true, locationLoading: false }) },
      { timeout: 10000, enableHighAccuracy: false }
    )
  },

  // Routing Configuration
  routingConfig: {
    routingMode: 'path',
    baseDomain: 'mana.in',
    isCustomDomainActive: false,
    subdomainRoutingEnabled: false,
  },

  setRoutingConfig: (config) => {
    // Dynamic import to avoid circular dependency at module level
    import('@/lib/city-routing').then(({ saveRoutingConfig }) => {
      const updated = saveRoutingConfig(config)
      set({ routingConfig: updated })
    })
  },

  // User
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // Site Settings
  siteSettings: DEFAULT_SITE_SETTINGS,
  setSiteSettings: (settings) => set({ siteSettings: settings }),
  fetchSiteSettings: async () => {
    if (get().siteSettings.id) return
    try {
      const res = await fetch('/api/settings')
      if (res.ok) { const data = await res.json(); if (!data.error) set({ siteSettings: data }) }
    } catch { /* use defaults */ }
  },

  // Agent Role
  agentRole: null,

  // Platform Settings
  platformSettings: {},
  fetchPlatformSettings: async () => {
    try {
      const res = await fetch('/api/platform-settings')
      if (res.ok) {
        const data = await res.json()
        if (data && typeof data === 'object' && !data.error) set({ platformSettings: data })
      }
    } catch { /* non-critical */ }
  },

  // Dynamic Theme Colors
  themePrimary: '#4169E1',
  themeSecondary: '#D4AF37',
  applyCityTheme: (city) => {
    set({ themePrimary: city.primaryColor, themeSecondary: city.secondaryColor })
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--theme-primary', city.primaryColor)
      document.documentElement.style.setProperty('--theme-secondary', city.secondaryColor)
    }
  },

  // UI State
  showBottomNav: true,
  setShowBottomNav: (show) => set({ showBottomNav: show }),
  isSearchOpen: false,
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  showSpinWheel: false,
  setShowSpinWheel: (show) => set({ showSpinWheel: show }),
  showLeadForm: false,
  setShowLeadForm: (show) => set({ showLeadForm: show }),
  leadFormListingId: null,
  setLeadFormListingId: (id) => set({ leadFormListingId: id }),

  // Admin state
  adminTab: 'overview',
  setAdminTab: (tab) => set({ adminTab: tab }),

  // Dashboard state
  dashboardTab: 'overview',
  setDashboardTab: (tab) => set({ dashboardTab: tab }),

  // Social
  selectedProfileUserId: null,
  setSelectedProfileUserId: (userId) => set({ selectedProfileUserId: userId }),
  profileType: null,
  setProfileType: (type) => set({ profileType: type }),
  communityTab: 'feed',
  setCommunityTab: (tab) => set({ communityTab: tab }),

  // Notifications
  notifications: [],
  addNotification: (message) =>
    set((state) => ({
      notifications: [{ id: Date.now().toString(), message, time: 'Just now' }, ...state.notifications].slice(0, 20),
    })),
  clearNotifications: () => set({ notifications: [] }),
}))
