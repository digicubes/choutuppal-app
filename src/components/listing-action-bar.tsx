'use client'

import { useState, useEffect } from 'react'
import { Phone, MapPin } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ListingData {
  id: string
  name: string
  category: string
  whatsappNumber: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  user: {
    phone: string
    whatsappNumber: string | null
  }
}

// ─── Category detection ───────────────────────────────────────────────────────
const REAL_ESTATE_KEYWORDS = [
  'real estate',
  'property',
  'properties',
  'real-estate',
  'land',
  'plot',
  'villa',
  'apartment',
  'flat',
  'house',
  'construction',
  'builder',
]

function isRealEstateCategory(category: string): boolean {
  const lower = category.toLowerCase()
  return REAL_ESTATE_KEYWORDS.some((kw) => lower.includes(kw))
}

// ─── WhatsApp message builder ─────────────────────────────────────────────────
function buildWhatsAppUrl(number: string, listingName: string): string {
  const clean = number.replace(/[^0-9]/g, '')
  // Ensure number has country code — prepend 91 if it's a 10-digit Indian number
  const withCC = clean.length === 10 ? `91${clean}` : clean
  const message = encodeURIComponent(
    `Hi, I saw your listing '${listingName}' on the Choutuppal App. Is this still available?`
  )
  return `https://wa.me/${withCC}?text=${message}`
}

// ─── Google Maps URL builder ──────────────────────────────────────────────────
function buildMapsUrl(lat: number | null, lng: number | null, address: string | null): string | null {
  if (lat !== null && lng !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  }
  return null
}

/**
 * ListingActionBar — Sticky bottom action bar for listing detail pages.
 *
 * Shows 3 buttons: Call, WhatsApp, Location
 * - WhatsApp message is customized based on listing category
 * - Location button opens Google Maps or shows toast if no location
 * - ZERO Framer Motion — uses Tailwind CSS transitions only
 * - Fixed at bottom, safe area aware
 *
 * This component fetches its own listing data from the API using
 * the selectedListingSlug from the store, so it works independently
 * of the main ListingView component.
 */
export function ListingActionBar() {
  const selectedListingSlug = useAppStore((s) => s.selectedListingSlug)
  const [listing, setListing] = useState<ListingData | null>(null)

  // Fetch listing data for phone/whatsapp/location
  useEffect(() => {
    if (!selectedListingSlug) return
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/listings/${selectedListingSlug}`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setListing(data)
        }
      } catch {
        // Silently fail — buttons will be disabled
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedListingSlug])

  // ─── Derived values ────────────────────────────────────────────────────
  const phone = listing?.user?.phone || ''
  const whatsappNumber = listing?.whatsappNumber || listing?.user?.whatsappNumber || ''
  const title = listing?.name || ''
  const category = listing?.category || ''
  const mapsUrl = buildMapsUrl(
    listing?.latitude ?? null,
    listing?.longitude ?? null,
    listing?.address ?? null
  )
  const hasLocation = mapsUrl !== null

  // ─── Handlers ──────────────────────────────────────────────────────────
  const handleCall = () => {
    if (!phone) {
      toast.error('Phone number not available')
      return
    }
    window.open(`tel:${phone}`, '_self')
  }

  const handleWhatsApp = () => {
    const number = whatsappNumber || phone
    if (!number) {
      toast.error('WhatsApp number not available')
      return
    }
    const url = buildWhatsAppUrl(number, title)
    window.open(url, '_blank')
  }

  const handleLocation = () => {
    if (!hasLocation) {
      toast.error('Location not provided by the lister')
      return
    }
    window.open(mapsUrl, '_blank')
  }

  const hasWhatsApp = !!(whatsappNumber || phone)

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-100 shadow-2xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* WhatsApp primary CTA — always shown first */}
      {hasWhatsApp && (
        <div className="px-4 pt-3">
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20c25e] active:bg-[#1dae55] text-white font-bold text-base transition-all duration-200 active:scale-[0.98] shadow-lg shadow-green-200"
          >
            {/* WhatsApp SVG icon */}
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white flex-shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Chat on WhatsApp
          </button>
        </div>
      )}

      {/* Secondary row: Call + Location */}
      <div className="flex items-stretch gap-2 px-4 py-3">
        {/* Call Button */}
        <button
          onClick={handleCall}
          disabled={!phone}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm min-h-[48px] transition-all duration-200 active:scale-95 shadow-sm ${
            phone
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Phone className="w-5 h-5" />
          <span>Call</span>
        </button>

        {/* Location Button */}
        <button
          onClick={handleLocation}
          disabled={!hasLocation}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm min-h-[48px] transition-all duration-200 active:scale-95 shadow-sm ${
            hasLocation
              ? 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span>Location</span>
        </button>
      </div>
    </div>
  )
}
