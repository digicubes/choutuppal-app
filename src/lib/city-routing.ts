/**
 * ─── Smart City Routing Utility ──────────────────────────────
 *
 * A SINGLE source of truth for navigating between cities.
 * Used by all city dropdowns, buttons, and the Zustand store.
 *
 * Routing Logic:
 *   1. Read routing config from localStorage
 *   2. IF subdomain routing is ACTIVE + custom domain is set:
 *        → Navigate to https://[slug].[baseDomain]
 *   3. ELSE (default — path-based routing):
 *        → Navigate to /city/[slug]
 *
 * This ensures the admin can toggle routing modes from the Admin Panel,
 * and ALL components automatically follow.
 */

export interface RoutingConfig {
  /** 'path' = /city/[slug] routing (default, works everywhere) */
  /** 'subdomain' = [slug].[baseDomain] routing (requires wildcard DNS) */
  routingMode: 'path' | 'subdomain'
  /** The base domain for subdomain routing (e.g., 'mana.in') */
  baseDomain: string
  /** Whether custom domain is connected and active */
  isCustomDomainActive: boolean
  /** Whether subdomain routing is enabled by admin (actual mode may differ based on environment) */
  subdomainRoutingEnabled: boolean
}

const ROUTING_CONFIG_KEY = 'mana_routing_config'

const DEFAULT_ROUTING_CONFIG: RoutingConfig = {
  routingMode: 'path',
  baseDomain: 'mana.in',
  isCustomDomainActive: false,
  subdomainRoutingEnabled: false,
}

/** Read routing config from localStorage */
export function getRoutingConfig(): RoutingConfig {
  if (typeof window === 'undefined') return DEFAULT_ROUTING_CONFIG
  try {
    const stored = localStorage.getItem(ROUTING_CONFIG_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        routingMode: parsed.routingMode || 'path',
        baseDomain: parsed.baseDomain || 'mana.in',
        isCustomDomainActive: parsed.isCustomDomainActive === true,
        subdomainRoutingEnabled: parsed.subdomainRoutingEnabled === true,
      }
    }
  } catch {
    // Corrupted — use defaults
  }
  return DEFAULT_ROUTING_CONFIG
}

/** Save routing config to localStorage */
export function saveRoutingConfig(config: Partial<RoutingConfig>): RoutingConfig {
  const current = getRoutingConfig()
  const updated = { ...current, ...config }
  if (typeof window !== 'undefined') {
    localStorage.setItem(ROUTING_CONFIG_KEY, JSON.stringify(updated))
  }
  return updated
}

/** Get the URL for a city based on current routing config */
export function getCityUrl(slug: string, config?: RoutingConfig): string {
  const cfg = config || getRoutingConfig()

  // Subdomain routing: [slug].[baseDomain]
  if (cfg.routingMode === 'subdomain' && cfg.isCustomDomainActive) {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
    // On localhost, always use path-based (subdomains don't work locally)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `/city/${slug}`
    }
    return `https://${slug}.${cfg.baseDomain}`
  }

  // Path-based routing (default): /city/[slug]
  return `/city/${slug}`
}

/**
 * ─── navigateToCity(slug) ──────────────────────────────
 * THE single function to navigate to any city.
 * Used by: Header city selector, store.switchCity(), any city link.
 */
export function navigateToCity(slug: string): void {
  if (typeof window === 'undefined') return

  const config = getRoutingConfig()
  const targetUrl = getCityUrl(slug, config)

  // For path-based routing, check if we're already on this city
  if (config.routingMode === 'path' || !config.isCustomDomainActive) {
    const currentPath = window.location.pathname
    const targetPath = `/city/${slug}`

    if (currentPath === targetPath || currentPath.startsWith(targetPath + '/')) {
      // Already on this city — don't do a full page reload
      // The calling component should update local state instead
      return
    }
  }

  // Navigate to the new city URL (full page navigation for city switch)
  window.location.href = targetUrl
}

/** Extract city slug from the current URL path (/city/[slug] → slug) */
export function extractCityFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/city\/([^/]+)/)
  return match ? match[1] : null
}

/** Check if a string is a valid city slug format */
export function isValidCitySlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 2 && slug.length <= 50
}

/** Reserved subdomains that are NOT city subdomains */
export const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'admin', 'mail', 'ftp', 'smtp', 'pop', 'imap',
  'blog', 'docs', 'app', 'staging', 'dev', 'test', 'cdn',
  'assets', 'static', 'media', 'uploads', 'demo',
])

/** Extract subdomain from a hostname (e.g., hyderabad.mana.in → hyderabad) */
export function extractSubdomain(hostname: string, baseDomain: string): string | null {
  if (!hostname) return null
  const host = hostname.split(':')[0].toLowerCase()

  // *.localhost pattern for local testing
  if (host.endsWith('.localhost')) {
    const sub = host.replace('.localhost', '')
    if (sub && !RESERVED_SUBDOMAINS.has(sub)) return sub
    return null
  }

  // Production: *.baseDomain pattern
  if (host.endsWith(`.${baseDomain}`)) {
    const sub = host.replace(`.${baseDomain}`, '')
    if (!sub || RESERVED_SUBDOMAINS.has(sub)) return null
    return sub
  }

  return null
}
