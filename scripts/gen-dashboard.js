const fs = require('fs');
const path = require('path');

const content = `'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Store, Wallet, Settings, 
  Crown, Coins, Eye, Phone, Plus, Pencil,
  Gift, Zap, Star, MessageCircle, ChevronRight,
  Loader2, X, Image as ImageIcon, MapPin, Search,
  Heart, CreditCard, HelpCircle, LogOut, FileText,
  BadgeDollarSign,
  ArrowUpRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { GlassCard } from '@/components/glass-card'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyListings } from '@/components/empty-states'

// ─── Types ────────────────────────────────────────────────────────
interface UserListing {
  id: string
  slug: string
  name: string
  category: string
  description: string | null
  whatsappNumber: string | null
  images: string | null
  cityId: string
  isApproved: boolean
  isPremium: boolean
  isFeatured: boolean
  viewsCount: number
  leadsCount?: number
  createdAt: string
  city?: { id: string; name: string; slug: string }
}

interface BannerAd {
  id: string
  title: string
  imageUrl: string | null
  shopName: string
  offerText: string | null
  linkUrl: string | null
  cityId: string | null
  isActive: boolean
}

interface CoinTransaction {
  id: string
  amount: number
  reason: string
  createdAt: string
}

interface SubscriptionData {
  id: string
  plan: string
  status: string
  startDate: string
  endDate: string | null
  createdAt: string
}

interface City {
  id: string
  name: string
  slug: string
}

const CATEGORIES = [
  'Restaurant', 'Hotel', 'Hospital', 'School', 'Gym', 'Salon',
  'Electronics', 'Clothing', 'Grocery', 'Pharmacy', 'Auto Repair',
  'Real Estate', 'Legal', 'Financial', 'IT Services', 'Education',
  'Healthcare', 'Food & Beverage', 'Retail', 'Other',
]

const TAB_ITEMS = [
  { key: 'home', label: 'Home', icon: LayoutDashboard },
  { key: 'business', label: 'Business', icon: Store },
  { key: 'wallet', label: 'Wallet', icon: Wallet },
  { key: 'settings', label: 'Settings', icon: Settings },
]

export default function DashboardView() {
  const [activeTab, setActiveTab] = useState('home')
  const { user, signOut } = useAuth()
  const currentUser = user ? {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
    coinsBalance: user.coinsBalance,
    subscriptionTier: user.subscriptionTier,
  } : null

  // State
  const [listings, setListings] = useState<UserListing[]>([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [banners, setBanners] = useState<BannerAd[]>([])
  const [loadingBanners, setLoadingBanners] = useState(true)
  const [coinBalance, setCoinBalance] = useState(0)
  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>([])
  const [claimedToday, setClaimedToday] = useState(false)
  const [claimingDaily, setClaimingDaily] = useState(false)
  const [cities, setCities] = useState<City[]>([])

  // File pickers
  const listingFileInputRef = useRef<HTMLInputElement>(null)
  const bannerFileInputRef = useRef<HTMLInputElement>(null)

  // Creation State
  const [isCreatingListing, setIsCreatingListing] = useState(false)
  const [isCreatingBanner, setIsCreatingBanner] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '', category: '', description: '', whatsappNumber: '', imageUrls: [] as string[], cityId: ''
  })
  const [bannerData, setBannerData] = useState({
    title: '', shopName: '', offerText: '', linkUrl: '', imageUrl: '', cityId: ''
  })

  // Data Fetching
  const fetchListings = useCallback(() => {
    if (!currentUser) return
    setLoadingListings(true)
    fetch(\`/api/listings?userId=\${currentUser.id}&limit=50\`)
      .then((res) => res.json())
      .then((data) => setListings(data.listings || []))
      .catch(() => toast.error('Failed to load listings'))
      .finally(() => setLoadingListings(false))
  }, [currentUser])

  const fetchBanners = useCallback(() => {
    if (!currentUser) return
    setLoadingBanners(true)
    fetch(\`/api/banners?userId=\${currentUser.id}&all=true\`)
      .then((res) => res.json())
      .then((data) => setBanners(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load banners'))
      .finally(() => setLoadingBanners(false))
  }, [currentUser])

  const fetchCoins = useCallback(() => {
    if (!currentUser) return
    fetch(\`/api/coins?userId=\${currentUser.id}\`)
      .then((res) => res.json())
      .then((data) => {
        setCoinBalance(data.balance ?? 0)
        setCoinTransactions(data.transactions ?? [])
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const hasClaimedToday = (data.transactions ?? []).some(
          (tx: CoinTransaction) => tx.reason === 'Daily login reward' && new Date(tx.createdAt) >= today
        )
        setClaimedToday(hasClaimedToday)
      })
      .catch(() => {})
  }, [currentUser])

  useEffect(() => {
    if (currentUser) {
      fetchListings()
      fetchBanners()
      fetchCoins()
    }
  }, [currentUser, fetchListings, fetchBanners, fetchCoins])

  useEffect(() => {
    fetch('/api/cities')
      .then((res) => res.json())
      .then((data) => setCities(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // Handlers
  const handleDailyClaim = async () => {
    if (!currentUser) return
    setClaimingDaily(true)
    try {
      const res = await fetch('/api/coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, action: 'dailyClaim' }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(\`Claimed \${data.amount} coins!\`)
        setClaimedToday(true)
        fetchCoins()
      } else {
        toast.error('Already claimed today')
      }
    } catch {
      toast.error('Failed to claim coins')
    } finally {
      setClaimingDaily(false)
    }
  }

  const compressAndUpload = async (file: File, folder: string) => {
    let fileToUpload = file
    if (file.type.startsWith('image/')) {
      const imageCompression = (await import('browser-image-compression')).default
      const options = { maxSizeMB: 1, maxWidthOrHeight: 800, useWebWorker: true, initialQuality: 0.6 }
      fileToUpload = await imageCompression(file, options)
    }
    const uploadData = new FormData()
    uploadData.append('file', fileToUpload)
    uploadData.append('folder', folder)
    const res = await fetch('/api/upload', { method: 'POST', body: uploadData })
    if (!res.ok) throw new Error('Upload failed')
    return await res.json()
  }

  const handleListingFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    toast.info('Compressing image...')
    try {
      const data = await compressAndUpload(files[0], 'choutuppal/listings')
      setFormData({ name: '', category: '', description: '', whatsappNumber: '', imageUrls: [data.url], cityId: '' })
      setIsCreatingListing(true)
    } catch {
      toast.error('Failed to upload image')
    }
    e.target.value = ''
  }

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    toast.info('Compressing image...')
    try {
      const data = await compressAndUpload(files[0], 'choutuppal/banners')
      setBannerData({ title: '', shopName: '', offerText: '', linkUrl: '', imageUrl: data.url, cityId: '' })
      setIsCreatingBanner(true)
    } catch {
      toast.error('Failed to upload image')
    }
    e.target.value = ''
  }

  const submitListing = async () => {
    if (!currentUser || !formData.name || !formData.category) return
    setUploading(true)
    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          cityId: formData.cityId || cities[0]?.id || 'default',
          slug,
          name: formData.name,
          category: formData.category,
          description: formData.description || null,
          whatsappNumber: formData.whatsappNumber || null,
          images: formData.imageUrls.length > 0 ? formData.imageUrls : null,
        }),
      })
      if (res.ok) {
        toast.success('Listing created successfully!')
        setIsCreatingListing(false)
        fetchListings()
      } else {
        toast.error('Failed to create listing')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setUploading(false)
    }
  }

  const submitBanner = async () => {
    if (!currentUser || !bannerData.title) return
    setUploading(true)
    try {
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          cityId: bannerData.cityId || cities[0]?.id || 'default',
          title: bannerData.title,
          shopName: bannerData.shopName,
          offerText: bannerData.offerText || null,
          linkUrl: bannerData.linkUrl || null,
          imageUrl: bannerData.imageUrl || null,
          isActive: true,
        }),
      })
      if (res.ok) {
        toast.success('Banner created successfully!')
        setIsCreatingBanner(false)
        fetchBanners()
      } else {
        toast.error('Failed to create banner')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setUploading(false)
    }
  }

  // --- UI Renders ---
  const renderHome = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Profile Header */}
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4169E1] to-[#D4AF37] p-1 shadow-lg">
          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden relative">
            {currentUser?.avatarUrl ? (
              <Image src={currentUser.avatarUrl} alt="Avatar" fill className="object-cover" />
            ) : (
              <span className="text-xl font-bold text-white">{currentUser?.fullName?.[0] || 'U'}</span>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{currentUser?.fullName || 'User'}</h2>
          <p className="text-gray-400 flex items-center"><Phone className="w-3 h-3 mr-1"/> {currentUser?.phone}</p>
        </div>
      </div>

      {/* Wallet Card */}
      <GlassCard className="bg-gradient-to-br from-[#4169E1]/20 to-[#D4AF37]/20 border border-[#D4AF37]/30 p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/20 rounded-full blur-3xl group-hover:bg-[#D4AF37]/30 transition-all"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <p className="text-gray-300 font-medium mb-1">Total Coins</p>
            <div className="flex items-center space-x-2">
              <Coins className="w-8 h-8 text-[#D4AF37]" />
              <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                {coinBalance}
              </span>
            </div>
          </div>
          <Button 
            onClick={() => setActiveTab('wallet')}
            className="bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold rounded-full shadow-lg shadow-[#D4AF37]/20"
          >
            Earn More
          </Button>
        </div>
      </GlassCard>

      {/* Quick Stats */}
      <h3 className="text-lg font-bold text-white">Quick Stats</h3>
      <div className="grid grid-cols-3 gap-4">
        <GlassCard className="p-4 text-center flex flex-col items-center justify-center space-y-2">
          <Store className="w-6 h-6 text-[#4169E1]" />
          <span className="text-2xl font-bold text-white">{listings.length}</span>
          <span className="text-xs text-gray-400 uppercase tracking-wider">Listings</span>
        </GlassCard>
        <GlassCard className="p-4 text-center flex flex-col items-center justify-center space-y-2">
          <Eye className="w-6 h-6 text-[#10B981]" />
          <span className="text-2xl font-bold text-white">
            {listings.reduce((sum, l) => sum + (l.viewsCount || 0), 0)}
          </span>
          <span className="text-xs text-gray-400 uppercase tracking-wider">Views</span>
        </GlassCard>
        <GlassCard className="p-4 text-center flex flex-col items-center justify-center space-y-2">
          <Heart className="w-6 h-6 text-[#F43F5E]" />
          <span className="text-2xl font-bold text-white">
            {listings.reduce((sum, l) => sum + (l.leadsCount || 0), 0)}
          </span>
          <span className="text-xs text-gray-400 uppercase tracking-wider">Leads</span>
        </GlassCard>
      </div>
    </div>
  )

  const renderBusiness = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Store className="w-5 h-5 mr-2 text-[#D4AF37]" />
            My Listings
          </h3>
          <Button onClick={() => listingFileInputRef.current?.click()} size="sm" className="bg-[#4169E1] hover:bg-[#3151b0] text-white rounded-full">
            <Plus className="w-4 h-4 mr-1"/> Add
          </Button>
        </div>
        
        {loadingListings ? (
          <div className="space-y-4">
            {[1,2].map(i => <Skeleton key={i} className="w-full h-24 rounded-2xl bg-slate-800" />)}
          </div>
        ) : listings.length === 0 ? (
          <GlassCard className="p-8 text-center border-dashed border-gray-700">
            <Store className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">You haven't added any business listings yet.</p>
            <Button onClick={() => listingFileInputRef.current?.click()} className="bg-[#D4AF37] text-black hover:bg-[#B8962E]">Create Listing</Button>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {listings.map(listing => (
              <GlassCard key={listing.id} className="p-4 flex gap-4 items-center relative overflow-hidden group">
                <div className="w-20 h-20 rounded-xl bg-slate-800 relative overflow-hidden shrink-0">
                  {listing.images && JSON.parse(listing.images)[0] ? (
                    <Image src={JSON.parse(listing.images)[0]} alt={listing.name} fill className="object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-600 m-auto mt-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-bold text-white truncate">{listing.name}</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                    <Badge variant="outline" className="text-xs bg-slate-900">{listing.category}</Badge>
                    <span className="flex items-center"><Eye className="w-3 h-3 mr-1"/> {listing.viewsCount}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white shrink-0">
                  <Pencil className="w-4 h-4" />
                </Button>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <ImageIcon className="w-5 h-5 mr-2 text-[#4169E1]" />
            My Banners
          </h3>
          <Button onClick={() => bannerFileInputRef.current?.click()} size="sm" className="bg-[#D4AF37] hover:bg-[#B8962E] text-black rounded-full">
            <Plus className="w-4 h-4 mr-1"/> Add
          </Button>
        </div>
        {loadingBanners ? (
          <div className="space-y-4">
            {[1].map(i => <Skeleton key={i} className="w-full h-32 rounded-2xl bg-slate-800" />)}
          </div>
        ) : banners.length === 0 ? (
          <GlassCard className="p-8 text-center border-dashed border-gray-700">
            <ImageIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">You have no active banners.</p>
            <Button onClick={() => bannerFileInputRef.current?.click()} variant="outline" className="text-white border-gray-600 hover:bg-slate-800">Upload Banner</Button>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {banners.map(banner => (
              <GlassCard key={banner.id} className="p-4 relative overflow-hidden">
                {banner.imageUrl && (
                  <div className="w-full h-32 rounded-xl bg-slate-800 relative overflow-hidden mb-3">
                    <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" />
                  </div>
                )}
                <h4 className="font-bold text-white">{banner.title}</h4>
                {banner.shopName && <p className="text-sm text-gray-400">{banner.shopName}</p>}
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-24 right-4 md:right-8 z-50">
        <Button 
          onClick={() => listingFileInputRef.current?.click()}
          className="w-16 h-16 rounded-full shadow-2xl shadow-[#D4AF37]/50 bg-gradient-to-r from-[#D4AF37] to-[#B8962E] hover:scale-105 transition-transform p-0 flex items-center justify-center"
        >
          <Plus className="w-8 h-8 text-black" />
        </Button>
      </div>
    </div>
  )

  const renderWallet = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Wallet Balance */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-900 border-4 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 mb-4">
          <Coins className="w-12 h-12 text-[#D4AF37]" />
        </div>
        <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 mb-2">
          {coinBalance}
        </h2>
        <p className="text-gray-400 font-medium tracking-wide uppercase">Available Coins</p>
      </div>

      {/* Daily Reward */}
      <GlassCard className="p-6 bg-gradient-to-br from-[#10B981]/10 to-transparent border border-[#10B981]/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-[#10B981]/20 flex items-center justify-center">
              <Gift className="w-6 h-6 text-[#10B981]" />
            </div>
            <div>
              <h4 className="font-bold text-white">Daily Reward</h4>
              <p className="text-sm text-gray-400">Claim your free coins every day!</p>
            </div>
          </div>
          <Button 
            onClick={handleDailyClaim} 
            disabled={claimedToday || claimingDaily}
            className={\`rounded-full \${claimedToday ? 'bg-slate-700 text-gray-400' : 'bg-[#10B981] hover:bg-[#059669] text-white shadow-lg shadow-[#10B981]/20'}\`}
          >
            {claimedToday ? 'Claimed' : claimingDaily ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Claim 10'}
          </Button>
        </div>
      </GlassCard>

      {/* Upgrade Packages */}
      <h3 className="text-lg font-bold text-white pt-4">Boost Listing</h3>
      <div className="space-y-4">
        <GlassCard className="p-5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-[#4169E1]/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#4169E1]" />
            </div>
            <div>
              <h4 className="font-bold text-white">Pro Boost (3 Days)</h4>
              <p className="text-sm text-gray-400">Top of category</p>
            </div>
          </div>
          <Button variant="outline" className="border-[#4169E1] text-[#4169E1] hover:bg-[#4169E1]/10">100 Coins</Button>
        </GlassCard>
        <GlassCard className="p-5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h4 className="font-bold text-white">Premium (7 Days)</h4>
              <p className="text-sm text-gray-400">Homepage Feature</p>
            </div>
          </div>
          <Button className="bg-[#D4AF37] text-black hover:bg-[#B8962E]">250 Coins</Button>
        </GlassCard>
      </div>

      {/* History */}
      <h3 className="text-lg font-bold text-white pt-4">History</h3>
      <div className="space-y-3">
        {coinTransactions.slice(0, 5).map(tx => (
          <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
            <div className="flex items-center space-x-3">
              {tx.amount > 0 ? <ArrowUpRight className="w-4 h-4 text-green-500" /> : <Loader2 className="w-4 h-4 text-red-500" />}
              <span className="text-sm text-white">{tx.reason}</span>
            </div>
            <span className={\`font-bold \${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}\`}>
              {tx.amount > 0 ? '+' : ''}{tx.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
      
      <div className="space-y-2">
        <GlassCard className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer group">
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-lg bg-slate-800 text-gray-300 group-hover:text-white group-hover:bg-slate-700 transition-colors"><Pencil className="w-5 h-5" /></div>
            <span className="font-medium text-white">Edit Profile</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </GlassCard>
        <GlassCard className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer group">
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-lg bg-slate-800 text-gray-300 group-hover:text-white group-hover:bg-slate-700 transition-colors"><Globe className="w-5 h-5" /></div>
            <span className="font-medium text-white">Language</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </GlassCard>
        <GlassCard className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer group">
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-lg bg-slate-800 text-gray-300 group-hover:text-white group-hover:bg-slate-700 transition-colors"><HelpCircle className="w-5 h-5" /></div>
            <span className="font-medium text-white">Help & FAQ</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </GlassCard>
      </div>

      {/* Support Action */}
      <div className="pt-6">
        <a href="https://wa.me/918790083706?text=Hi%20Admin,%20I%20need%20help%20with%20my%20dashboard" target="_blank" rel="noopener noreferrer">
          <Button className="w-full py-8 bg-[#25D366] hover:bg-[#128C7E] text-white text-lg font-bold rounded-2xl shadow-lg shadow-[#25D366]/20 flex items-center justify-center space-x-3">
            <MessageCircle className="w-6 h-6" />
            <span>Chat with Admin on WhatsApp</span>
          </Button>
        </a>
      </div>

      <div className="pt-6">
        <Button variant="outline" className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400 py-6 rounded-2xl flex items-center justify-center space-x-2" onClick={() => signOut()}>
          <LogOut className="w-5 h-5" />
          <span>Log Out</span>
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0F172A] relative selection:bg-[#4169E1] selection:text-white pb-20 md:pb-0">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#4169E1] mix-blend-screen filter blur-[120px] opacity-20 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#D4AF37] mix-blend-screen filter blur-[120px] opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <input type="file" accept="image/*" className="hidden" ref={listingFileInputRef} onChange={handleListingFileChange} />
      <input type="file" accept="image/*" className="hidden" ref={bannerFileInputRef} onChange={handleBannerFileChange} />

      {/* Main Content Area */}
      <div className="relative z-10 max-w-4xl mx-auto p-4 pt-8 md:p-8">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'business' && renderBusiness()}
        {activeTab === 'wallet' && renderWallet()}
        {activeTab === 'settings' && renderSettings()}
      </div>

      {/* Bottom Tabs (Mobile/Tablet) */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 z-50 md:hidden pb-safe">
        <div className="flex justify-around items-center p-2">
          {TAB_ITEMS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={\`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all \${isActive ? 'text-[#D4AF37]' : 'text-gray-500 hover:text-gray-300'}\`}
              >
                <div className={\`relative flex items-center justify-center w-10 h-10 rounded-full transition-all \${isActive ? 'bg-[#D4AF37]/10' : ''}\`}>
                  <Icon className={\`w-6 h-6 transition-transform \${isActive ? 'scale-110' : 'scale-100'}\`} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium mt-0.5">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sidebar (Desktop) */}
      <div className="hidden md:block fixed top-0 left-0 bottom-0 w-64 bg-slate-900/90 backdrop-blur-lg border-r border-slate-800 z-50">
        <div className="p-6">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F5D76E] mb-8">Dashboard</h2>
          <nav className="space-y-2">
            {TAB_ITEMS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={\`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all \${isActive ? 'bg-gradient-to-r from-[#D4AF37]/20 to-transparent text-[#D4AF37] border-l-4 border-[#D4AF37]' : 'text-gray-400 hover:text-white hover:bg-slate-800'}\`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-bold">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Creation Overlays (WhatsApp Style) */}
      <AnimatePresence>
        {(isCreatingListing || isCreatingBanner) && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-safe-top flex items-center justify-between z-20 bg-gradient-to-b from-black/60 to-transparent">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={() => { setIsCreatingListing(false); setIsCreatingBanner(false) }}>
                <X className="w-6 h-6" />
              </Button>
              <span className="text-white font-bold">{isCreatingListing ? 'New Listing' : 'New Banner'}</span>
              <div className="w-10"></div>
            </div>

            {/* Media Preview Area */}
            <div className="flex-1 relative bg-black flex flex-col justify-center items-center">
              {isCreatingListing && formData.imageUrls[0] && (
                <Image src={formData.imageUrls[0]} alt="Preview" fill className="object-cover opacity-80" />
              )}
              {isCreatingBanner && bannerData.imageUrl && (
                <Image src={bannerData.imageUrl} alt="Preview" fill className="object-cover opacity-80" />
              )}
              
              {/* Inputs Overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-20 pb-safe-bottom">
                <div className="px-6 pb-6 space-y-4 max-w-lg mx-auto">
                  {isCreatingListing ? (
                    <>
                      <Input placeholder="Business Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-transparent border-none text-3xl font-bold text-white placeholder:text-gray-400 placeholder:font-bold focus-visible:ring-0 px-0 h-auto" autoFocus />
                      <Select value={formData.category} onValueChange={val => setFormData({...formData, category: val})}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white rounded-xl h-12">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-60">
                          {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input placeholder="WhatsApp Number" type="tel" value={formData.whatsappNumber} onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} className="bg-white/10 border-white/20 text-white rounded-xl h-12 placeholder:text-gray-400" />
                      <Textarea placeholder="Short description..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-white/10 border-white/20 text-white rounded-xl resize-none placeholder:text-gray-400 min-h-[80px]" />
                      <Button onClick={submitListing} disabled={uploading || !formData.name || !formData.category} className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-black shadow-lg shadow-[#D4AF37]/30">
                        {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Post Listing'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input placeholder="Banner Title / Shop Name" value={bannerData.title} onChange={e => setBannerData({...bannerData, title: e.target.value})} className="bg-transparent border-none text-3xl font-bold text-white placeholder:text-gray-400 placeholder:font-bold focus-visible:ring-0 px-0 h-auto" autoFocus />
                      <Input placeholder="Special Offer (e.g., 50% OFF)" value={bannerData.offerText} onChange={e => setBannerData({...bannerData, offerText: e.target.value})} className="bg-white/10 border-white/20 text-white rounded-xl h-12 placeholder:text-gray-400 text-lg font-bold text-[#D4AF37]" />
                      <Input placeholder="Link URL (Optional)" type="url" value={bannerData.linkUrl} onChange={e => setBannerData({...bannerData, linkUrl: e.target.value})} className="bg-white/10 border-white/20 text-white rounded-xl h-12 placeholder:text-gray-400" />
                      <Button onClick={submitBanner} disabled={uploading || !bannerData.title} className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-[#4169E1] to-[#3151b0] text-white shadow-lg shadow-[#4169E1]/30">
                        {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Post Banner'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
`

fs.writeFileSync(path.join('src', 'components', 'dashboard-view.tsx'), content)
console.log('Done writing dashboard-view.tsx')
