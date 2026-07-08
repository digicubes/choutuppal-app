'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Store, Building2, Wallet, Settings, 
  Coins, Eye, Phone, Plus, Edit2, Trash2,
  Loader2, X, Image as ImageIcon, MapPin,
  Heart, CreditCard, LogOut, FileText,
  BadgeDollarSign, Sparkles, UploadCloud,
  Instagram, Facebook, Youtube, MessageCircle,
  ArrowLeft, User, Home, Circle
, LineChart, Download, Film,
  MessageSquare, Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import useSWR from 'swr'
import dynamic from 'next/dynamic'
import StoryCreator from '@/components/story-creator'
import ProfileSettings from '@/components/profile-settings'


const RichTextEditor = dynamic(() => import('@/components/rich-text-editor').then(mod => mod.RichTextEditor), { ssr: false })
const StoryViewer = dynamic(() => import('@/components/story-viewer'), { ssr: false })
const UserAnalytics = dynamic(() => import('@/components/user-analytics'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────
interface UserListing {
  id: string
  slug: string
  name: string
  category: string
  description: string | null
  phoneNumber: string | null
  whatsappNumber: string | null
  secondaryPhone: string | null
  ownerName: string | null
  establishedYear: string | null
  images: string | null
  coverImage: string | null
  logoUrl: string | null
  gallery?: string | null
  services?: string | null
  instagramUrl: string | null
  instagramUsername: string | null
  facebookUrl: string | null
  youtubeUrl: string | null
  address: string | null
  cityId: string
  status: string
  isApproved: boolean
  isPremium: boolean
  isFeatured: boolean
  viewsCount: number
  leadsCount?: number
  createdAt: string
  rating: number
  operatingHours: string | null
  googleMapsUrl: string | null
  city?: { id: string; name: string; slug: string }
  reviews?: any[]
  _count?: any
}

interface RealEstateListing {
  id: string
  title: string
  price: string
  images?: string | null
  ownerPhone: string
  whatsappNumber?: string | null
  bedroomCount?: number | null
  area?: string | null
  address?: string | null
  description?: string | null
  listingType?: string | null
  status: string
  isApproved: boolean
  isFeatured: boolean
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
  status: string
}

interface CoinTransaction {
  id: string
  amount: number
  reason: string
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
  { key: 'my_posts', label: 'My Posts', icon: MessageSquare },
  { key: 'listings', label: 'Listings', icon: Store },
  { key: 'banners', label: 'Banners', icon: ImageIcon },
  { key: 'stories', label: 'Stories', icon: Sparkles },
  { key: 'analytics', label: 'Analytics', icon: LineChart },
  { key: 'settings', label: 'Profile', icon: User },
]

export default function DashboardView() {

  const authFetch = async (url: string, options: any = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = { ...options.headers };
    if (session?.access_token) {
      headers['Authorization'] = 'Bearer ' + session.access_token;
    }
    return fetch(url, { ...options, credentials: 'include', headers });
  };

  const router = useRouter()
  const [activeTab, setActiveTab] = useState('listings')
  const { user, logout } = useAuth()
  const navigateTo = useAppStore((s) => s.navigateTo)

  
  const currentUser = user ? {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
    coinsBalance: user.coinsBalance,
    subscriptionTier: user.subscriptionTier,
  } : null

  // SWR/State
  const [listings, setListings] = useState<UserListing[]>([])
  const [realEstateListings, setRealEstateListings] = useState<RealEstateListing[]>([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [banners, setBanners] = useState<BannerAd[]>([])
  const [loadingBanners, setLoadingBanners] = useState(true)
  const [coinBalance, setCoinBalance] = useState(0)
  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>([])
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [subCategories, setSubCategories] = useState<any[]>([])
  const [villages, setVillages] = useState<any[]>([])

  const [claimedToday, setClaimedToday] = useState(false)
  const [claimingDaily, setClaimingDaily] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Modals & Creation Forms
  const [isCreatingListing, setIsCreatingListing] = useState(false)
  const [isCreatingBanner, setIsCreatingBanner] = useState(false)
  const [isCreatingRealEstate, setIsCreatingRealEstate] = useState(false)
  const [isCreatingStory, setIsCreatingStory] = useState(false)
  const [pendingStoryFile, setPendingStoryFile] = useState<File | null>(null)
  const storyFileInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedStoryForViewer, setSelectedStoryForViewer] = useState<any | null>(null)
  const [selectedStoryStats, setSelectedStoryStats] = useState<any | null>(null)
  const [storyViewerOpen, setStoryViewerOpen] = useState(false)
  const [editingListingId, setEditingListingId] = useState<string | null>(null)
  const [editingRealEstateId, setEditingRealEstateId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  
  // Community Post state
  const [newPostContent, setNewPostContent] = useState('')
  const [posting, setPosting] = useState(false)

  const [reForm, setReForm] = useState({
    title: '',
    listingType: 'Sale',
    price: '',
    area: '',
    bedroomCount: '',
    description: '',
    address: '',
    googleMapsUrl: '',
    phoneNumber: '',
    whatsappNumber: '',
    sameAsPhone: false,
    cityId: '',
    coverImage: '',
    gallery: [] as string[],
    isFeatured: false,
  })

  const resetReForm = () => setReForm({
    title: '', listingType: 'Sale', price: '', area: '', bedroomCount: '',
    description: '', address: '', googleMapsUrl: '', phoneNumber: '', whatsappNumber: '',
    sameAsPhone: false, cityId: '', coverImage: '', gallery: [], isFeatured: false,
  })

  const handleAddStoryClick = () => {
    if (!currentUser) {
      toast.error('Please login to post a story')
      window.location.href = '/login'
      return
    }
    storyFileInputRef.current?.click()
  }

  const [formData, setFormData] = useState({
    name: '', category: '', subCategoryId: '', description: '',
    phoneNumber: '', whatsappNumber: '', secondaryPhone: '', cityId: '', villageId: '', sameAsPhone: false,
    address: '', ownerName: '', establishedYear: '',
    coverImage: '', logoUrl: '', images: [] as string[],
    instagramUrl: '', instagramUsername: '', facebookUrl: '', youtubeUrl: '',
    price: '', bedroomCount: '', area: '', rating: 5, operatingHours: '9:00 AM - 9:00 PM', googleMapsUrl: '',
    services: [] as { name: string; description: string }[],
    isFeatured: false
  })

  const [bannerData, setBannerData] = useState({
    title: '', shopName: '', offerText: '', linkUrl: '', imageUrl: '', cityId: ''
  })

  const fetcher = (url: string) => authFetch(url).then(res => res.json())

  // SWR Hook integrations
  const { data: listingsData, mutate: fetchListings } = useSWR(
    currentUser ? `/api/listings?userId=${currentUser.id}&limit=50` : null,
    fetcher,
    { dedupingInterval: 30000, revalidateOnFocus: false, revalidateOnMount: true, revalidateIfStale: true }
  )

  const { data: realEstateData, mutate: fetchRealEstate } = useSWR(
    currentUser ? `/api/realestate?userId=${currentUser.id}&limit=50` : null,
    fetcher,
    { dedupingInterval: 30000, revalidateOnFocus: false, revalidateOnMount: true, revalidateIfStale: true }
  )

  const { data: bannersData, mutate: fetchBanners } = useSWR(
    currentUser ? `/api/banners?userId=${currentUser.id}&all=true` : null,
    fetcher,
    { dedupingInterval: 30000, revalidateOnFocus: false, revalidateOnMount: true, revalidateIfStale: true }
  )

  const { data: coinsData, mutate: fetchCoins } = useSWR(
    currentUser ? `/api/coins?userId=${currentUser.id}` : null,
    fetcher,
    { dedupingInterval: 30000, revalidateOnFocus: false, revalidateOnMount: true, revalidateIfStale: true }
  )

  const { data: citiesData } = useSWR('/api/cities', fetcher, { dedupingInterval: 60000, revalidateOnFocus: false, revalidateOnMount: true, revalidateIfStale: true })

  const { data: storiesData, mutate: fetchStories } = useSWR(
    currentUser ? `/api/stories?userId=${currentUser.id}` : null,
    fetcher,
    { dedupingInterval: 30000, revalidateOnFocus: false, revalidateOnMount: true, revalidateIfStale: true }
  )

  const userStories = storiesData || []

  const { data: myPostsData, mutate: mutateMyPosts } = useSWR(
    currentUser ? `/api/social/posts?userId=${currentUser.id}&limit=50` : null,
    fetcher,
    { dedupingInterval: 30000, revalidateOnFocus: false, revalidateOnMount: true, revalidateIfStale: true }
  )

  const { data: notificationsSummary, mutate: fetchNotifications } = useSWR(
    currentUser ? `/api/notifications/unread-summary?userId=${currentUser.id}` : null,
    fetcher,
    { dedupingInterval: 15000, revalidateOnFocus: true }
  )

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    if (notificationsSummary && (notificationsSummary as any)[key]) {
      authFetch(`/api/notifications/mark-read?type=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id })
      }).then(() => fetchNotifications())
    }
  }

  const myPosts: any[] = myPostsData?.posts ?? []

  useEffect(() => {
    if (listingsData) {
      setListings(listingsData.listings || [])
      setLoadingListings(false)
    }
  }, [listingsData])

  useEffect(() => {
    const autoClaimListings = async () => {
      if (!currentUser?.id || !currentUser?.phone) return
      try {
        const res = await fetch('/api/auth/auto-claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, phoneNumber: currentUser.phone })
        })
        const data = await res.json()
        if (data.success && (data.listingsTransferred > 0 || data.bannersTransferred > 0)) {
          toast.success('మీ షాప్ లిస్టింగ్ మీ అకౌంట్ కి అటాచ్ అయింది!')
          fetchListings()
          fetchBanners()
        }
      } catch (err) {
        console.error('Auto claim failed:', err)
      }
    }
    // Only run if we actually have a phone number to claim with
    if (currentUser?.phone) {
      autoClaimListings()
    }
  }, [currentUser?.id, currentUser?.phone, fetchListings, fetchBanners])

  useEffect(() => {
    if (realEstateData) {
      // API returns array directly (not {listings:[]})
      setRealEstateListings(Array.isArray(realEstateData) ? realEstateData : (realEstateData.listings || []))
    }
  }, [realEstateData])

  useEffect(() => {
    if (bannersData) {
      setBanners(Array.isArray(bannersData) ? bannersData : [])
      setLoadingBanners(false)
    }
  }, [bannersData])

  useEffect(() => {
    if (coinsData) {
      setCoinBalance(coinsData.balance ?? 0)
      setCoinTransactions(coinsData.transactions ?? [])
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const hasClaimedToday = (coinsData.transactions ?? []).some(
        (tx: CoinTransaction) => tx.reason === 'Daily login reward' && new Date(tx.createdAt) >= today
      )
      setClaimedToday(hasClaimedToday)
    }
  }, [coinsData])

  useEffect(() => {
    if (citiesData) {
      setCities(Array.isArray(citiesData) ? citiesData : [])
    }
  }, [citiesData])

  useEffect(() => {
    if (formData.category) {
      const parent = dynamicCategories.find(c => c.name === formData.category)
      if (parent) {
        fetch(`/api/categories?active=true&parentId=${parent.id}`)
          .then(r => r.json())
          .then(data => setSubCategories(Array.isArray(data) ? data : []))
          .catch(() => {})
      } else {
        setSubCategories([])
      }
    } else {
      setSubCategories([])
    }
  }, [formData.category, dynamicCategories])

  useEffect(() => {
    const cId = formData.cityId || cities[0]?.id || 'default'
    if (cId && cId !== 'default') {
      fetch(`/api/villages?cityId=${cId}`)
        .then(r => r.json())
        .then(data => setVillages(Array.isArray(data) ? data : []))
        .catch(() => {})
    } else {
      setVillages([])
    }
  }, [formData.cityId, cities])

  // Daily reward coins claim
  const handleDailyClaim = async () => {
    if (!currentUser) return
    setClaimingDaily(true)
    try {
      const res = await authFetch('/api/coins', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, action: 'dailyClaim' }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Claimed ${data.amount} coins!`)
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

  // Upload helpers
  const compressAndUpload = async (file: File, folder: string) => {
    let fileToUpload = file
    if (file.type.startsWith('image/')) {
      try {
        const imageCompression = (await import('browser-image-compression')).default
        const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true }
        fileToUpload = await imageCompression(file, options)
      } catch (err) {
        console.error('Image compression error:', err)
      }
    }
    
    const { data, error } = await supabase.storage
      .from('listing-images')
      .upload(`${folder}/${Date.now()}_${fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '')}`, fileToUpload, { cacheControl: '3600', upsert: false });

    if (error) {
      console.error('Upload error:', error);
      toast.error('Image upload failed: ' + error.message);
      throw new Error('Upload failed');
    }
    const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(data.path);
    return { url: urlData.publicUrl };
  }

  const handleListingFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    toast.info('Compressing image...')
    try {
      const data = await compressAndUpload(files[0], 'choutuppal/listings')
      setFormData(prev => ({ ...prev, coverImage: data.url }))
      toast.success('Cover banner uploaded successfully')
    } catch {
      toast.error('Failed to upload cover')
    }
    e.target.value = ''
  }

  const handleExtraUpload = async (file: File) => {
    toast.info('Compressing image...')
    try {
      const data = await compressAndUpload(file, 'choutuppal/listings')
      setFormData(prev => ({ ...prev, logoUrl: data.url }))
      toast.success('Uploaded logo successfully')
    } catch {
      toast.error('Upload failed')
    }
  }

  // Gallery uploads (MUST use correct images state updater)
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    toast.info('Uploading images...');
    try {
      const { default: imageCompression } = await import('browser-image-compression');
      const compressedFiles = await Promise.all(files.map(file => imageCompression(file, { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true })));
      const uploadPromises = compressedFiles.map(async (file) => {
        const fileName = `gallery/${Date.now()}-${file.name}`;
        console.log('Uploading file...', fileName);
        const { data, error } = await supabase.storage.from('listing-images').upload(fileName, file);
        if (error) {
          console.error('Upload error:', error);
          toast.error('Upload failed: ' + error.message);
          return null;
        }
        return supabase.storage.from('listing-images').getPublicUrl(data.path).data.publicUrl;
      });
      const urls = (await Promise.all(uploadPromises)).filter(url => url !== null) as string[];
      
      // Gallery state MUST use:
      setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...urls] }));
      toast.success('Gallery uploaded successfully');
    } catch (error: any) {
      console.error('Gallery upload error:', error);
      toast.error('Upload failed: ' + (error?.message || 'Unknown error'));
    }
    e.target.value = ''
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    toast.info('Compressing image...')
    try {
      const data = await compressAndUpload(files[0], 'choutuppal/banners')
      setBannerData(prev => ({ ...prev, imageUrl: data.url }))
      toast.success('Uploaded banner successfully')
    } catch {
      toast.error('Failed to upload image')
    }
    e.target.value = ''
  }

  // Publish / update listing
  const submitListing = async () => {
    if (!currentUser || !formData.name || !formData.category) return
    setUploading(true)
    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
      let url = editingListingId ? `/api/listings/${editingListingId}` : '/api/listings'
      const method = editingListingId ? 'PUT' : 'POST'
      
      const rawImages = formData.images
      let body: any = {
        userId: currentUser.id,
        cityId: formData.cityId || cities[0]?.id || 'default',
        slug,
        name: formData.name,
        category: formData.category,
        description: formData.description || null,
        phoneNumber: formData.phoneNumber || null,
        whatsappNumber: formData.sameAsPhone ? formData.phoneNumber : (formData.whatsappNumber || null),
        secondaryPhone: formData.secondaryPhone || null,
        address: formData.address || null,
        ownerName: formData.ownerName || null,
        establishedYear: formData.establishedYear || null,
        coverImage: formData.coverImage || null,
        logoUrl: formData.logoUrl || null,
        images: rawImages.length > 0 ? rawImages : null,
        gallery: rawImages.length > 0 ? rawImages : null,
        services: formData.services.length > 0 ? formData.services : null,
        instagramUrl: formData.instagramUrl || null,
        instagramUsername: formData.instagramUsername || null,
        facebookUrl: formData.facebookUrl || null,
        youtubeUrl: formData.youtubeUrl || null,
        rating: formData.rating,
        operatingHours: formData.operatingHours || null,
        googleMapsUrl: formData.googleMapsUrl || null,
        isFeatured: formData.isFeatured,
        villageId: formData.villageId || null,
        subCategoryId: formData.subCategoryId || null,
      }

      if (formData.category === 'Real Estate') {
        url = editingListingId ? `/api/realestate/${editingListingId}` : '/api/realestate'
        const imagesArr = formData.coverImage ? [formData.coverImage, ...rawImages] : rawImages
        body = {
          userId: currentUser.id,
          cityId: formData.cityId || cities[0]?.id || 'default',
          title: formData.name,
          price: formData.price,
          images: imagesArr.length > 0 ? JSON.stringify(imagesArr) : null,
          ownerPhone: formData.phoneNumber,
          bedroomCount: formData.bedroomCount ? parseInt(formData.bedroomCount) : null,
          area: formData.area || null,
        }
      }

      const res = await authFetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success(editingListingId ? 'Listing updated successfully!' : 'Listing created successfully!')
        setIsCreatingListing(false)
        setEditingListingId(null)
        fetchListings()
        fetchRealEstate()
        
        // Reset state
        setFormData({
          name: '', category: '', subCategoryId: '', description: '', phoneNumber: '', whatsappNumber: '', secondaryPhone: '', cityId: '', villageId: '', sameAsPhone: false, address: '', ownerName: '', establishedYear: '',
          coverImage: '', logoUrl: '', images: [], instagramUrl: '', instagramUsername: '', facebookUrl: '', youtubeUrl: '', price: '', bedroomCount: '', area: '', rating: 5, operatingHours: '9:00 AM - 9:00 PM', googleMapsUrl: '',
          services: [], isFeatured: false
        })
      } else {
        const errData = await res.text()
        console.error('Submit API error:', errData)
        toast.error(editingListingId ? 'Failed to update listing' : 'Failed to create listing')
      }
    } catch (err) {
      console.error('Submit error:', err)
      toast.error('Something went wrong')
    } finally {
      setUploading(false)
    }
  }

  const submitBanner = async () => {
    if (!currentUser || !bannerData.title || !bannerData.imageUrl) return
    setUploading(true)
    try {
      const res = await authFetch('/api/banners', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          cityId: bannerData.cityId || cities[0]?.id || 'default',
          title: bannerData.title,
          shopName: bannerData.shopName || '',
          offerText: bannerData.offerText || null,
          linkUrl: bannerData.linkUrl || null,
          imageUrl: bannerData.imageUrl || null,
          isActive: true,
        }),
      })
      if (res.ok) {
        toast.success('Banner created successfully!')
        setIsCreatingBanner(false)
        setBannerData({ title: '', shopName: '', offerText: '', linkUrl: '', imageUrl: '', cityId: '' })
        fetchBanners()
      } else {
        const errData = await res.text()
        console.error('Banner submit API error:', errData)
        toast.error('Failed to create banner')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setUploading(false)
    }
  }

  // DELETE LOGIC: Call endpoint with method DELETE and toast.error on failure
  const deleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return
    try {
      const res = await authFetch(`/api/listings/${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to delete listing')
      }
      toast.success('Listing deleted successfully!')
      setListings(prev => prev.filter(l => l.id !== id))
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete listing')
    }
  }

  const deleteRealEstate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return
    try {
      const res = await authFetch(`/api/realestate?id=${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to delete property')
      }
      toast.success('Property deleted successfully!')
      fetchRealEstate()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete property')
    }
  }

  // ─── Real Estate form upload helpers ──────────────────────────────
  const handleReCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    toast.info('Compressing cover image...')
    try {
      const { default: imageCompression } = await import('browser-image-compression')
      const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true })
      const { data, error } = await supabase.storage.from('listing-images').upload(
        `choutuppal/realestate/${Date.now()}_${compressed.name.replace(/[^a-zA-Z0-9.-]/g, '')}`, compressed, { cacheControl: '3600', upsert: false }
      )
      if (error) throw error
      const url = supabase.storage.from('listing-images').getPublicUrl(data.path).data.publicUrl
      setReForm(p => ({ ...p, coverImage: url }))
      toast.success('Cover photo uploaded!')
    } catch { toast.error('Upload failed') }
    e.target.value = ''
  }

  const handleReGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (reForm.gallery.length + files.length > 5) { toast.error('Max 5 gallery photos allowed'); return }
    toast.info('Uploading gallery...')
    try {
      const { default: imageCompression } = await import('browser-image-compression')
      const urls: string[] = []
      for (const file of files) {
        const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true })
        const { data, error } = await supabase.storage.from('listing-images').upload(
          `choutuppal/realestate/gallery/${Date.now()}_${compressed.name.replace(/[^a-zA-Z0-9.-]/g, '')}`, compressed, { cacheControl: '3600', upsert: false }
        )
        if (!error) urls.push(supabase.storage.from('listing-images').getPublicUrl(data.path).data.publicUrl)
      }
      setReForm(p => ({ ...p, gallery: [...p.gallery, ...urls] }))
      toast.success(`${urls.length} photo(s) uploaded!`)
    } catch { toast.error('Gallery upload failed') }
    e.target.value = ''
  }

  const submitRealEstate = async () => {
    if (!currentUser || !reForm.title || !reForm.price || !reForm.phoneNumber) {
      toast.error('Title, Price and Phone are required')
      return
    }
    setUploading(true)
    try {
      const allImages = reForm.coverImage ? [reForm.coverImage, ...reForm.gallery] : reForm.gallery
      const body = {
        userId: currentUser.id,
        cityId: reForm.cityId || cities[0]?.id || 'default',
        title: reForm.title,
        listingType: reForm.listingType,
        price: reForm.price,
        images: allImages,
        ownerPhone: reForm.phoneNumber,
        whatsappNumber: reForm.sameAsPhone ? reForm.phoneNumber : (reForm.whatsappNumber || null),
        bedroomCount: reForm.bedroomCount ? parseInt(reForm.bedroomCount) : null,
        area: reForm.area || null,
        address: reForm.address || null,
        description: reForm.description || null,
        isFeatured: reForm.isFeatured,
      }
      
      const url = editingRealEstateId ? `/api/realestate/${editingRealEstateId}` : '/api/realestate'
      const method = editingRealEstateId ? 'PUT' : 'POST'
      const res = await authFetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        toast.success(editingRealEstateId ? 'Property updated!' : 'Property submitted for approval!')
        setIsCreatingRealEstate(false)
        setEditingRealEstateId(null)
        resetReForm()
        fetchRealEstate()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to submit property')
      }
    } catch { toast.error('Something went wrong') }
    finally { setUploading(false) }
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return
    try {
      const res = await authFetch(`/api/banners?id=${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to delete banner')
      }
      toast.success('Banner deleted successfully!')
      fetchBanners()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete banner')
    }
  }

  const openEditListing = (listing: UserListing) => {
    setEditingListingId(listing.id)
    setFormData({
      name: listing.name,
      category: listing.category,
      description: listing.description || '',
      phoneNumber: listing.phoneNumber || '',
      whatsappNumber: listing.whatsappNumber || '', 
      secondaryPhone: listing.secondaryPhone || '',
      cityId: listing.cityId,
      villageId: (listing as any).villageId || '',
      subCategoryId: (listing as any).subCategoryId || '',
      sameAsPhone: listing.phoneNumber === listing.whatsappNumber,
      address: listing.address || '',
      ownerName: listing.ownerName || '',
      establishedYear: listing.establishedYear || '',
      coverImage: listing.coverImage || '',
      logoUrl: listing.logoUrl || '',
      images: (() => {
        const raw = listing.images || listing.gallery
        if (!raw) return []
        try {
          return typeof raw === 'string' ? JSON.parse(raw) : raw
        } catch {
          return []
        }
      })(),
      instagramUrl: listing.instagramUrl || '',
      instagramUsername: listing.instagramUsername || '',
      facebookUrl: listing.facebookUrl || '',
      youtubeUrl: listing.youtubeUrl || '',
      price: '',
      bedroomCount: '',
      area: '',
      rating: listing.rating || 5,
      operatingHours: listing.operatingHours || '9:00 AM - 9:00 PM',
      googleMapsUrl: listing.googleMapsUrl || '',
      services: (() => {
        if (!listing.services) return []
        try {
          return typeof listing.services === 'string' ? JSON.parse(listing.services) : listing.services
        } catch {
          return []
        }
      })(),
      isFeatured: listing.isFeatured || false
    })
    setIsCreatingListing(true)
  }

  const openEditRealEstate = (listing: RealEstateListing) => {
    let imagesArr: string[] = []
    try { if (listing.images) imagesArr = JSON.parse(listing.images) } catch {}
    setEditingRealEstateId(listing.id)
    setReForm({
      title: listing.title,
      listingType: listing.listingType || 'Sale',
      price: listing.price,
      area: listing.area || '',
      bedroomCount: listing.bedroomCount ? String(listing.bedroomCount) : '',
      description: listing.description || '',
      address: listing.address || '',
      googleMapsUrl: '',
      phoneNumber: listing.ownerPhone,
      whatsappNumber: listing.whatsappNumber || '',
      sameAsPhone: listing.ownerPhone === listing.whatsappNumber,
      cityId: listing.city?.id || '',
      coverImage: imagesArr[0] || '',
      gallery: imagesArr.slice(1),
      isFeatured: listing.isFeatured || false
    })
    setIsCreatingRealEstate(true)
  }

  // --- Views Renders ---
  const renderHome = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Profile Header */}
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4169E1] to-[#D4AF37] p-1 shadow-md">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden relative">
            {currentUser?.avatarUrl ? (
              <Image src={currentUser.avatarUrl} alt="Avatar" fill className="object-cover" />
            ) : (
              <span className="text-xl font-bold text-gray-800">{currentUser?.fullName?.[0] || 'U'}</span>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{currentUser?.fullName || 'User'}</h2>
          <p className="text-gray-500 flex items-center text-sm font-semibold"><Phone className="w-3.5 h-3.5 mr-1 text-[#4169E1]"/> {currentUser?.phone}</p>
        </div>
      </div>

      {/* Wallet Card */}
      <div className="bg-gradient-to-br from-[#4169E1] to-[#D4AF37] rounded-3xl p-6 relative overflow-hidden shadow-lg border border-white/10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <p className="text-white/80 font-bold mb-1 text-sm">Total Coin Balance</p>
            <div className="flex items-center space-x-2">
              <Coins className="w-8 h-8 text-yellow-300 fill-yellow-300" />
              <span className="text-4xl font-black text-white">
                {coinBalance}
              </span>
            </div>
          </div>
          <Button 
            onClick={() => setActiveTab('wallet')}
            className="bg-white text-[#4169E1] hover:bg-gray-100 font-extrabold rounded-2xl shadow-md h-11 px-6 border-none"
          >
            Earn Coins
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <h3 className="text-lg font-black text-gray-950">Quick Stats</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center flex flex-col items-center justify-center space-y-2 hover:shadow-md transition">
          <Store className="w-6 h-6 text-[#4169E1]" />
          <span className="text-2xl font-black text-gray-950">{listings.length}</span>
          <span className="text-xs text-gray-400 font-bold">Listings</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center flex flex-col items-center justify-center space-y-2 hover:shadow-md transition">
          <Eye className="w-6 h-6 text-[#4169E1]" />
          <span className="text-2xl font-black text-gray-950">{listings.reduce((acc, l) => acc + l.viewsCount, 0)}</span>
          <span className="text-xs text-gray-400 font-bold">Views</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center flex flex-col items-center justify-center space-y-2 hover:shadow-md transition">
          <BadgeDollarSign className="w-6 h-6 text-[#4169E1]" />
          <span className="text-2xl font-black text-gray-950">{listings.reduce((acc, l) => acc + (l.leadsCount || 0), 0)}</span>
          <span className="text-xs text-gray-400 font-bold">Leads</span>
        </div>
      </div>
    </div>
  )

  const renderListings = () => {
    const businessListings = listings.filter(l => l.name?.toLowerCase().includes(searchTerm.toLowerCase())).filter(l => statusFilter === 'All' || l.status === statusFilter)
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
              <Store className="w-5 h-5 mr-2 text-[#4169E1]" /> 
              My Business Listings
            </h3>
            <Button 
              size="sm" 
              onClick={() => {
                setFormData(p => ({ ...p, category: '' }))
                setEditingListingId(null)
                setIsCreatingListing(true)
              }} 
              className="bg-gradient-to-r from-[#4169E1] to-[#D4AF37] text-white font-bold rounded-xl shadow-md hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4 mr-1" /> Add New
            </Button>
          </div>
          <div className="p-4 md:p-6">
            {loadingListings ? (
              <div className="space-y-4">
                {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
              </div>
            ) : businessListings.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-gray-900 font-bold mb-1">No listings yet</h4>
                <p className="text-gray-500 text-sm">Create your first business listing to reach customers.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {businessListings.map((listing) => (
                  <div key={listing.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition">
                    <div className="flex p-4 gap-4">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gray-100 relative overflow-hidden shrink-0 border border-gray-200">
                        <Image src={listing.images ? JSON.parse(listing.images)[0] : (listing.coverImage || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image')} alt={listing.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <h4 className="font-bold text-gray-900 md:text-lg truncate">{listing.name}</h4>
                          <p className="text-xs md:text-sm text-gray-500 truncate">{listing.category} • {listing.city?.name}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          {listing.status === 'PENDING' ? (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 font-semibold border-none text-[10px]">Pending Approval</Badge>
                          ) : (
                            <Badge className={listing.status === 'APPROVED' ? "bg-green-100 text-green-700 hover:bg-green-100 font-semibold border-none text-[10px]" : "bg-red-100 text-red-700 hover:bg-red-100 font-semibold border-none text-[10px]"}>
                              {listing.status === 'APPROVED' ? 'Active' : 'Rejected'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-auto items-center">
                        <button 
                          onClick={() => openEditListing(listing)}
                          className="p-2 text-gray-500 hover:text-[#4169E1] hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => deleteListing(listing.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    {/* Insights & Reviews */}
                    <div className="bg-gray-50/50 border-t border-gray-100 flex flex-col p-4">
                      <div className="flex gap-4 text-xs font-semibold text-gray-500 mb-3">
                        <span className="flex items-center gap-1"><Eye size={14} className="text-blue-400" /> {listing.viewsCount || 0} Views</span>
                        <span className="flex items-center gap-1"><Phone size={14} className="text-green-500" /> {listing._count?.leads ?? 0} Leads</span>
                        <span className="flex items-center gap-1"><MessageSquare size={14} className="text-orange-400" /> {listing._count?.reviews ?? 0} Reviews</span>
                      </div>
                      
                      {listing.reviews && listing.reviews.length > 0 && (
                        <div className="space-y-2 mt-2 border-t border-gray-100 pt-3">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Recent Reviews</h4>
                          {listing.reviews.map((rev: any) => (
                            <div key={rev.id} className="flex gap-2 bg-white p-2.5 rounded-xl border border-gray-200 relative group items-start">
                              <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0 overflow-hidden">
                                {rev.user?.avatarUrl ? (
                                  <img loading="lazy" decoding="async" src={rev.user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                                    {rev.user?.fullName?.[0] || 'U'}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-gray-900 truncate">{rev.user?.fullName || 'User'}</span>
                                  <button
                                    onClick={() => handleDeleteReview(rev.id)}
                                    className="text-red-500 hover:text-red-700 shrink-0 transition-opacity"
                                    title="Delete Review"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <div className="flex items-center gap-0.5 mt-0.5 text-yellow-500">
                                  {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                                </div>
                                {rev.comment && <p className="text-xs text-gray-600 mt-1">{rev.comment}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderRealEstate = () => {
    const filteredRE = realEstateListings?.filter(l => l.title?.toLowerCase().includes(searchTerm.toLowerCase())).filter(l => statusFilter === 'All' || l.status === statusFilter) || [];
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-[#D4AF37]" />
              My Real Estate
            </h3>
            <Button
              size="sm"
              onClick={() => { resetReForm(); setEditingRealEstateId(null); setIsCreatingRealEstate(true) }}
              className="bg-gradient-to-r from-[#4169E1] to-[#D4AF37] text-white font-bold rounded-xl shadow-md hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4 mr-1" /> Add New
            </Button>
          </div>
          <div className="p-4 md:p-6">
            {!realEstateListings ? (
              <div className="space-y-4">{[1].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
            ) : filteredRE.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-gray-900 font-bold mb-1">No properties listed yet</h4>
                <p className="text-gray-500 text-sm">Sell or rent your property and reach thousands of buyers.</p>
                <Button size="sm" onClick={() => { resetReForm(); setEditingRealEstateId(null); setIsCreatingRealEstate(true) }} className="mt-4 bg-gradient-to-r from-[#4169E1] to-[#D4AF37] text-white font-bold rounded-xl">
                  <Plus className="w-4 h-4 mr-1" /> Post Your First Property
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRE.map((listing) => {
                  let imgsArr: string[] = []
                  try { if (listing.images) imgsArr = JSON.parse(listing.images) } catch {}
                  return (
                    <div key={listing.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition">
                      <div className="flex p-4 gap-4">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gray-100 relative overflow-hidden shrink-0 border border-gray-200">
                          {imgsArr[0] ? (
                            <img src={imgsArr[0]} alt={listing.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Building2 className="w-8 h-8 text-gray-300" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div>
                            <h4 className="font-bold text-gray-900 md:text-lg truncate">{listing.title}</h4>
                            <p className="text-xs text-gray-500 truncate">{listing.listingType || 'Sale'} • {listing.city?.name}</p>
                            <p className="text-sm font-bold text-[#D4AF37] mt-0.5">{listing.price}</p>
                            <div className="flex gap-2 mt-1 text-[10px] text-gray-400 font-semibold">
                              {listing.bedroomCount && <span>{listing.bedroomCount} BHK</span>}
                              {listing.area && <span>• {listing.area}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            {listing.status === 'PENDING' ? (
                              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 font-semibold border-none text-[10px]">Pending Approval</Badge>
                            ) : (
                              <Badge className={listing.status === 'APPROVED' ? 'bg-green-100 text-green-700 hover:bg-green-100 font-semibold border-none text-[10px]' : 'bg-red-100 text-red-700 hover:bg-red-100 font-semibold border-none text-[10px]'}>
                                {listing.status === 'APPROVED' ? 'Active' : 'Rejected'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-auto items-center">
                          <button onClick={() => openEditRealEstate(listing)} className="p-2 text-gray-500 hover:text-[#4169E1] hover:bg-blue-50 rounded-lg transition"><Edit2 className="w-5 h-5" /></button>
                          <button onClick={() => deleteRealEstate(listing.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderBanners = () => {
    const filteredBanners = banners.filter(b => (b.title?.toLowerCase().includes(searchTerm.toLowerCase()) || b.shopName?.toLowerCase().includes(searchTerm.toLowerCase()))).filter(b => statusFilter === 'All' || b.status === statusFilter);
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2 text-purple-600" /> 
              My Banner Ads
            </h3>
            <Button 
              size="sm" 
              onClick={() => {
                setBannerData({ title: '', shopName: '', offerText: '', linkUrl: '', imageUrl: '', cityId: '' })
                setIsCreatingBanner(true)
              }} 
              className="bg-gradient-to-r from-[#4169E1] to-[#D4AF37] text-white font-bold rounded-xl shadow-md hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4 mr-1" /> Add New
            </Button>
          </div>
          <div className="p-4 md:p-6">
            {loadingBanners ? (
              <div className="space-y-4">
                {[1].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
              </div>
            ) : filteredBanners.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-gray-900 font-bold mb-1">No active banners</h4>
                <p className="text-gray-500 text-sm">Promote your business on the home page with a banner ad.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredBanners.map((banner) => {
                  const isExpired = (banner as any).expiresAt ? new Date((banner as any).expiresAt) < new Date() : false;
                  return (
                  <div key={banner.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition">
                    <div className="h-28 relative bg-gray-100">
                      {banner.imageUrl && <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-2 left-3">
                        <h4 className="font-bold text-white text-sm truncate max-w-[200px]">{banner.title}</h4>
                      </div>
                      {isExpired && (
                        <div className="absolute top-2 right-2 bg-red-600/90 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow flex items-center">
                          <Circle size={8} className="mr-1 fill-white" /> EXPIRED
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-white flex justify-between items-center">
                      {banner.status === 'PENDING' ? (
                        <Badge className="bg-yellow-100 text-yellow-800 border-none text-[10px] font-semibold">Pending</Badge>
                      ) : (
                        <Badge className={banner.isActive && banner.status === 'APPROVED' ? "bg-green-100 text-green-700 border-none text-[10px] font-semibold" : "bg-gray-100 text-gray-500 border-none text-[10px] font-semibold"}>
                          {banner.isActive && banner.status === 'APPROVED' ? 'Active' : 'Inactive'}
                        </Badge>
                      )}
                      <button 
                        onClick={() => deleteBanner(banner.id)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderStories = () => {
    const filteredStories = userStories.filter((s: any) => (s.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) || s.offerText?.toLowerCase().includes(searchTerm.toLowerCase()))).filter((s: any) => statusFilter === 'All' || s.status === statusFilter);
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-[#4169E1]" /> 
              My stories (24-hour promos)
            </h3>
            <Button 
              size="sm" 
              onClick={() => handleAddStoryClick()} 
              className="bg-gradient-to-r from-[#4169E1] to-[#D4AF37] text-white font-bold rounded-xl shadow-md hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Story
            </Button>
          </div>
          <div className="p-4 md:p-6">
            {filteredStories.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-gray-900 font-bold mb-1">No stories active</h4>
                <p className="text-gray-500 text-sm">Post a 24-hour visual story to promote your business.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredStories.map((story: any) => {
                  const viewsCount = story.views || story.viewsCount || 0
                  const repliesCount = Array.isArray(story.replies)
                    ? story.replies.length
                    : (() => {
                        try {
                          return JSON.parse(story.replies || '[]').length
                        } catch {
                          return 0
                        }
                      })()

                  return (
                    <div 
                      key={story.id} 
                      onClick={() => {
                        setSelectedStoryForViewer(story)
                        setStoryViewerOpen(true)
                      }}
                      className="relative rounded-2xl overflow-hidden aspect-[9/16] bg-gray-900 group shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      {!story.mediaUrl ? (
                        <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center text-white/40 text-xs p-2 text-center">
                          <span>📷</span>
                          <span>No Media</span>
                        </div>
                      ) : story.mediaType === 'VIDEO' ? (
                        <video src={story.mediaUrl} className="w-full h-full object-cover" muted loop playsInline />
                      ) : (
                        <img 
                          src={story.mediaUrl} 
                          alt={story.text || 'Story'} 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=800'
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30" />
                      
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1.5" onClick={(e) => { e.stopPropagation(); setSelectedStoryStats(story) }}>
                          <span className="text-[9px] text-white bg-black/60 px-2 py-1 rounded-full font-extrabold flex items-center gap-0.5 shadow-sm hover:bg-black/80 cursor-pointer">
                            👁️ {viewsCount}
                          </span>
                          <span className="text-[9px] text-white bg-black/60 px-2 py-1 rounded-full font-extrabold flex items-center gap-0.5 shadow-sm hover:bg-black/80 cursor-pointer">
                            💬 {repliesCount}
                          </span>
                        </div>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (!confirm('Delete this story?')) return
                            try {
                              const res = await authFetch(`/api/stories/${story.id}`, { method: 'DELETE', credentials: 'include' })
                              if (res.ok) {
                                toast.success('Story deleted')
                                fetchStories()
                              } else {
                                toast.error('Failed to delete story')
                              }
                            } catch {
                              toast.error('Failed to delete story')
                            }
                          }}
                          className="p-1.5 bg-white text-red-500 rounded-full hover:bg-red-500 hover:text-white transition shadow-sm"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-xs font-bold text-white line-clamp-2">{story.text || 'Untitled Story'}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── My Posts Tab ──────────────────────────────────────────────────────────
  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return
    if (!confirm('Delete this post permanently?')) return
    // Optimistic remove
    mutateMyPosts(
      (prev: any) => prev
        ? { ...prev, posts: prev.posts.filter((p: any) => p.id !== postId) }
        : prev,
      false
    )
    try {
      const res = await authFetch(`/api/social/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      })
      if (!res.ok) {
        toast.error('Failed to delete post')
        mutateMyPosts() // revalidate to restore
      } else {
        toast.success('Post deleted')
      }
    } catch {
      toast.error('Network error')
      mutateMyPosts()
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !currentUser) return
    setPosting(true)
    try {
      const res = await authFetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: currentUser.id,
          content: newPostContent.trim(),
        }),
      })
      if (res.ok) {
        setNewPostContent('')
        toast.success('Posted successfully')
        mutateMyPosts()
      } else {
        toast.error('Failed to post')
      }
    } catch {
      toast.error('Failed to post')
    }
    setPosting(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment permanently?')) return
    try {
      const res = await authFetch(`/api/social/comments/${commentId}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Failed to delete comment')
      toast.success('Comment deleted')
      mutateMyPosts()
    } catch {
      toast.error('Could not delete comment')
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Delete this review permanently?')) return
    try {
      const res = await authFetch(`/api/reviews/${reviewId}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Failed to delete review')
      toast.success('Review deleted')
      fetchListings()
    } catch {
      toast.error('Could not delete review')
    }
  }

  const renderMyPosts = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-gray-900">కమ్యూనిటీ <span className="text-sm font-normal text-gray-400">(Community)</span></h2>
        <span className="text-xs text-gray-400">{myPosts.length} post{myPosts.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <textarea
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder="Share something with the community..."
          className="w-full resize-none bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4169E1]/30 focus:border-[#4169E1]/50 min-h-[80px]"
          rows={3}
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleCreatePost}
            disabled={!newPostContent.trim() || posting}
            className="px-5 py-2 rounded-xl bg-[#4169E1] text-white text-sm font-semibold shadow-sm hover:bg-[#4169E1]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {!myPostsData && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {myPostsData && myPosts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <FileText size={42} className="mb-3 opacity-30" />
          <p className="text-sm font-semibold">No posts yet</p>
          <p className="text-xs mt-1">Posts you create in the Community Feed will appear here.</p>
        </div>
      )}

      {myPosts.map((post) => {
        const images: string[] = (() => {
          try { return JSON.parse(post.mediaUrls || '[]') } catch { return [] }
        })()
        const createdAt = new Date(post.createdAt)
        const timeAgo = (() => {
          const diff = (Date.now() - createdAt.getTime()) / 1000
          if (diff < 60) return 'just now'
          if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
          if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
          return `${Math.floor(diff / 86400)}d ago`
        })()

        return (
          <div key={post.id} className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Post content preview */}
                  <p className="text-sm text-gray-800 leading-relaxed line-clamp-3">
                    {post.content || post.textContent || '(No text content)'}
                  </p>
                  {/* Meta row */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{timeAgo}</span>
                    <span className="flex items-center gap-1">
                      <Heart size={11} className="text-rose-400" />
                      {post._count?.likes ?? 0} Likes
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={11} />
                      {post._count?.comments ?? 0} Comments
                    </span>
                  </div>
                </div>

                {/* Thumbnail if image exists */}
                {images[0] && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                    <img src={images[0]} alt="post" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
              </div>
            </div>

            {/* Footer actions and comments */}
            <div className="flex flex-col bg-gray-50/50 rounded-b-2xl">
              <div className="flex items-center justify-end px-4 py-2 border-t border-gray-100">
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg px-2.5 py-1.5 transition-all duration-200 active:scale-95"
                >
                  <Trash2 size={13} />
                  Delete Post
                </button>
              </div>

              {post.comments && post.comments.length > 0 && (
                <div className="px-4 pb-4 space-y-3">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Recent Comments</h4>
                  {post.comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-2 bg-white p-2.5 rounded-xl border border-gray-100 relative group">
                      <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0 overflow-hidden">
                        {comment.user?.avatarUrl ? (
                          <img loading="lazy" decoding="async" src={comment.user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                            {comment.user?.fullName?.[0] || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-gray-900 truncate">{comment.user?.fullName || 'User'}</span>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-500 hover:text-red-700 shrink-0 transition-opacity"
                            title="Delete Comment"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderWallet = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100">
        <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-yellow-100">
          <Coins className="w-10 h-10 text-[#D4AF37] fill-[#D4AF37]" />
        </div>
        <p className="text-gray-500 font-bold mb-2">Available Balance</p>
        <h2 className="text-5xl font-black text-gray-900 mb-6">{coinBalance} <span className="text-xl text-gray-400">coins</span></h2>
        
        <Button 
          onClick={handleDailyClaim} 
          disabled={claimedToday || claimingDaily}
          className="w-full h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-[#4169E1] to-[#D4AF37] text-white shadow-md disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500 border-none"
        >
          {claimingDaily ? <Loader2 className="w-6 h-6 animate-spin" /> : claimedToday ? 'Claimed Today' : 'Claim Daily Reward'}
        </Button>
      </div>

      <div className="pt-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center"><Sparkles className="w-5 h-5 mr-2 text-[#4169E1]"/> Coin Packages</h3>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 relative overflow-hidden group hover:border-[#D4AF37] transition shadow-sm hover:shadow-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/10 rounded-full blur-xl group-hover:bg-[#D4AF37]/20 transition-all"></div>
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <Badge className="bg-[#D4AF37]/20 text-[#B8962E] mb-2 hover:bg-[#D4AF37]/30 border-none">Most Popular</Badge>
                <h4 className="text-xl font-bold text-gray-900">Pro Business Plan</h4>
                <p className="text-gray-500 text-sm mt-1">Get featured at the top</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[#D4AF37]">500</span>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Coins / Month</p>
              </div>
            </div>
            <Button className="w-full mt-4 bg-gray-900 hover:bg-black text-white rounded-xl h-11 border-none">Upgrade Now</Button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 pt-4">
      <ProfileSettings />
    </div>
  )

  const renderAnalytics = () => <div />
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 w-full max-w-md mx-auto px-4 md:max-w-none md:mx-0 md:px-0 md:flex pb-20 md:pb-0">
      {/* Desktop Sidebar (Pinned Left) */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:bg-white md:border-r md:border-gray-200 md:shadow-sm md:z-40">
        <div className="p-6 flex flex-col gap-8 h-full">
          <div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#4169E1] to-[#D4AF37]">Choutuppal</h2>
            <p className="text-xs text-gray-400 font-bold tracking-wider uppercase mt-1">Super App Portal</p>
          </div>
          
          <div className="flex flex-col gap-2 flex-1">
            {TAB_ITEMS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              const hasRedDot = notificationsSummary && (notificationsSummary as any)[tab.key] === true
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm relative ${isActive ? 'bg-gradient-to-r from-[#4169E1]/10 to-[#D4AF37]/10 text-[#4169E1]' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#4169E1]' : 'text-gray-400'}`} />
                    {hasRedDot && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  {tab.label}
                </button>
              )
            })}
          </div>

          {user && (
            <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#4169E1] to-[#D4AF37] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {user.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-gray-900 line-clamp-1">{user.fullName}</span>
                <span className="text-xs text-gray-400 font-bold">{user.phone}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen pb-20 md:pb-0">
        {/* Mobile Header */}
        <div className="bg-white px-4 py-3 sticky top-0 z-30 shadow-sm border-b border-gray-100 flex items-center gap-3.5 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-gray-50 hover:bg-gray-100 flex-shrink-0"
            onClick={() => navigateTo('home')}
            aria-label="Back to Home"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Button>
          <div>
            <h1 className="text-lg font-black text-gray-900 tracking-tight">My Dashboard</h1>
            <p className="text-[10px] font-semibold text-gray-400">Manage listings & media</p>
          </div>
        </div>

        {/* Mobile Sub-Navigation Tabs REMOVED per request */}

        <div className="p-4 md:p-8 md:pb-12 max-w-lg md:max-w-4xl mx-auto w-full">
          {activeTab === 'analytics' && <UserAnalytics />}
          {activeTab === 'listings' && !isCreatingListing && renderListings()}
          {activeTab === 'real_estate' && !isCreatingRealEstate && renderRealEstate()}
          {activeTab === 'banners' && !isCreatingBanner && renderBanners()}
          {activeTab === 'stories' && renderStories()}
          {activeTab === 'my_posts' && renderMyPosts()}
          {activeTab === 'settings' && renderSettings()}
        </div>

        {/* Add/Edit Listing Fullscreen Modal */}
        <>
          {isCreatingListing && (
            <motion.div 
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col relative mt-4"
            >
              <div className="flex flex-col w-full h-full relative">
                {/* Header */}
                <div className="p-4 pt-safe-top flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-20 shadow-sm">
                  <Button variant="outline" className="text-gray-600 rounded-xl" onClick={() => { setIsCreatingListing(false); setEditingListingId(null); setFormData({name: '', category: '', subCategoryId: '', description: '', phoneNumber: '', whatsappNumber: '', secondaryPhone: '', cityId: '', villageId: '', sameAsPhone: false, address: '', ownerName: '', establishedYear: '', coverImage: '', logoUrl: '', images: [], instagramUrl: '', instagramUsername: '', facebookUrl: '', youtubeUrl: '', price: '', bedroomCount: '', area: '', rating: 5, operatingHours: '9:00 AM - 9:00 PM', googleMapsUrl: '', services: [], isFeatured: false}) }}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Cancel</Button>
                  <span className="text-gray-950 font-black text-lg">{editingListingId ? 'Edit Listing Details' : 'Publish New Listing'}</span>
                  <div className="w-10"></div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50 p-4 pb-32">
                  <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
                    
                    {/* Photos Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Profile Photo */}
                      <div className="sm:col-span-1 flex flex-col gap-2">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Logo / Photo</span>
                        <label className="flex items-center justify-center gap-2 bg-gray-50 border-2 border-dashed border-gray-300 text-gray-500 rounded-2xl h-32 cursor-pointer hover:bg-gray-100 transition overflow-hidden relative group">
                          {formData.logoUrl ? (
                            <>
                              <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                              <button type="button" onClick={(e) => { e.preventDefault(); setFormData(p => ({...p, logoUrl: ''})) }} className="absolute top-1.5 right-1.5 p-1.5 bg-white/95 rounded-full text-red-500 shadow hover:bg-red-500 hover:text-white transition"><Trash2 className="size-3.5" /></button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <UploadCloud className="w-6 h-6 text-[#4169E1]" />
                              <span className="font-bold text-[10px] text-center px-1 text-gray-500">Upload Logo</span>
                            </div>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleExtraUpload(e.target.files[0])} />
                        </label>
                      </div>

                      {/* Cover Photo */}
                      <div className="sm:col-span-2 flex flex-col gap-2">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Cover banner *</span>
                        <label className="flex items-center justify-center gap-2 bg-gray-50 border-2 border-dashed border-gray-300 text-gray-500 rounded-2xl h-32 cursor-pointer hover:bg-gray-100 transition overflow-hidden relative group">
                          {formData.coverImage ? (
                            <>
                              <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                              <button type="button" onClick={(e) => { e.preventDefault(); setFormData(p => ({...p, coverImage: ''})) }} className="absolute top-1.5 right-1.5 p-1.5 bg-white/95 rounded-full text-red-500 shadow hover:bg-red-500 hover:text-white transition"><Trash2 className="size-3.5" /></button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <UploadCloud className="w-6 h-6 text-[#4169E1]" />
                              <span className="font-bold text-xs text-gray-500">Upload Cover Banner</span>
                            </div>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={handleListingFileChange} />
                        </label>
                      </div>
                    </div>

                    {/* Gallery Images (up to 5) */}
                    <div className="flex flex-col gap-2">
                      <span className="text-gray-800 font-bold text-xs uppercase tracking-wide flex justify-between">
                        <span>Gallery Photos (Max 5)</span>
                        <span className="text-[#4169E1] font-black">{formData.images.length}/5</span>
                      </span>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                        {formData.images.map((img, i) => (
                          <div key={i} className="w-24 h-24 shrink-0 relative rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                            <img src={img} alt="Gallery item" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                            <button type="button" onClick={(e) => { e.preventDefault(); setFormData(p => ({...p, images: p.images.filter((_, idx) => idx !== i)})) }} className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-red-500 shadow hover:bg-red-500 hover:text-white transition"><Trash2 className="size-3.5" /></button>
                          </div>
                        ))}
                        {formData.images.length < 5 && (
                          <label className="w-24 h-24 shrink-0 flex flex-col items-center justify-center gap-1 bg-gray-50 border-2 border-dashed border-gray-300 text-gray-400 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                            <Plus className="w-6 h-6 text-gray-400" />
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleGalleryUpload} />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4 pt-2">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Shop / Business Name *</span>
                        <Input placeholder="Enter shop or business name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-white border-gray-200 text-gray-900 rounded-xl h-11 focus-visible:ring-[#4169E1]" />
                      </div>
                      
                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Category *</span>
                        <select 
                          value={formData.category} 
                          onChange={(e) => setFormData({...formData, category: e.target.value, subCategoryId: ''})}
                          className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl h-11 px-4 focus:ring-2 focus:ring-[#4169E1] focus:outline-none appearance-none"
                        >
                          <option value="" disabled>Select Category</option>
                          {(dynamicCategories.length > 0 ? dynamicCategories.map(c => c.name) : CATEGORIES).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {subCategories.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Sub-Category</span>
                          <select 
                            value={formData.subCategoryId} 
                            onChange={(e) => setFormData({...formData, subCategoryId: e.target.value})}
                            className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl h-11 px-4 focus:ring-2 focus:ring-[#4169E1] focus:outline-none appearance-none"
                          >
                            <option value="">Select Sub-Category (Optional)</option>
                            {subCategories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {formData.category === 'Real Estate' && (
                        <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200/60">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Price (e.g., ₹45 Lakhs) *</span>
                            <Input placeholder="Enter price" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="bg-white border-gray-200 h-11 rounded-xl" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Bedrooms</span>
                              <Input placeholder="e.g. 2, 3" type="number" value={formData.bedroomCount} onChange={e => setFormData({...formData, bedroomCount: e.target.value})} className="bg-white border-gray-200 h-11 rounded-xl" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Area (sqft / yards)</span>
                              <Input placeholder="e.g. 1500 sqft" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="bg-white border-gray-200 h-11 rounded-xl" />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Rating (1-5) *</span>
                          <Input type="number" min="1" max="5" step="0.1" value={formData.rating} onChange={e => setFormData({...formData, rating: parseFloat(e.target.value) || 5})} className="bg-white border-gray-200 h-11 rounded-xl" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Business Hours *</span>
                          <Input placeholder="e.g., 9:00 AM - 9:00 PM" value={formData.operatingHours || ''} onChange={e => setFormData({...formData, operatingHours: e.target.value})} className="bg-white border-gray-200 h-11 rounded-xl" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Google Maps Link</span>
                        <Input placeholder="Paste Google Maps URL" value={formData.googleMapsUrl || ''} onChange={e => setFormData({...formData, googleMapsUrl: e.target.value})} className="bg-white border-gray-200 h-11 rounded-xl" />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Owner Name</span>
                        <Input placeholder="e.g., Ramesh Kumar" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} className="bg-white border-gray-200 h-11 rounded-xl" />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Established Year</span>
                        <Input placeholder="e.g., Estd. 1998" value={formData.establishedYear} onChange={e => setFormData({...formData, establishedYear: e.target.value})} className="bg-white border-gray-200 h-11 rounded-xl" />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Phone Number *</span>
                        <Input placeholder="10-digit number" type="tel" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="bg-white border-gray-200 h-11 rounded-xl" />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Secondary Phone Number</span>
                        <Input placeholder="Optional alternative number" type="tel" value={formData.secondaryPhone} onChange={e => setFormData({...formData, secondaryPhone: e.target.value})} className="bg-white border-gray-200 h-11 rounded-xl" />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide flex items-center justify-between">
                          <span>WhatsApp Number</span>
                          <label className="flex items-center gap-1 text-[10px] text-[#4169E1] font-bold cursor-pointer bg-blue-50 px-2 py-0.5 rounded">
                            <input 
                              type="checkbox" 
                              checked={formData.sameAsPhone}
                              onChange={(e) => setFormData({...formData, sameAsPhone: e.target.checked, whatsappNumber: e.target.checked ? formData.phoneNumber : ''})} 
                              className="w-3.5 h-3.5"
                            />
                            <span>Same as Phone</span>
                          </label>
                        </span>
                        <Input 
                          placeholder="WhatsApp Number" 
                          type="tel" 
                          value={formData.sameAsPhone ? formData.phoneNumber : formData.whatsappNumber} 
                          onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} 
                          disabled={formData.sameAsPhone}
                          className="bg-white border-gray-200 h-11 rounded-xl disabled:bg-gray-100" 
                        />
                      </div>


                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Village / Area</span>
                        <select 
                          value={formData.villageId} 
                          onChange={(e) => setFormData({...formData, villageId: e.target.value})}
                          className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl h-11 px-4 focus:ring-2 focus:ring-[#4169E1] focus:outline-none appearance-none"
                        >
                          <option value="">Select Village/Area (Optional)</option>
                          {villages.map(v => (
                            <option key={v.id} value={v.id}>{v.name} - {v.pincode}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Physical Address</span>
                        <Input placeholder="Full Address description" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="bg-white border-gray-200 h-11 rounded-xl" />
                      </div>

                      {/* Services Array Field (Dynamic UI) */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide flex justify-between items-center">
                          <span>Services catalog (సేవలు)</span>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setFormData(p => ({ ...p, services: [...(p.services || []), { name: '', description: '' }] }))}
                            className="text-[#4169E1] border-[#4169E1]/20 hover:bg-[#4169E1]/5 font-bold h-7 px-2.5 rounded-lg text-xs"
                          >
                            + Add Service
                          </Button>
                        </span>
                        <div className="space-y-3 mt-1">
                          {formData.services?.map((svc, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 relative space-y-2">
                              <button 
                                type="button"
                                onClick={() => setFormData(p => ({ ...p, services: p.services.filter((_, i) => i !== idx) }))}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition"
                              >
                                <Trash2 className="size-4" />
                              </button>
                              <div className="grid grid-cols-1 gap-2 pr-6">
                                <Input 
                                  placeholder="Service Name (e.g. Catering, AC Repair)" 
                                  value={svc.name}
                                  onChange={(e) => {
                                    const newSvcs = [...formData.services]
                                    newSvcs[idx].name = e.target.value
                                    setFormData({ ...formData, services: newSvcs })
                                  }}
                                  className="bg-white border-gray-200 h-9 text-xs rounded-lg"
                                />
                                <Input 
                                  placeholder="Short Description" 
                                  value={svc.description}
                                  onChange={(e) => {
                                    const newSvcs = [...formData.services]
                                    newSvcs[idx].description = e.target.value
                                    setFormData({ ...formData, services: newSvcs })
                                  }}
                                  className="bg-white border-gray-200 h-9 text-xs rounded-lg"
                                />
                              </div>
                            </div>
                          ))}
                          {(!formData.services || formData.services.length === 0) && (
                            <p className="text-xs text-gray-400 italic">No services added yet. Click Add Service to showcase catalog.</p>
                          )}
                        </div>
                      </div>

                      {/* Description Rich Text */}
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">About / Description</span>
                        <RichTextEditor
                          content={formData.description}
                          onChange={val => setFormData({...formData, description: val})}
                          placeholder="Describe the shop catalog, services and achievements..."
                        />
                      </div>

                      {/* Socials */}
                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Social Networks</span>
                        <div className="relative">
                          <Instagram className="absolute left-3.5 top-3 w-5 h-5 text-pink-500" />
                          <Input placeholder="Instagram URL" value={formData.instagramUrl || ''} onChange={e => setFormData({...formData, instagramUrl: e.target.value})} className="bg-white border-gray-200 h-11 pl-11 rounded-xl" />
                        </div>
                        <div className="relative">
                          <Facebook className="absolute left-3.5 top-3 w-5 h-5 text-blue-600" />
                          <Input placeholder="Facebook Page URL" value={formData.facebookUrl || ''} onChange={e => setFormData({...formData, facebookUrl: e.target.value})} className="bg-white border-gray-200 h-11 pl-11 rounded-xl" />
                        </div>
                        <div className="relative">
                          <Youtube className="absolute left-3.5 top-3 w-5 h-5 text-red-650" />
                          <Input placeholder="YouTube Channel URL" value={formData.youtubeUrl || ''} onChange={e => setFormData({...formData, youtubeUrl: e.target.value})} className="bg-white border-gray-200 h-11 pl-11 rounded-xl" />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-safe-bottom z-30">
                  <Button 
                    onClick={submitListing} 
                    disabled={uploading || !formData.name || !formData.category}
                    className="w-full max-w-lg mx-auto h-13 rounded-2xl bg-gradient-to-r from-[#4169E1] to-[#1E3A8A] text-white font-bold text-lg shadow-md transition-transform hover:scale-[1.01] active:scale-95 flex items-center justify-center border-none"
                  >
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : (editingListingId ? 'Update and Save' : 'Publish Listing Now')}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </>

        {/* ─── Dedicated Real Estate Form Modal ─── */}
        <>
          {isCreatingRealEstate && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col relative mt-4"
            >
              <div className="flex flex-col w-full h-full relative">
                {/* Header */}
                <div className="p-4 pt-safe-top flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-20 shadow-sm">
                  <Button variant="outline" className="text-gray-600 rounded-xl" onClick={() => { setIsCreatingRealEstate(false); setEditingRealEstateId(null); resetReForm() }}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Cancel</Button>
                  <span className="text-gray-950 font-black text-lg">{editingRealEstateId ? 'Edit Property' : 'Post New Property'}</span>
                  <div className="w-10" />
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50 p-4 pb-32">
                  <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">

                    {/* Info banner */}
                    <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#B8962E] px-4 py-3 rounded-xl text-xs font-extrabold flex items-center gap-2">
                      <span className="text-base">🏠</span>
                      <span>Approved properties appear in the public Real Estate section.</span>
                    </div>

                    {/* Cover Photo (16:9 area) */}
                    <div className="flex flex-col gap-2">
                      <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Cover Photo (16:9) *</span>
                      <label className="flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-100 transition overflow-hidden relative" style={{ aspectRatio: '16/9' }}>
                        {reForm.coverImage ? (
                          <>
                            <img loading="lazy" decoding="async" src={reForm.coverImage} alt="Cover" className="w-full h-full object-cover" />
                            <button type="button" onClick={(e) => { e.preventDefault(); setReForm(p => ({ ...p, coverImage: '' })) }} className="absolute top-2 right-2 p-1.5 bg-white/95 rounded-full text-red-500 shadow hover:bg-red-500 hover:text-white transition">
                              <Trash2 className="size-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-2 py-8">
                            <UploadCloud className="w-8 h-8 text-[#4169E1]" />
                            <span className="font-bold text-sm text-gray-500">Upload Cover Photo</span>
                            <span className="text-[10px] text-gray-400">Recommended: 1920×1080px</span>
                          </div>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleReCoverUpload} />
                      </label>
                    </div>

                    {/* Gallery Photos */}
                    <div className="flex flex-col gap-2">
                      <span className="text-gray-800 font-bold text-xs uppercase tracking-wide flex justify-between">
                        <span>Gallery Photos (Max 5)</span>
                        <span className="text-[#4169E1] font-black">{reForm.gallery.length}/5</span>
                      </span>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {reForm.gallery.map((img, i) => (
                          <div key={i} className="w-24 h-24 shrink-0 relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            <img src={img} alt="Gallery" className="w-full h-full object-cover" loading="lazy" />
                            <button type="button" onClick={() => setReForm(p => ({ ...p, gallery: p.gallery.filter((_, idx) => idx !== i) }))} className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-red-500 shadow hover:bg-red-500 hover:text-white transition">
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        ))}
                        {reForm.gallery.length < 5 && (
                          <label className="w-24 h-24 shrink-0 flex flex-col items-center justify-center gap-1 bg-gray-50 border-2 border-dashed border-gray-300 text-gray-400 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                            <Plus className="w-6 h-6" />
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleReGalleryUpload} />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Property Title *</span>
                        <Input placeholder="e.g., 3BHK Apartment in Choutuppal" value={reForm.title} onChange={e => setReForm(p => ({ ...p, title: e.target.value }))} className="bg-white border-gray-200 h-11 rounded-xl" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Listing Type *</span>
                          <select value={reForm.listingType} onChange={e => setReForm(p => ({ ...p, listingType: e.target.value }))} className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl h-11 px-4 focus:ring-2 focus:ring-[#4169E1] focus:outline-none appearance-none">
                            <option value="Sale">For Sale</option>
                            <option value="Rent">For Rent</option>
                            <option value="Lease">For Lease</option>
                            <option value="PG">PG / Hostel</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Price *</span>
                          <Input placeholder="₹45 Lakhs / ₹8000/mo" value={reForm.price} onChange={e => setReForm(p => ({ ...p, price: e.target.value }))} className="bg-white border-gray-200 h-11 rounded-xl" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Bedrooms (BHK)</span>
                          <Input placeholder="e.g. 2, 3" type="number" value={reForm.bedroomCount} onChange={e => setReForm(p => ({ ...p, bedroomCount: e.target.value }))} className="bg-white border-gray-200 h-11 rounded-xl" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Plot Size / Area</span>
                          <Input placeholder="e.g. 200 sq.yd, 1500 sqft" value={reForm.area} onChange={e => setReForm(p => ({ ...p, area: e.target.value }))} className="bg-white border-gray-200 h-11 rounded-xl" />
                        </div>
                      </div>

                      {/* City Selector */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">City *</span>
                        <select value={reForm.cityId} onChange={e => setReForm(p => ({ ...p, cityId: e.target.value }))} className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl h-11 px-4 focus:ring-2 focus:ring-[#4169E1] focus:outline-none appearance-none">
                          <option value="">Select City</option>
                          {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>

                      {/* Description */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Description</span>
                        <RichTextEditor
                          content={reForm.description}
                          onChange={val => setReForm(p => ({ ...p, description: val }))}
                          placeholder="Describe the property — amenities, nearby landmarks, loan availability..."
                        />
                      </div>

                      {/* Address */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Address / Location</span>
                        <Input placeholder="Full address or landmark" value={reForm.address} onChange={e => setReForm(p => ({ ...p, address: e.target.value }))} className="bg-white border-gray-200 h-11 rounded-xl" />
                      </div>

                      {/* Phone */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Owner Phone *</span>
                        <Input placeholder="10-digit number" type="tel" value={reForm.phoneNumber} onChange={e => setReForm(p => ({ ...p, phoneNumber: e.target.value }))} className="bg-white border-gray-200 h-11 rounded-xl" />
                      </div>

                      {/* WhatsApp */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-800 font-bold text-xs uppercase tracking-wide flex items-center justify-between">
                          <span>WhatsApp Number</span>
                          <label className="flex items-center gap-1 text-[10px] text-[#4169E1] font-bold cursor-pointer bg-blue-50 px-2 py-0.5 rounded">
                            <input type="checkbox" checked={reForm.sameAsPhone} onChange={e => setReForm(p => ({ ...p, sameAsPhone: e.target.checked, whatsappNumber: e.target.checked ? p.phoneNumber : '' }))} className="w-3.5 h-3.5" />
                            <span>Same as Phone</span>
                          </label>
                        </span>
                        <Input placeholder="WhatsApp number" type="tel" value={reForm.sameAsPhone ? reForm.phoneNumber : reForm.whatsappNumber} onChange={e => setReForm(p => ({ ...p, whatsappNumber: e.target.value }))} disabled={reForm.sameAsPhone} className="bg-white border-gray-200 h-11 rounded-xl disabled:bg-gray-100" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-safe-bottom z-30">
                  <Button
                    onClick={submitRealEstate}
                    disabled={uploading || !reForm.title || !reForm.price || !reForm.phoneNumber}
                    className="w-full max-w-lg mx-auto h-13 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#4169E1] text-white font-bold text-lg shadow-md border-none"
                  >
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : (editingRealEstateId ? 'Update Property' : 'Submit for Approval')}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </>

        {/* Banner Modal */}
        <>
          {isCreatingBanner && (
              <div className="flex flex-col w-full h-full relative">
                <div className="p-4 pt-safe-top flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-20 shadow-sm">
                  <Button variant="outline" className="text-gray-600 rounded-xl" onClick={() => setIsCreatingBanner(false)}><ArrowLeft className="w-4 h-4 mr-2" /> Cancel</Button>
                  <span className="text-gray-950 font-black text-lg">Create Banner Ad</span>
                  <div className="w-10"></div>
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-50 p-4 pb-32">
                  <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
                    {/* Banner Pricing Info Box */}
                    <div className="bg-[#4169E1]/5 border border-[#4169E1]/20 text-[#4169E1] px-4 py-3 rounded-xl text-xs font-extrabold leading-relaxed flex items-center gap-2.5">
                      <span className="text-base">📢</span>
                      <span>బ్యానర్ ఖరీదు: ₹99/- రోజుకు (ప్రస్తుతం ఉచితం - FREE)</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Banner Image *</span>
                      <label className="flex items-center justify-center gap-2 bg-gray-50 border-2 border-dashed border-gray-300 text-gray-500 rounded-2xl h-32 cursor-pointer hover:bg-gray-100 transition overflow-hidden relative">
                        {bannerData.imageUrl ? (
                          <img src={bannerData.imageUrl} alt="Banner" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <UploadCloud className="w-6 h-6 text-purple-500" />
                            <span className="font-bold text-xs text-gray-500">Upload Banner Image</span>
                          </div>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleBannerFileChange} />
                      </label>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Internal title *</span>
                      <Input placeholder="E.g., Special Offer Banner" value={bannerData.title} onChange={e => setBannerData({...bannerData, title: e.target.value})} className="bg-white border-gray-200 h-11 rounded-xl" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-gray-800 font-bold text-xs uppercase tracking-wide">Target Website/Link URL</span>
                      <Input placeholder="https://..." value={bannerData.linkUrl} onChange={e => setBannerData({...bannerData, linkUrl: e.target.value})} className="bg-white border-gray-200 h-11 rounded-xl" />
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-safe-bottom z-30">
                  <Button onClick={submitBanner} disabled={uploading || !bannerData.title || !bannerData.imageUrl} className="w-full max-w-lg mx-auto h-13 text-lg font-extrabold rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md border-none">
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Publish Banner'}
                  </Button>
                </div>
              </div>
            )}
        </>

        {/* Hidden input for Story Upload */}
        <input 
          type="file" 
          accept="image/*" 
          ref={storyFileInputRef} 
          className="hidden" 
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              setPendingStoryFile(file)
              setIsCreatingStory(true)
            }
            e.target.value = ''
          }}
        />

        {/* Story creator triggers */}
        {currentUser && (
          <StoryCreator 
            isOpen={isCreatingStory}
            onClose={() => {
              setIsCreatingStory(false)
              setPendingStoryFile(null)
            }}
            userId={currentUser.id}
            cityId={formData.cityId || cities[0]?.id || 'default'}
            onStoryCreated={() => {
              setIsCreatingStory(false)
              setPendingStoryFile(null)
              fetchStories()
            }}
            preselectedFile={pendingStoryFile}
          />
        )}

        {/* Story viewer for owner mode */}
        {storyViewerOpen && selectedStoryForViewer && (
          <StoryViewer
            stories={[selectedStoryForViewer]}
            initialStoryIndex={0}
            onClose={() => {
              setStoryViewerOpen(false)
              setSelectedStoryForViewer(null)
              fetchStories()
            }}
          />
        )}

        <AnimatePresence>
          {selectedStoryStats && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden shadow-2xl relative"
              >
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-900">Story Insights</h3>
                  <button onClick={() => setSelectedStoryStats(null)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full">
                    <X size={18} />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-6">
                  {/* Viewers */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Viewers</h4>
                    {(() => {
                      const viewers = typeof selectedStoryStats.viewers === 'string' ? JSON.parse(selectedStoryStats.viewers || '[]') : selectedStoryStats.viewers || []
                      return viewers.length > 0 ? (
                        <div className="space-y-3">
                          {viewers.map((viewer: any, i: number) => (
                            <div key={viewer.userId || i} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center text-gray-500 text-xs font-bold">
                                  {viewer.avatarUrl ? <img loading="lazy" decoding="async" src={viewer.avatarUrl} className="w-full h-full object-cover"/> : (viewer.fullName?.charAt(0).toUpperCase() || 'U')}
                                </div>
                                <span className="text-sm font-semibold text-gray-800">{viewer.fullName || 'User'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-sm text-gray-500 italic">No viewers yet</p>
                    })()}
                  </div>
                  {/* Replies */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Replies</h4>
                    {(() => {
                      const replies = typeof selectedStoryStats.replies === 'string' ? JSON.parse(selectedStoryStats.replies || '[]') : selectedStoryStats.replies || []
                      return replies.length > 0 ? (
                        <div className="space-y-3">
                          {replies.map((reply: any, i: number) => (
                            <div key={reply.userId || i} className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center text-gray-500 text-xs font-bold">
                                {reply.avatarUrl ? <img loading="lazy" decoding="async" src={reply.avatarUrl} className="w-full h-full object-cover"/> : (reply.fullName?.charAt(0).toUpperCase() || 'U')}
                              </div>
                              <div>
                                <span className="text-sm font-semibold text-gray-900 block">{reply.fullName || 'User'}</span>
                                <p className="text-xs text-gray-600 mt-1">{reply.text || reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-sm text-gray-500 italic">No replies yet</p>
                    })()}
                  </div>
                  {/* Likes Count */}
                  <div>
                     <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Likes</h4>
                     <div className="flex items-center gap-2">
                       <Heart size={16} className="text-red-500 fill-red-500" />
                       <span className="text-sm font-semibold text-gray-800">{selectedStoryStats.likes || 0} Likes</span>
                     </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* DEDICATED DASHBOARD MOBILE MENU */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex justify-between items-center px-2 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => handleTabChange('my_posts')}
          className={`flex flex-col items-center justify-center min-w-[48px] px-1 active:scale-90 transition-transform relative ${activeTab === 'my_posts' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <div className="relative">
            <MessageSquare size={20} />
            {notificationsSummary?.my_posts && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white translate-x-1 -translate-y-1" />}
          </div>
          <span className="text-[10px] mt-0.5 font-semibold">My Posts</span>
        </button>

        <button
          onClick={() => handleTabChange('listings')}
          className={`flex flex-col items-center justify-center min-w-[48px] px-1 active:scale-90 transition-transform relative ${activeTab === 'listings' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <div className="relative">
            <Store size={20} />
            {notificationsSummary?.listings && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white translate-x-1 -translate-y-1" />}
          </div>
          <span className="text-[10px] mt-0.5 font-semibold">Listings</span>
        </button>

        <button
          onClick={() => handleTabChange('banners')}
          className={`flex flex-col items-center justify-center min-w-[48px] px-1 active:scale-90 transition-transform ${activeTab === 'banners' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <ImageIcon size={20} />
          <span className="text-[10px] mt-0.5 font-semibold">Banners</span>
        </button>

        <button
          onClick={() => handleTabChange('stories')}
          className={`flex flex-col items-center justify-center min-w-[48px] px-1 active:scale-90 transition-transform relative ${activeTab === 'stories' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <div className="relative">
            <Sparkles size={20} />
            {notificationsSummary?.stories && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white translate-x-1 -translate-y-1" />}
          </div>
          <span className="text-[10px] mt-0.5 font-semibold">Stories</span>
        </button>

        <button
          onClick={() => handleTabChange('analytics')}
          className={`flex flex-col items-center justify-center min-w-[48px] px-1 active:scale-90 transition-transform ${activeTab === 'analytics' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <LineChart size={20} />
          <span className="text-[10px] mt-0.5 font-semibold">Analytics</span>
        </button>

        <button
          onClick={() => handleTabChange('settings')}
          className={`flex flex-col items-center justify-center min-w-[48px] px-1 active:scale-90 transition-transform ${activeTab === 'settings' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <User size={20} />
          <span className="text-[10px] mt-0.5 font-semibold">Profile</span>
        </button>
      </div>
    </div>
  )
}
