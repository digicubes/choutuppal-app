/**
 * ─── Routing Configuration Store ──────────────────────────────────
 *
 * Manages domain/routing settings with localStorage persistence.
 * Supports two routing modes:
 *   1. Path-based: /city/hyderabad (default, works everywhere)
 *   2. Subdomain: hyderabad.mana.in (requires custom domain + DNS)
 *
 * Settings persist across page reloads via localStorage.
 * ────────────────────────────────────────────────────────────────
 */

export type RoutingMode = 'path' | 'subdomain'

export interface RoutingConfig {
  /** The base custom domain (e.g., "mana.in") */
  baseDomain: string
  /** Whether custom domain routing is activated */
  subdomainRoutingEnabled: boolean
  /** Current routing mode — derived from subdomainRoutingEnabled + environment */
  routingMode: RoutingMode
  /** When the config was last updated */
  updatedAt: string
}

const STORAGE_KEY = 'mana_routing_config'

const DEFAULT_CONFIG: RoutingConfig = {
  baseDomain: 'mana.in',
  subdomainRoutingEnabled: false,
  routingMode: 'path',
  updatedAt: new Date().toISOString(),
}

/**
 * Load routing config from localStorage.
 * Returns defaults if nothing stored or if parsing fails.
 */
export function loadRoutingConfig(): RoutingConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        // Always derive routingMode from enabled flag + environment detection
        routingMode: deriveRoutingMode(parsed.subdomainRoutingEnabled),
      }
    }
  } catch {
    // Corrupted data — reset to defaults
  }
  return DEFAULT_CONFIG
}

const COOKIE_KEY = 'mana_routing_config'

/**
 * Save routing config to localStorage AND a cookie.
 * The cookie is needed so the middleware (server-side) can read
 * the routing config — middleware cannot access localStorage.
 */
export function saveRoutingConfig(config: Partial<RoutingConfig>): RoutingConfig {
  const current = loadRoutingConfig()
  const updated: RoutingConfig = {
    ...current,
    ...config,
    routingMode: deriveRoutingMode(
      config.subdomainRoutingEnabled !== undefined
        ? config.subdomainRoutingEnabled
        : current.subdomainRoutingEnabled
    ),
    updatedAt: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    // Save to localStorage for client-side reads
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    // Save to cookie for middleware (server-side) reads
    // Cookie expires in 365 days, accessible on all paths
    const cookieValue = JSON.stringify({
      baseDomain: updated.baseDomain,
      subdomainRoutingEnabled: updated.subdomainRoutingEnabled,
    })
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(cookieValue)}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
  }

  return updated
}

/**
 * Derive the actual routing mode based on:
 * 1. Whether subdomain routing is enabled in config
 * 2. Whether we're in an environment that supports subdomains
 *    (not localhost, not sandbox preview)
 */
function deriveRoutingMode(subdomainEnabled: boolean): RoutingMode {
  if (!subdomainEnabled) return 'path'

  if (typeof window === 'undefined') return 'path'

  const hostname = window.location.hostname

  // Sandbox/preview environments can't use subdomains
  if (
    hostname.includes('space-z.ai') ||
    hostname.includes('vercel.app') ||
    hostname.includes('netlify.app') ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  ) {
    // Even if admin enabled subdomain routing, we can't use it in sandbox
    return 'path'
  }

  return 'subdomain'
}

/**
 * Get the full subdomain URL for a city.
 * Only meaningful when routingMode is 'subdomain'.
 */
export function getSubdomainUrl(citySlug: string, baseDomain: string, path: string = ''): string {
  return `https://${citySlug}.${baseDomain}${path}`
}

/**
 * Get the path-based URL for a city.
 */
export function getPathUrl(citySlug: string, path: string = ''): string {
  return `/city/${citySlug}${path}`
}

/**
 * Get the appropriate city URL based on current routing mode.
 */
export function getCityUrl(citySlug: string, config: RoutingConfig, path: string = ''): string {
  if (config.routingMode === 'subdomain' && config.baseDomain) {
    return getSubdomainUrl(citySlug, config.baseDomain, path)
  }
  return getPathUrl(citySlug, path)
}

/**
 * Reset routing config to defaults.
 */
export function resetRoutingConfig(): RoutingConfig {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
  return DEFAULT_CONFIG
}

/**
 * Check if the current environment supports subdomain routing.
 * Returns an object with the check result and reason.
 */
export function checkSubdomainSupport(): { supported: boolean; reason: string } {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'Server-side rendering — cannot determine environment' }
  }

  const hostname = window.location.hostname

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return { supported: false, reason: 'Localhost does not support subdomains. Use *.localhost pattern for local testing.' }
  }

  if (hostname.includes('space-z.ai')) {
    return { supported: false, reason: 'Sandbox/preview environment (space-z.ai) does not support custom subdomains.' }
  }

  if (hostname.includes('vercel.app') || hostname.includes('netlify.app')) {
    return { supported: false, reason: 'Deployment preview URL — custom domain not connected yet.' }
  }

  // If we're on a custom domain (e.g., mana.in), subdomains should work
  return { supported: true, reason: 'Custom domain detected — subdomain routing is available.' }
}
