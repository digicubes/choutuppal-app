'use client'

import { useSyncExternalStore, useCallback, useEffect } from 'react'
import { getRoutingConfig, saveRoutingConfig } from '@/lib/city-routing'

// ─── Types ──────────────────────────────────────────────────────

export interface SubdomainMapping {
  /** Unique ID (generated via Date.now().toString()) */
  id: string
  /** Display name, e.g. "Hyderabad" */
  cityName: string
  /** URL-safe prefix, e.g. "hyderabad" — lowercase, no spaces */
  subdomainPrefix: string
}

export interface DomainRoutingSettings {
  baseDomain: string
  isCustomDomainActive: boolean
  subdomainMappings: SubdomainMapping[]
}

// ─── Constants ──────────────────────────────────────────────────

const SUBDOMAIN_MAPPINGS_KEY = 'mana_subdomain_mappings'

const DEFAULT_SUBDOMAIN_MAPPINGS: SubdomainMapping[] = []

// ─── Internal Store ─────────────────────────────────────────────

/**
 * Module-level store enabling useSyncExternalStore.
 * On the server / before hydration, returns defaults with isLoaded=false.
 * After client-side hydration, reads from localStorage and sets isLoaded=true.
 */

interface DomainRoutingState {
  baseDomain: string
  isCustomDomainActive: boolean
  subdomainMappings: SubdomainMapping[]
  isLoaded: boolean
}

const DEFAULT_STATE: DomainRoutingState = {
  baseDomain: 'mana.in',
  isCustomDomainActive: false,
  subdomainMappings: DEFAULT_SUBDOMAIN_MAPPINGS,
  isLoaded: false,
}

let currentState: DomainRoutingState = { ...DEFAULT_STATE }
let isHydrated = false
const listeners = new Set<() => void>()

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

function getSnapshot(): DomainRoutingState {
  return currentState
}

function getServerSnapshot(): DomainRoutingState {
  return { ...DEFAULT_STATE }
}

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Auto-generate a subdomain prefix from a city name:
 * lowercase, replace spaces with hyphens, remove special chars.
 */
