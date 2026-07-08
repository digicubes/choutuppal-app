import { db } from '@/lib/db'

/**
 * ─── Subdomain Multi-Tenancy Configuration ──────────────────────
 *
 * Primary domain: mana.in (production), localhost (development)
 * City subdomains: choutuppal.mana.in, warangal.mana.in, etc.
 *
 * DEPLOYMENT NOTES (Vercel):
 * ──────────────────────────
 * 1. In Vercel → Settings → Domains → Add: *.mana.in (Wildcard Domain)
 * 2. In GoDaddy/Cloudflare DNS:
 *    - Add CNAME record: * → cname.vercel-dns.com
 *    - Add A record: @ → 76.76.21.21 (Vercel's IP)
 *    - Add CNAME: www → cname.vercel-dns.com
 * 3. Vercel will automatically handle *.mana.in requests
 *
 * ────────────────────────────────────────────────────────────────
 */

// Production root domain
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'mana.in'

// Subdomains that should NOT be treated as city subdomains
const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'admin', 'mail', 'ftp', 'smtp', 'pop', 'imap',
  'blog', 'docs', 'app', 'staging', 'dev', 'test', 'cdn',
  'assets', 'static', 'media', 'uploads', 'demo',
])

interface CityLookupResult {
  cityId: string
  subdomain: string
  city: {
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
}

/**
 * Extracts the subdomain from a hostname.
 *
 * Examples:
 *   choutuppal.mana.in → "choutuppal"
 *   warangal.mana.in   → "warangal"
 *   www.mana.in        → null (reserved)
 *   mana.in            → null (root domain)
 *   localhost          → null
 *   choutuppal.localhost → "choutuppal"
 */
export function extractSubdomain(hostname: string): string | null {
  if (!hostname) return null

  // Normalize: remove port
  const host = hostname.split(':')[0].toLowerCase()

  // Development: localhost handling
  if (host === 'localhost' || host === '127.0.0.1') {
    return null // On bare localhost, use query param instead
  }

  // Handle *.localhost pattern for local testing
  if (host.endsWith('.localhost')) {
    const sub = host.replace('.localhost', '')
    if (sub && !RESERVED_SUBDOMAINS.has(sub)) {
      return sub
    }
    return null
  }

  // Production: *.mana.in pattern
  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    const sub = host.replace(`.${ROOT_DOMAIN}`, '')
    if (!sub || RESERVED_SUBDOMAINS.has(sub)) {
      return null
    }
    return sub
  }

  // Custom domain support: if the host is a full domain that maps to a city
  // (future: could look up custom domains in DB)
  return null
}

/**
 * Server-side helper: Get city data from the request hostname.
 *
 * Usage in API routes:
 *   const cityInfo = await getCityFromHostname(request.headers)
 *   if (!cityInfo) return NextResponse.json({ error: 'City not found' }, { status: 404 })
 *   const cityId = cityInfo.cityId
 *
 * Usage in page.tsx (server component):
 *   const cityInfo = await getCityFromHostname(headers())
 */
export async function getCityFromHostname(
  headers: Headers
): Promise<CityLookupResult | null> {
  const hostname = headers.get('host') || ''

  // 1. Try subdomain extraction from hostname
  const subdomain = extractSubdomain(hostname)

  if (subdomain) {
    const city = await db.city.findUnique({
      where: { subdomain },
      select: {
        id: true, name: true, slug: true, subdomain: true, state: true,
        brandName: true, logoUrl: true, heroImageUrl: true,
        primaryColor: true, secondaryColor: true,
        latitude: true, longitude: true,
      },
    })

    if (city) {
      return { cityId: city.id, subdomain: city.subdomain, city }
    }

    // Subdomain doesn't exist in DB → return null (middleware will redirect)
    return null
  }

  // 2. Fallback: Check for ?city= query parameter (localhost dev)
  const url = headers.get('x-middleware-request-url') || headers.get('referer') || ''
  try {
    const urlObj = new URL(url, 'http://localhost')
    const citySlug = urlObj.searchParams.get('city')
    if (citySlug) {
      const city = await db.city.findFirst({
        where: { OR: [{ slug: citySlug }, { subdomain: citySlug }] },
        select: {
          id: true, name: true, slug: true, subdomain: true, state: true,
          brandName: true, logoUrl: true, heroImageUrl: true,
          primaryColor: true, secondaryColor: true,
          latitude: true, longitude: true,
        },
      })
      if (city) {
        return { cityId: city.id, subdomain: city.subdomain, city }
      }
    }
  } catch {
    // URL parsing failed, ignore
  }

  // 3. Default: Return the default city (Choutuppal) for root domain
  const defaultCity = await db.city.findFirst({
    where: { subdomain: 'choutuppal' },
    select: {
      id: true, name: true, slug: true, subdomain: true, state: true,
      brandName: true, logoUrl: true, heroImageUrl: true,
      primaryColor: true, secondaryColor: true,
      latitude: true, longitude: true,
    },
  })

  if (defaultCity) {
    return { cityId: defaultCity.id, subdomain: defaultCity.subdomain, city: defaultCity }
  }

  // 4. Absolute fallback: first city in DB
  const firstCity = await db.city.findFirst({
    select: {
      id: true, name: true, slug: true, subdomain: true, state: true,
      brandName: true, logoUrl: true, heroImageUrl: true,
      primaryColor: true, secondaryColor: true,
      latitude: true, longitude: true,
    },
  })

  if (firstCity) {
    return { cityId: firstCity.id, subdomain: firstCity.subdomain, city: firstCity }
  }

  return null
}

/**
 * Client-side helper: Build the full URL for a city subdomain.
 *
 * Usage:
 *   getCityUrl('warangal') → 'https://warangal.mana.in'
 *   getCityUrl('choutuppal') → 'https://choutuppal.mana.in'
 *   getCityUrl('choutuppal', '/explore') → 'https://choutuppal.mana.in/explore'
 *
 * On localhost, returns relative URL with query param:
 *   getCityUrl('choutuppal') → '/?city=choutuppal'
 */
export function getCityUrl(subdomain: string, path: string = ''): string {
  if (typeof window === 'undefined') {
    // SSR: build production URL
    return `https://${subdomain}.${ROOT_DOMAIN}${path}`
  }

  const hostname = window.location.hostname

  // Development: use query parameter on localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${path || '/'}?city=${subdomain}`
  }

  // Production: build subdomain URL
  return `https://${subdomain}.${ROOT_DOMAIN}${path}`
}

/**
 * Get the current subdomain from the browser's location.
 * Returns null if on root domain or localhost without ?city= param.
 */
export function getCurrentSubdomain(): string | null {
  if (typeof window === 'undefined') return null

  const hostname = window.location.hostname

  // Development: check query param
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const params = new URLSearchParams(window.location.search)
    return params.get('city')
  }

  // Production: extract from hostname
  return extractSubdomain(window.location.host)
}

/**
 * Get the root domain URL for the current environment.
 */
export function getRootDomainUrl(): string {
  if (typeof window === 'undefined') {
    return `https://${ROOT_DOMAIN}`
  }
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return window.location.origin
  }
  return `https://${ROOT_DOMAIN}`
}
