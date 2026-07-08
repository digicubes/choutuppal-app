'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import type { CityData } from '@/lib/store'
import { getRoutingConfig } from '@/lib/city-routing'

/**
 * SettingsInitializer — Fetches site settings and the current city
 * from the subdomain-aware API on first mount.
 *
 * Flow:
 * 1. Call /api/city/resolve → gets city based on subdomain
 * 2. Call /api/cities → gets all available cities
 * 3. Call /api/settings → gets site settings
 * 4. Call /api/platform-settings → gets platform config
 * 5. Apply the resolved city as the current city in Zustand
 */
export function SettingsInitializer() {
  const fetchSiteSettings = useAppStore((s) => s.fetchSiteSettings)
  const fetchPlatformSettings = useAppStore((s) => s.fetchPlatformSettings)
  const setAvailableCities = useAppStore((s) => s.setAvailableCities)
  const setCity = useAppStore((s) => s.setCity)
  const setCityData = useAppStore((s) => s.setCityData)
  const applyCityTheme = useAppStore((s) => s.applyCityTheme)
  const detectLocation = useAppStore((s) => s.detectLocation)
  const locationDetected = useAppStore((s) => s.locationDetected)
  const setRoutingConfig = useAppStore((s) => s.setRoutingConfig)

  // Hydrate routing config from localStorage on client mount
  useEffect(() => {
    setRoutingConfig(getRoutingConfig())
  }, [setRoutingConfig])

  // Fetch settings and resolve city from subdomain
  useEffect(() => {
    fetchSiteSettings()
    fetchPlatformSettings()
  }, [fetchSiteSettings, fetchPlatformSettings])


  // Resolve the current city from the subdomain and fetch all cities
  useEffect(() => {
    const initializeCity = async () => {
      try {
        // 1. Resolve current city from subdomain (middleware sets x-city-subdomain header)
        const resolveRes = await fetch('/api/city/resolve')
        if (resolveRes.ok) {
          const resolveData = await resolveRes.json()
          if (resolveData.city) {
            const city = resolveData.city
            setCity(city.slug, city.name)
            setCityData({
              id: city.id,
              name: city.name,
              slug: city.slug,
              subdomain: city.subdomain,
              state: city.state,
              brandName: city.brandName,
              logoUrl: city.logoUrl,
              heroImageUrl: city.heroImageUrl,
              primaryColor: city.primaryColor,
              secondaryColor: city.secondaryColor,
              latitude: city.latitude,
              longitude: city.longitude,
            })
            applyCityTheme({
              id: city.id,
              name: city.name,
              slug: city.slug,
              subdomain: city.subdomain,
              state: city.state,
              brandName: city.brandName,
              logoUrl: city.logoUrl,
              heroImageUrl: city.heroImageUrl,
              primaryColor: city.primaryColor,
              secondaryColor: city.secondaryColor,
              latitude: city.latitude,
              longitude: city.longitude,
            })
          }
          // If invalid subdomain, redirect to root domain
          if (resolveData.invalidSubdomain && typeof window !== 'undefined') {
            const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'mana.in'
            const hostname = window.location.hostname
            if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
              window.location.href = `https://${rootDomain}`
            }
          }
        }
      } catch {
        // Non-critical — will use defaults
      }

      // 2. Fetch all available cities
      try {
        const res = await fetch('/api/cities')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const cities: CityData[] = data.map((c: Record<string, unknown>) => ({
              id: c.id as string,
              name: c.name as string,
              slug: c.slug as string,
              subdomain: (c.subdomain as string) || (c.slug as string),
              state: (c.state as string) || 'Telangana',
              brandName: (c.brandName as string) || `${c.name} App`,
              logoUrl: (c.logoUrl as string) || null,
              heroImageUrl: (c.heroImageUrl as string) || null,
              primaryColor: (c.primaryColor as string) || '#4169E1',
              secondaryColor: (c.secondaryColor as string) || '#D4AF37',
              latitude: (c.latitude as number) || 17.2985,
              longitude: (c.longitude as number) || 78.9256,
            }))
            setAvailableCities(cities)
          }
        }
      } catch {
        // Non-critical
      }
    }
    initializeCity()
  }, [setCity, setCityData, applyCityTheme, setAvailableCities])

  // Auto-detect location once cities are loaded
  useEffect(() => {
    if (!locationDetected) {
      const timer = setTimeout(() => {
        detectLocation()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [locationDetected, detectLocation])

  return null // renders nothing
}
