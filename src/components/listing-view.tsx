'use client'

import Link from 'next/link'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, MapPin, Star, Share2,
  Phone, Eye, MessageCircle, Instagram, Facebook, Youtube, Download,
  Wrench, Sparkles, BadgeCheck
, ShoppingBag, Minus, Plus } from 'lucide-react'
import ListingCard from '@/components/listing-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { OptimizedImage } from '@/components/optimized-image'
import { ListingDetailSkeleton } from '@/components/skeleton-loaders'
import DOMPurify from 'dompurify'
import { useParams, useRouter } from 'next/navigation'

interface ListingData {
  catalogItems?: string;
  id: string
  slug: string
  name: string
  category: string
  description: string | null
  services?: string | null
  coverImage: string | null
  logoUrl: string | null
  gallery: string[] | string | null
  images?: string[] | string | null
  instagramUrl: string | null
  instagramUsername: string | null
  facebookUrl: string | null
  youtubeUrl: string | null
  phoneNumber: string | null
  whatsappNumber: string | null
  secondaryPhone: string | null
  ownerName: string | null
  establishedYear: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  isPremium: boolean
  isFeatured: boolean
  isClaimed: boolean
  viewsCount: number
  rating: number
  operatingHours: string | null
  cityId: string
  user: {
    id: string
    fullName: string
    phone: string
    whatsappNumber: string | null
    avatarUrl?: string | null
  }
}

const PLACEHOLDER_COVER = 'https://placehold.co/800x400/D4AF37/ffffff?text=No+Cover'
const PLACEHOLDER_LOGO = 'https://placehold.co/200x200/D4AF37/ffffff?text=Logo'