function generatePrefix(cityName: string): string {
  return cityName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/**
 * Validate a subdomain prefix:
 * must be lowercase alphanumeric + hyphens, 2–50 chars.
 */
function isValidPrefix(prefix: string): boolean {
  return /^[a-z0-9-]+$/.test(prefix) && prefix.length >= 2 && prefix.length <= 50
}

/**
 * Read subdomain mappings from localStorage. Returns empty array on
 * failure or when running on the server.
 */
function readSubdomainMappings(): SubdomainMapping[] {
  if (typeof window === 'undefined') return DEFAULT_SUBDOMAIN_MAPPINGS
  try {
    const stored = localStorage.getItem(SUBDOMAIN_MAPPINGS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // Corrupted data — fall back to defaults
  }
  return DEFAULT_SUBDOMAIN_MAPPINGS
}

/**
 * Persist subdomain mappings to localStorage.
 */
function persistSubdomainMappings(mappings: SubdomainMapping[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SUBDOMAIN_MAPPINGS_KEY, JSON.stringify(mappings))
}

/**
 * Hydrate the internal store from localStorage (called once, lazily).
 */
function hydrateFromLocalStorage(): void {
  if (isHydrated) return
  isHydrated = true

  const config = getRoutingConfig()
  const mappings = readSubdomainMappings()

  currentState = {
    baseDomain: config.baseDomain,
    isCustomDomainActive: config.isCustomDomainActive,
    subdomainMappings: mappings,
    isLoaded: true,
  }
  emitChange()
}

// ─── Hook ───────────────────────────────────────────────────────

export function useDomainRouting() {
  // useSyncExternalStore handles SSR hydration safely:
  // getServerSnapshot returns defaults (isLoaded=false),
  // getSnapshot reads from currentState.
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    if (typeof window !== 'undefined' && !isHydrated) {
      hydrateFromLocalStorage()
    }
  }, [])

  // --- Actions ---

  /** Save a new base domain. Also persists to the existing mana_routing_config key. */
  const saveBaseDomain = useCallback((domain: string) => {
    saveRoutingConfig({ baseDomain: domain })
    currentState = { ...currentState, baseDomain: domain }
    emitChange()
  }, [])

  /** Toggle custom domain active state. Also persists to the existing mana_routing_config key. */
  const toggleCustomDomain = useCallback((active: boolean) => {
    saveRoutingConfig({ isCustomDomainActive: active })
    currentState = { ...currentState, isCustomDomainActive: active }
    emitChange()
  }, [])

  /**
   * Add a new subdomain mapping.
   * If subdomainPrefix is empty, auto-generates it from cityName.
   * Validates the final prefix before adding; silently skips invalid entries.
   */
  const addMapping = useCallback((cityName: string, subdomainPrefix: string) => {
    const prefix = subdomainPrefix.trim() || generatePrefix(cityName)
    if (!isValidPrefix(prefix)) return

    const newMapping: SubdomainMapping = {
      id: Date.now().toString(),
      cityName,
      subdomainPrefix: prefix,
    }

    const updatedMappings = [...currentState.subdomainMappings, newMapping]
    persistSubdomainMappings(updatedMappings)
    currentState = { ...currentState, subdomainMappings: updatedMappings }
    emitChange()
  }, [])

  /**
   * Update an existing mapping by ID.
   * If subdomainPrefix is empty, auto-generates it from cityName.
   * Validates the final prefix before updating; silently skips invalid entries.
   */
  const updateMapping = useCallback((id: string, cityName: string, subdomainPrefix: string) => {
    const prefix = subdomainPrefix.trim() || generatePrefix(cityName)
    if (!isValidPrefix(prefix)) return

    const updatedMappings = currentState.subdomainMappings.map((m) =>
      m.id === id ? { ...m, cityName, subdomainPrefix: prefix } : m
    )
    persistSubdomainMappings(updatedMappings)
    currentState = { ...currentState, subdomainMappings: updatedMappings }
    emitChange()
  }, [])

  /** Delete a mapping by ID. */
  const deleteMapping = useCallback((id: string) => {
    const updatedMappings = currentState.subdomainMappings.filter((m) => m.id !== id)
    persistSubdomainMappings(updatedMappings)
    currentState = { ...currentState, subdomainMappings: updatedMappings }
    emitChange()
  }, [])

  // --- Routing Helper ---

  /**
   * Get the URL for a city based on the current routing configuration.
   *
   * - If isCustomDomainActive AND a mapping exists for this city slug → https://[prefix].[baseDomain]
   * - If isCustomDomainActive but NO mapping for this city slug  → https://[slug].[baseDomain]
   * - If NOT active → /city/[slug]
   */
  const getCityUrl = useCallback(
    (citySlug: string): string => {
      if (state.isCustomDomainActive) {
        // Look for an explicit mapping whose prefix or slugified cityName matches
        const mapping = state.subdomainMappings.find(
          (m) =>
            m.subdomainPrefix === citySlug ||
            generatePrefix(m.cityName) === citySlug
        )

        const prefix = mapping ? mapping.subdomainPrefix : citySlug
        return `https://${prefix}.${state.baseDomain}`
      }

      return `/city/${citySlug}`
    },
    [state.isCustomDomainActive, state.baseDomain, state.subdomainMappings]
  )

  return {
    // State
    baseDomain: state.baseDomain,
    isCustomDomainActive: state.isCustomDomainActive,
    subdomainMappings: state.subdomainMappings,
    isLoaded: state.isLoaded,

    // Actions
    saveBaseDomain,
    toggleCustomDomain,
    addMapping,
    updateMapping,
    deleteMapping,

    // Routing helper
    getCityUrl,
  }
}
