'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

// ─── Feature Toggle Types ───────────────────────────────────────────────────
export interface AppConfig {
  enablePayments: boolean
  enableShorts: boolean
  enableListings: boolean
  enableRealEstate: boolean
  enableLeaderProfiles: boolean
  enableSpinAndWin: boolean
  enableBlog: boolean
  enablePushNotifications: boolean
  maintenanceMode: boolean
}

const STORAGE_KEY = 'manaAppConfig'

// ─── Default: ALL features ON ──────────────────────────────────────────────
const DEFAULT_CONFIG: AppConfig = {
  enablePayments: true,
  enableShorts: true,
  enableListings: true,
  enableRealEstate: true,
  enableLeaderProfiles: true,
  enableSpinAndWin: true,
  enableBlog: true,
  enablePushNotifications: true,
  maintenanceMode: false,
}

// ─── Context ───────────────────────────────────────────────────────────────
interface AppConfigContextType {
  config: AppConfig
  isLoaded: boolean
  updateConfig: (partial: Partial<AppConfig>) => void
  resetConfig: () => void
  setConfig: (newConfig: AppConfig) => void
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined)

// ─── Provider ──────────────────────────────────────────────────────────────
export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<AppConfig>(DEFAULT_CONFIG)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AppConfig>
        // Merge with defaults so new features get default values
        setConfigState((prev) => ({ ...prev, ...parsed }))
      }
    } catch {
      // Use defaults
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Listen for storage changes from other tabs
  useEffect(() => {
    function handleStorageEvent(e: StorageEvent) {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as Partial<AppConfig>
          setConfigState((prev) => ({ ...prev, ...parsed }))
        } catch { /* ignore */ }
      }
    }
    window.addEventListener('storage', handleStorageEvent)
    return () => window.removeEventListener('storage', handleStorageEvent)
  }, [])

  // Custom event for same-tab updates (so multiple components react instantly)
  useEffect(() => {
    function handleCustomEvent() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<AppConfig>
          setConfigState((prev) => ({ ...prev, ...parsed }))
        }
      } catch { /* ignore */ }
    }
    window.addEventListener('manaAppConfigChanged', handleCustomEvent)
    return () => window.removeEventListener('manaAppConfigChanged', handleCustomEvent)
  }, [])

  const persistAndNotify = useCallback((newConfig: AppConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
    // Dispatch custom event so other components in the same tab react immediately
    window.dispatchEvent(new CustomEvent('manaAppConfigChanged'))
  }, [])

  const updateConfig = useCallback((partial: Partial<AppConfig>) => {
    setConfigState((prev) => {
      const next = { ...prev, ...partial }
      persistAndNotify(next)
      return next
    })
  }, [persistAndNotify])

  const resetConfig = useCallback(() => {
    setConfigState(DEFAULT_CONFIG)
    persistAndNotify(DEFAULT_CONFIG)
  }, [persistAndNotify])

  const setConfig = useCallback((newConfig: AppConfig) => {
    setConfigState(newConfig)
    persistAndNotify(newConfig)
  }, [persistAndNotify])

  const value = useMemo<AppConfigContextType>(() => ({
    config,
    isLoaded,
    updateConfig,
    resetConfig,
    setConfig,
  }), [config, isLoaded, updateConfig, resetConfig, setConfig])

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  )
}

// ─── Hook ──────────────────────────────────────────────────────────────────
export function useAppConfig(): AppConfigContextType {
  const context = useContext(AppConfigContext)
  // During SSR or if provider is not yet mounted, return safe defaults
  if (context === undefined) {
    return {
      config: DEFAULT_CONFIG,
      isLoaded: false,
      updateConfig: () => {},
      resetConfig: () => {},
      setConfig: () => {},
    }
  }
  return context
}

// ─── Feature Toggle Descriptions ───────────────────────────────────────────
export const FEATURE_DESCRIPTIONS: Record<keyof AppConfig, { label: string; description: string; icon: string; dangerZone?: boolean }> = {
  enablePayments: {
    label: 'Enable Payment Gateway',
    description: 'Turn off to make all listings free and skip Razorpay checkout.',
    icon: '💳',
  },
  enableShorts: {
    label: 'Enable YouTube / Mana Shorts',
    description: 'Turn off to hide the Shorts section from Home and navigation.',
    icon: '🎬',
  },
  enableListings: {
    label: 'Enable General Listings',
    description: 'Turn off to hide Services, Jobs, and Categories sections from the home page.',
    icon: '🏪',
  },
  enableRealEstate: {
    label: 'Enable Real Estate Section',
    description: 'Turn off to hide the Real Estate section and its navigation button.',
    icon: '🏠',
  },
  enableLeaderProfiles: {
    label: 'Enable Political Leader Profiles',
    description: 'Turn off to hide the Leaders section from the home page and community.',
    icon: '🏛️',
  },
  enableSpinAndWin: {
    label: 'Enable Spin & Win Game',
    description: 'Turn off to hide the Spin & Win section from the home page.',
    icon: '🎰',
  },
  enableBlog: {
    label: 'Enable Blog / News Section',
    description: 'Turn off to hide the Blog menu and News section.',
    icon: '📰',
  },
  enablePushNotifications: {
    label: 'Enable Push Notifications',
    description: 'Turn off to hide notification prompts and banners.',
    icon: '🔔',
  },
  maintenanceMode: {
    label: 'Maintenance Mode',
    description: 'When ON, all users see a "Site Under Maintenance" page. Super Admins can still access the app.',
    icon: '🔧',
    dangerZone: true,
  },
}