export default function ListingView() {
  const [cart, setCart] = useState<Record<string, number>>({})
  const selectedListingSlug = useAppStore((s) => s.selectedListingSlug)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  
  // Resolve listing ID or slug from params or app store
  const currentIdOrSlug = (params?.id as string) || selectedListingSlug

  const [listing, setListing] = useState<ListingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleBack = () => {
    navigateTo('explore')
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  // Claim state
  const [showClaimDialog, setShowClaimDialog] = useState(false)
  const [claimPhone, setClaimPhone] = useState('')
  const [claimSubmitting, setClaimSubmitting] = useState(false)

  // Related listings
  const [relatedListings, setRelatedListings] = useState<any[]>([])

  const fetchListing = useCallback(async () => {
    if (!currentIdOrSlug) return
    setLoading(true)
    try {
      const res = await fetch(`/api/listings/${currentIdOrSlug}`)
      if (res.ok) {
        const data = await res.json()
        setListing(data)
        
        // Increment views
        fetch(`/api/listings/${currentIdOrSlug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'incrementViews' }),
        }).catch(() => {})
      } else {
        toast.error('Listing not found')
      }
    } catch {
      toast.error('Failed to load listing')
    } finally {
      setLoading(false)
    }
  }, [currentIdOrSlug])

  useEffect(() => {
    fetchListing()
  }, [fetchListing])

  // Fetch related listings once base listing is loaded
  useEffect(() => {
    async function fetchRelated() {
      if (!listing?.category || !listing?.cityId) return
      try {
        const res = await fetch(`/api/listings?cityId=${listing.cityId}&category=${encodeURIComponent(listing.category)}&limit=4`)
        if (res.ok) {
          const data = await res.json()
          const list = Array.isArray(data?.listings) ? data.listings : []
          setRelatedListings(list.filter((l: any) => l.id !== listing?.id).slice(0, 3))
        }
      } catch (e) {
        console.error("Failed to fetch related listings:", e)
      }
    }
    fetchRelated()
  }, [listing])

  const handleClaimSubmit = async () => {
    if (!claimPhone) {
      toast.error('Please enter your phone number.')
      return
    }
    if (!user) {
      toast.error('Please login to claim a business.')
      return
    }
    setClaimSubmitting(true)
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing?.id, phoneNumber: claimPhone, userId: user.id }),
      })
      if (res.ok) {
        toast.success('Claim request submitted! Admin will verify soon.')
        setShowClaimDialog(false)
        setClaimPhone('')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to submit claim.')
      }
    } catch {
      toast.error('Network error.')
    } finally {
      setClaimSubmitting(false)
    }
  }

  
  const catalogItems = listing?.catalogItems ? JSON.parse(listing?.catalogItems) : []
  // fallback items if none found
  const displayItems = catalogItems.length > 0 ? catalogItems : [
    { id: '1', name: 'Sample Item 1', price: 99 },
    { id: '2', name: 'Sample Item 2', price: 149 }
  ]

  const totalCartItems = Object.values(cart).reduce((a: any, b: any) => a + b, 0)
  const totalCartPrice = displayItems.reduce((acc, item) => {
    return acc + (item.price * (cart[item.id] || 0))
  }, 0)

  const handleWhatsAppOrder = () => {
    let orderText = `Hello ${listing?.name}! I would like to order:\n\n`
    displayItems.forEach(item => {
      if (cart[item.id]) {
        orderText += `- ${item.name} x${cart[item.id]} (₹${item.price * cart[item.id]})\n`
      }
    })
    orderText += `\n*Total: ₹${totalCartPrice}*\n\nPlease confirm my order.`
    
    // Also track click
    fetch(`/api/listings/${listing?.id}/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'whatsapp' })
    }).catch(console.error)

    window.open(`https://wa.me/${listing?.whatsappNumber}?text=${encodeURIComponent(orderText)}`, '_blank')
  }

  const renderCatalog = () => (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-[#4169E1]" /> Products / Menu
      </h3>
      <div className="grid gap-4">
        {displayItems.map((item: any) => (
          <div key={item.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-900">{item.name}</h4>
              <p className="text-[#D4AF37] font-bold">₹{item.price}</p>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1">
              <button 
                onClick={() => setCart(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-600 hover:text-red-500"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold w-4 text-center">{cart[item.id] || 0}</span>
              <button 
                onClick={() => setCart(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-600 hover:text-green-500"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const handleShare = async () => {
    const shareUrl = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.name || 'Local Business',
          text: 'Check this out on Choutuppal App!',
          url: shareUrl,
        })
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard!')
    }
  }

  const generateVCard = () => {
    if (!listing) return
    const phone = listing.phoneNumber || listing?.whatsappNumber || listing.user.phone
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${listing?.name}
TEL:${phone}
URL:${window.location.origin}/listing/${listing?.slug || listing?.id}
END:VCARD`
    const blob = new Blob([vcard], { type: 'text/vcard' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${listing?.name.replace(/\s+/g, '_')}.vcf`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Contact vCard downloaded')
  }

  if (loading) return <ListingDetailSkeleton />
  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 p-4">
        <p className="text-gray-500 text-lg font-semibold">Listing not found</p>
        <Button onClick={handleBack} className="bg-gradient-to-r from-[#4169E1] to-[#D4AF37] text-white font-bold rounded-xl shadow-md">
          <ArrowLeft className="size-4 mr-2" /> Back to Explore
        </Button>
      </div>
    )
  }

  const cleanDescription = listing.description ? (typeof window !== 'undefined' ? DOMPurify.sanitize(listing.description) : listing.description) : ''
  
  // Parse gallery images
  const galleryImages = (() => {
    const raw = listing.gallery || listing.images
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
      } catch (e) {
        console.error("Failed to parse gallery:", e)
        return []
      }
    }
    return []
  })()

  const phoneToCall = listing.phoneNumber || listing?.whatsappNumber || listing.user.phone
  const phoneToWA = listing?.whatsappNumber || listing.phoneNumber || listing.user.whatsappNumber || listing.user.phone

  const handleCall = () => {
    if (phoneToCall) window.location.href = `tel:${phoneToCall}`
  }
  const handleWhatsapp = () => {
    if (phoneToWA) window.open(`https://wa.me/${phoneToWA}`)
  }
  const handleLocation = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${listing.latitude ? listing.latitude + ',' + listing.longitude : encodeURIComponent(listing.address || listing?.name)}`)
  }

  // Parse services JSON
  const servicesList: { name: string; description: string }[] = (() => {
    if (!listing.services) return []
    try {
      const parsed = JSON.parse(listing.services)
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => {
          if (typeof item === 'string') {
            return { name: item, description: '' }
          }
          return {
            name: item.name || '',
            description: item.description || ''
          }
        })
      }
    } catch (e) {
      console.error("Failed to parse services:", e)
    }
    return []
  })()

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-0 text-gray-900 flex flex-col">
      {/* ── Top Header: Cover Photo & Overlapping Logo ── */}
      <div className="relative h-64 sm:h-80 w-full bg-gray-200">
        <OptimizedImage
          src={listing.coverImage || PLACEHOLDER_COVER}
          alt={`${listing?.name} cover`}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/50" />
        
        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Button variant="ghost" size="icon" onClick={handleBack} className="bg-white/20 backdrop-blur-md text-white hover:bg-white/40 rounded-full size-10 shadow-sm border border-white/20">
            <ArrowLeft className="size-5" />
          </Button>
        </div>

        {/* Business Logo Overlapping */}
        <div className="absolute -bottom-12 left-4 md:left-8 z-20">
          <div className="size-24 md:size-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden relative">
            <OptimizedImage
              src={listing.logoUrl || PLACEHOLDER_LOGO}
              alt={`${listing?.name} logo`}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-16 relative z-10 w-full flex-grow pb-16">
        {/* Desktop 2-column grid layout (md+) */}
        <div className="grid grid-cols-1 md:grid-cols-[70%_30%] gap-8">
          
          {/* Main Info Column */}
          <div className="space-y-6">
            
            {/* Top Card: Title, Verified Badge, Rating, Views, Address, Open/Closed status */}
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 p-5 md:p-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                    {listing?.name}
                  </h1>
                  {listing.isPremium && (
                    <Badge className="bg-[#4169E1] text-white border-none flex items-center gap-0.5 text-xs py-0.5">
                      <BadgeCheck className="size-3.5" /> Verified
                    </Badge>
                  )}
                  {listing.isClaimed === false && (
                    <Badge 
                      onClick={() => setShowClaimDialog(true)}
                      className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer animate-pulse text-[11px] font-bold"
                    >
                      🎯 Claim Business
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-1.5 flex-wrap text-sm text-gray-500 font-semibold">
                  {listing.user && (
                    <div 
                      role="button" 
                      tabIndex={0}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        router.push(`/profile/${listing.user.id}`)
                      }}
                      className="flex items-center gap-1.5 hover:bg-gray-100 pr-2 py-0.5 rounded-full transition-colors border border-transparent hover:border-gray-200 cursor-pointer w-max"
                    >
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0 border border-blue-200">
                        {listing.user.avatarUrl ? <img src={listing.user.avatarUrl} className="w-full h-full object-cover" alt="" /> : <span className="text-[10px] font-bold text-blue-600">{listing.user.fullName?.[0] || 'U'}</span>}
                      </div>
                      <span className="text-xs font-bold text-gray-700">{listing.user.fullName}</span>
                    </div>
                  )}
                  <Badge variant="secondary" className="bg-[#4169E1]/10 text-[#4169E1] border-none font-bold">
                    {listing.category}
                  </Badge>
                  <div className="flex items-center gap-1 bg-yellow-50 px-2.5 py-0.5 rounded border border-yellow-100 text-yellow-700">
                    <Star className="size-3.5 fill-yellow-500 text-yellow-500" />
                    <span>{listing.rating || 5.0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="size-4 text-gray-400" />
                    <span>{listing.viewsCount} views</span>
                  </div>
                  <div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${listing.operatingHours ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {listing.operatingHours ? 'Open Now' : 'Closed'}
                    </span>
                  </div>
                </div>
              </div>

              {listing.address && (
                <div className="flex items-start gap-2 text-gray-600 mt-4 pt-4 border-t border-gray-100">
                  <MapPin className="size-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{listing.address}</span>
                </div>
              )}

              {(listing.ownerName || listing.establishedYear || listing.secondaryPhone) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                  {listing.ownerName && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Owner Name</span>
                      <span className="text-sm font-semibold text-gray-800">{listing.ownerName}</span>
                    </div>
                  )}
                  {listing.establishedYear && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Established</span>
                      <span className="text-sm font-semibold text-gray-800">{listing.establishedYear}</span>
                    </div>
                  )}
                  {listing.secondaryPhone && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Secondary Phone</span>
                      <span className="text-sm font-semibold text-gray-800">{listing.secondaryPhone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Social Links Bar */}
            {(listing.instagramUrl || listing.facebookUrl || listing.youtubeUrl) && (
              <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100">
                <span className="text-sm font-bold text-gray-500 mr-2">Socials:</span>
                {listing.instagramUrl && (
                  <a href={listing.instagramUrl} target="_blank" rel="noreferrer" className="size-10 bg-gray-50 rounded-full flex items-center justify-center text-pink-600 shadow-sm hover:scale-105 transition-transform border border-gray-100">
                    <Instagram className="size-5" />
                  </a>
                )}
                {listing.facebookUrl && (
                  <a href={listing.facebookUrl} target="_blank" rel="noreferrer" className="size-10 bg-gray-50 rounded-full flex items-center justify-center text-blue-600 shadow-sm hover:scale-105 transition-transform border border-gray-100">
                    <Facebook className="size-5" />
                  </a>
                )}
                {listing.youtubeUrl && (
                  <a href={listing.youtubeUrl} target="_blank" rel="noreferrer" className="size-10 bg-gray-50 rounded-full flex items-center justify-center text-red-600 shadow-sm hover:scale-105 transition-transform border border-gray-100">
                    <Youtube className="size-5" />
                  </a>
                )}
              </div>
            )}

            {/* Middle 1: About Us (Tiptap HTML) */}
            {cleanDescription && (
              <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 p-5 md:p-6">
                <h2 className="text-lg font-bold text-gray-950 mb-4 flex items-center gap-2 border-b pb-3">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-[#4169E1] to-[#D4AF37] rounded-full"></div>
                  About Us
                </h2>
                <div 
                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: cleanDescription }}
                />
              </div>
            )}

            {/* Middle 2: Photo Gallery (Horizontal Swipeable) */}
            {galleryImages.length > 0 && (
              <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 p-5 md:p-6 overflow-hidden">
                <h2 className="text-lg font-bold text-gray-950 mb-4 flex items-center gap-2 border-b pb-3">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-[#4169E1] to-[#D4AF37] rounded-full"></div>
                  Photo Gallery
                </h2>
                <div className="flex overflow-x-auto snap-x mandatory gap-3 pb-2 scrollbar-none scroll-smooth">
                  {galleryImages.map((img: string, idx: number) => (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedImage(img)} 
                      className="relative w-72 h-48 shrink-0 snap-center rounded-lg overflow-hidden border border-gray-100 cursor-pointer group shadow-sm bg-gray-100"
                    >
                      <OptimizedImage
                        src={img}
                        alt={`${listing?.name} gallery ${idx + 1}`}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Middle 3: Services Section (WhatsApp Business Style) */}
            {servicesList.length > 0 && (
              <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 p-5 md:p-6">
                <h2 className="text-lg font-bold text-gray-950 mb-4 flex items-center gap-2 border-b pb-3">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-[#4169E1] to-[#D4AF37] rounded-full"></div>
                  Services & Catalog
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {servicesList.map((service, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100/60 shadow-sm flex items-start gap-3">
                      <div className="p-2 bg-[#4169E1]/10 rounded-xl text-[#4169E1] shrink-0">
                        {idx % 2 === 0 ? <Wrench className="size-4.5" /> : <Sparkles className="size-4.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-gray-900 text-sm leading-tight">{service.name}</h4>
                        {service.description && (
                          <p className="text-xs text-gray-500 mt-1 leading-snug">{service.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom: Related Listings */}
            {relatedListings.length > 0 && (
              <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 p-5 md:p-6">
                <h2 className="text-lg font-bold text-gray-950 mb-4 flex items-center gap-2 border-b pb-3">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-[#4169E1] to-[#D4AF37] rounded-full"></div>
                  Related Businesses
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedListings.map((rel) => (
                    <ListingCard key={rel.id} listing={rel} />
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Desktop Right Sticky Sidebar */}
          <div className="hidden md:block">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 sticky top-24">
              <h3 className="font-bold text-lg text-gray-900 border-b pb-2">Actions</h3>
              <div className="flex flex-col gap-3">
                {phoneToCall && (
                  <Button onClick={handleCall} className="w-full bg-[#4169E1] hover:bg-[#3151b0] text-white font-bold h-12 rounded-xl">
                    <Phone className="size-4.5 mr-2" /> Call Now
                  </Button>
                )}
                {phoneToWA && (
                  <Button onClick={handleWhatsapp} className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-bold h-12 rounded-xl">
                    <MessageCircle className="size-4.5 mr-2" /> WhatsApp
                  </Button>
                )}
                <Button variant="outline" onClick={handleLocation} className="w-full h-12 rounded-xl font-bold border-gray-200">
                  <MapPin className="size-4.5 mr-2 text-red-500" /> Google Map Location
                </Button>
                <Button variant="outline" onClick={generateVCard} className="w-full h-12 rounded-xl font-bold border-gray-200">
                  <Download className="size-4.5 mr-2 text-[#D4AF37]" /> Save Contact
                </Button>
                <Button variant="outline" onClick={handleShare} className="w-full h-12 rounded-xl font-bold border-gray-200">
                  <Share2 className="size-4.5 mr-2 text-[#4169E1]" /> Share listing
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── MOBILE STICKY FOOTER ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white shadow-[0_-4px_15px_rgba(0,0,0,0.15)] p-3 flex items-center justify-around">
        <button onClick={handleCall} className="flex flex-col items-center justify-center text-gray-600 font-bold text-[10px] w-12">
          <Phone size={18} className="text-[#4169E1] mb-1" />
          <span>Call</span>
        </button>
        <button onClick={handleWhatsapp} className="flex flex-col items-center justify-center text-gray-600 font-bold text-[10px] w-12">
          <MessageCircle size={18} className="text-[#25D366] mb-1" />
          <span>WhatsApp</span>
        </button>
        <button 
          onClick={handleShare} 
          className="bg-gradient-to-br from-[#4169E1] to-[#D4AF37] text-white p-4 rounded-full shadow-[0_4px_14px_rgba(65,105,225,0.45)] active:scale-90 transition-transform -mt-7 z-50 flex items-center justify-center size-14 border-2 border-white"
        >
          <Share2 size={22} className="text-white" />
        </button>
        <button onClick={generateVCard} className="flex flex-col items-center justify-center text-gray-600 font-bold text-[10px] w-12">
          <Download size={18} className="text-[#D4AF37] mb-1" />
          <span>Save</span>
        </button>
        <button onClick={handleLocation} className="flex flex-col items-center justify-center text-gray-600 font-bold text-[10px] w-12">
          <MapPin size={18} className="text-red-500" />
          <span>Location</span>
        </button>
      </div>

      {/* Fullscreen Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 text-white hover:text-gray-300 p-2.5 bg-white/10 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <div className="relative w-full max-w-5xl aspect-square md:aspect-video" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Gallery view fullscreen" className="w-full h-full object-contain" loading="lazy" decoding="async" />
          </div>
        </div>
      )}
      
      {/* Claim Business Modal */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-gray-900">Claim Business Page</DialogTitle>
            <DialogDescription className="text-gray-500 mt-2">
              Are you the owner of <b>{listing?.name}</b>? Please provide your mobile number. We will contact you to verify ownership.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="claim-phone" className="text-sm font-bold text-gray-700">Phone Number</Label>
              <Input 
                id="claim-phone"
                placeholder="Enter 10-digit number" 
                value={claimPhone}
                onChange={(e) => setClaimPhone(e.target.value)}
                className="bg-gray-50 border-gray-200 h-11 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="flex sm:justify-between gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowClaimDialog(false)} className="rounded-xl h-11 flex-1 sm:flex-initial">Cancel</Button>
            <Button 
              className="bg-gradient-to-r from-[#4169E1] to-[#D4AF37] text-white rounded-xl h-11 flex-1 sm:flex-initial" 
              onClick={handleClaimSubmit}
              disabled={claimSubmitting}
            >
              {claimSubmitting ? 'Submitting...' : 'Claim Business'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
