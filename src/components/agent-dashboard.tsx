'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Store, Eye, Phone, Plus, Pencil, Trash2, Edit2, Wallet, Clock, LayoutDashboard,
  X, Image as ImageIcon, MapPin, Loader2, FileText, UploadCloud, Download,
  Wrench, Sparkles, Search, Instagram, Facebook, Youtube
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Image from 'next/image'
import useSWR from 'swr'
import dynamic from 'next/dynamic'
import Papa from 'papaparse'
import { AgentNewsForm } from '@/components/agent-news-form'
import { AgentBlogForm } from '@/components/agent-blog-form'

const RichTextEditor = dynamic(() => import('@/components/rich-text-editor').then(mod => mod.RichTextEditor), { ssr: false })

interface UserListing {
  id: string
  slug: string
  name: string
  category: string
  description: string | null
  phoneNumber: string | null
  whatsappNumber: string | null
  secondaryPhone: string | null
  address: string | null
  ownerName: string | null
  establishedYear: string | null
  coverImage: string | null
  logoUrl: string | null
  images: string | null
  gallery: string | null
  services: string | null
  viewsCount: number
  status: string
  createdAt: string
  cityId: string
  rating: number
  operatingHours: string | null
  googleMapsUrl: string | null
  instagramUsername: string | null
  facebookUrl: string | null
  youtubeUrl: string | null
  city?: { id: string; name: string }
}

const CATEGORIES = [
  'Restaurant', 'Hotel', 'Hospital', 'School', 'Gym', 'Salon',
  'Electronics', 'Clothing', 'Grocery', 'Pharmacy', 'Auto Repair',
  'Real Estate', 'Legal', 'Financial', 'IT Services', 'Education',
  'Healthcare', 'Food & Beverage', 'Retail', 'Other',
]

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AgentDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'add_listing' | 'bulk_upload' | 'portfolio' | 'earnings' | 'add_news' | 'add_blog'>('overview')

  // --- SWR Hooks ───
  const { data: listingsData, mutate: mutateListings, isLoading } = useSWR(
    user?.id ? `/api/listings?userId=${user.id}&limit=100` : null,
    fetcher
  )

  const { data: newsData } = useSWR('/api/admin/news', fetcher)
    const { data: blogsData } = useSWR('/api/blogs?all=true', fetcher)
    const myNews = Array.isArray(newsData) ? newsData.filter(n => n.authorId === user?.id) : []
    const myBlogs = Array.isArray(blogsData) ? blogsData.filter(b => b.authorId === user?.id) : []
    
    const { data: citiesData } = useSWR('/api/cities', fetcher)
  const cities = citiesData?.cities || []
  const choutuppalCityId = cities.find((c: any) => c.slug === 'choutuppal')?.id || ''

  const [dynamicCategories, setDynamicCategories] = useState<any[]>([])
  const [subCategories, setSubCategories] = useState<any[]>([])
  const [villages, setVillages] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/admin/categories?active=true')
      .then(r => r.json())
      .then(data => setDynamicCategories(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])



  // --- Single Listing Form State ───
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingListingId, setEditingListingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '', category: '', subCategoryId: '', description: '',
    phoneNumber: '', whatsappNumber: '', secondaryPhone: '', cityId: '', villageId: '', sameAsPhone: false,
    address: '', ownerName: '', establishedYear: '', coverImage: '', logoUrl: '', images: [] as string[],
    rating: 5, operatingHours: '9:00 AM - 9:00 PM', googleMapsUrl: '',
    price: '', bedroomCount: '', area: '',
    instagramUsername: '', facebookUrl: '', youtubeUrl: '',
    services: [] as { name: string; description: string }[]
  })

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
    const cId = formData.cityId || choutuppalCityId || cities[0]?.id || 'default'
    if (cId && cId !== 'default') {
      fetch(`/api/villages?cityId=${cId}`)
        .then(r => r.json())
        .then(data => setVillages(Array.isArray(data) ? data : []))
        .catch(() => {})
    } else {
      setVillages([])
    }
  }, [formData.cityId, cities, choutuppalCityId])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Bulk Upload State ───
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [isUploadingBulk, setIsUploadingBulk] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // --- Functions: Single Listing ───
  const handleSingleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'coverImage' | 'logoUrl') => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    try {
      toast.loading('Uploading image...', { id: 'upload' })
      const { default: imageCompression } = await import('browser-image-compression')
      const compressedFile = await imageCompression(file, { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true })
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
      const { error } = await supabase.storage.from('listing-images').upload(`covers/${fileName}`, compressedFile)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(`covers/${fileName}`)
      
      setFormData(prev => ({ ...prev, [field]: publicUrl }))
      toast.success('Image uploaded successfully!', { id: 'upload' })
    } catch (error) {
      console.error("Upload error:", error)
      toast.error('Failed to upload image', { id: 'upload' })
    }
    e.target.value = ''
  }

  // Gallery Uploads (MUST use images property name and correct updater)
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    toast.loading('Uploading gallery...', { id: 'upload' })
    try {
      const { default: imageCompression } = await import('browser-image-compression');
      const compressedFiles = await Promise.all(files.map(file => imageCompression(file, { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true })));
      const uploadPromises = compressedFiles.map(async (file) => {
        const fileName = `gallery/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage.from('listing-images').upload(fileName, file);
        if (error) {
          console.error('Upload error:', error);
          return null;
        }
        return supabase.storage.from('listing-images').getPublicUrl(data.path).data.publicUrl;
      });
      const urls = (await Promise.all(uploadPromises)).filter(url => url !== null) as string[];
      
      // Gallery state MUST use:
      setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...urls] }));
      toast.success('Gallery uploaded successfully!', { id: 'upload' });
    } catch (error: any) {
      console.error('Gallery upload error:', error);
      toast.error('Upload failed: ' + (error?.message || 'Unknown error'), { id: 'upload' });
    }
    e.target.value = ''
  };

  const submitListing = async () => {
    const finalCityId = formData.cityId || choutuppalCityId || cities[0]?.id
    if (!formData.name || !formData.category || !finalCityId) {
      toast.error('Please fill required fields (Name, Category, City)')
      return
    }
    
    setIsSubmitting(true)
    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7)
      
      let url = editingListingId ? `/api/listings/${editingListingId}` : '/api/listings'
      const method = editingListingId ? 'PUT' : 'POST'

      let body: any = {
        userId: user?.id,
        cityId: finalCityId,
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
        images: formData.images.length > 0 ? formData.images : null,
        gallery: formData.images.length > 0 ? formData.images : null,
        services: formData.services.length > 0 ? formData.services : null,
        rating: formData.rating,
        operatingHours: formData.operatingHours || null,
        googleMapsUrl: formData.googleMapsUrl || null,
        instagramUsername: formData.instagramUsername || null,
        facebookUrl: formData.facebookUrl || null,
        youtubeUrl: formData.youtubeUrl || null,
        isApproved: true,
        status: 'APPROVED',
        villageId: formData.villageId || null,
        subCategoryId: formData.subCategoryId || null,
      }

      if (formData.category === 'Real Estate') {
        url = editingListingId ? `/api/realestate/${editingListingId}` : '/api/realestate'
        const imagesArr = formData.coverImage ? [formData.coverImage, ...formData.images] : formData.images
        body = {
          userId: user?.id,
          cityId: finalCityId,
          title: formData.name,
          price: formData.price,
          images: imagesArr.length > 0 ? JSON.stringify(imagesArr) : null,
          ownerPhone: formData.phoneNumber,
          bedroomCount: formData.bedroomCount ? parseInt(formData.bedroomCount) : null,
          area: formData.area || null,
        }
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        toast.success(editingListingId ? 'Listing updated successfully!' : 'Listing created successfully!')
        mutateListings()
        setEditingListingId(null)
        setFormData({
          name: '', category: '', subCategoryId: '', description: '',
          phoneNumber: '', whatsappNumber: '', secondaryPhone: '', cityId: choutuppalCityId, villageId: '', sameAsPhone: false,
          address: '', ownerName: '', establishedYear: '', coverImage: '', logoUrl: '', images: [] as string[],
          rating: 5, operatingHours: '9:00 AM - 9:00 PM', googleMapsUrl: '',
          price: '', bedroomCount: '', area: '',
          instagramUsername: '', facebookUrl: '', youtubeUrl: '',
          services: []
        })
        setActiveTab('portfolio')
      } else {
        toast.error('Failed to save listing')
      }
    } catch (e) {
      toast.error('Error saving listing')
    } finally {
      setIsSubmitting(false)
    }
  }

  // DELETE LOGIC: Call method DELETE and toast.error on failure
  const deleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return
    try {
      const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to delete listing')
      }
      toast.success('Listing deleted successfully!')
      mutateListings()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete listing')
    }
  }

  const openEdit = (l: any) => {
    setEditingListingId(l.id)
    setFormData({
      name: l.name, category: l.category, description: l.description || '',
      phoneNumber: l.phoneNumber || '', whatsappNumber: l.whatsappNumber || '', secondaryPhone: l.secondaryPhone || '', cityId: l.cityId,
      villageId: (l as any).villageId || '', subCategoryId: (l as any).subCategoryId || '',
      sameAsPhone: l.phoneNumber === l.whatsappNumber,
      address: l.address || '', ownerName: l.ownerName || '', establishedYear: l.establishedYear || '', coverImage: l.coverImage || '', logoUrl: l.logoUrl || '',
      images: (() => {
        const raw = l.images || l.gallery
        if (!raw) return []
        try {
          return typeof raw === 'string' ? JSON.parse(raw) : raw
        } catch {
          return []
        }
      })(),
      rating: l.rating || 5, operatingHours: l.operatingHours || '9:00 AM - 9:00 PM', googleMapsUrl: l.googleMapsUrl || '',
      price: '', bedroomCount: '', area: '',
      instagramUsername: l.instagramUsername || '', facebookUrl: l.facebookUrl || '', youtubeUrl: l.youtubeUrl || '',
      services: (() => {
        if (!l.services) return []
        try {
          return typeof l.services === 'string' ? JSON.parse(l.services) : l.services
        } catch {
          return []
        }
      })()
    })
    setActiveTab('add_listing')
  }

  // --- Bulk Upload Functions ───
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFile(file)
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsedData(results.data)
      },
      error: (error: any) => {
        toast.error('Error parsing CSV: ' + error.message)
      }
    })
    e.target.value = ''
  }

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,name,category,phoneNumber,whatsappNumber,address,description,price,area,bedroomCount\nSample Business,Restaurant,9876543210,,Main Road Choutuppal,A great place to eat,,,,"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "listing_bulk_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const submitBulkUpload = async () => {
    if (parsedData.length === 0) {
      toast.error('No data to upload')
      return
    }
    
    setIsUploadingBulk(true)
    try {
      const res = await fetch('/api/listings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          cityId: choutuppalCityId || cities[0]?.id,
          listings: parsedData
        })
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(`Successfully added ${data.count} listings!`)
        setParsedData([])
        setCsvFile(null)
        mutateListings()
        setActiveTab('portfolio')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Bulk upload failed')
      }
    } catch (error) {
      toast.error('An error occurred during bulk upload')
    } finally {
      setIsUploadingBulk(false)
    }
  }

  // Nav buttons UI

  const NAV_ITEMS = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'add_listing', icon: Plus, label: editingListingId ? 'Edit Listing' : 'Add Listing' },
      { id: 'add_news', icon: FileText, label: 'Add News' },
      { id: 'add_blog', icon: Edit2, label: 'Add Blog' },
    { id: 'bulk_upload', icon: UploadCloud, label: 'Bulk Upload' },
    { id: 'portfolio', icon: Store, label: 'My Portfolio' },
    { id: 'earnings', icon: Wallet, label: 'Earnings' },
  ]

  const totalListings = listingsData?.listings?.length || 0;
  // Estimated earnings
  const estListingEarnings = totalListings * 200; // 200 INR per listing
  const estBannerEarnings = 0; // banners currently not tracked for agents in this mock
  const totalEarnings = estListingEarnings + estBannerEarnings;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-20 md:pb-0">
      
      {/* Mobile Swipeable Menu */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-10 w-full overflow-x-auto snap-x hide-scrollbar">
        <div className="flex p-2 gap-2 w-max">
          {NAV_ITEMS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); if (tab.id !== 'add_listing') setEditingListingId(null); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all snap-start ${isActive ? 'bg-[#4169E1] text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}
              >
                <Icon className="size-4 w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Desktop Sidebar (Left 20%) */}
      <div className="hidden md:flex flex-col w-[20%] bg-white border-r border-gray-200 h-screen sticky top-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#4169E1]/10 text-[#4169E1] rounded-xl">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Agent CRM</h1>
              <p className="text-sm font-semibold text-[#4169E1]">Partner Portal</p>
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); if (tab.id !== 'add_listing') setEditingListingId(null); }}
                className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold transition-all ${isActive ? 'bg-[#4169E1] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Icon className="size-5 w-5 h-5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content (Right 80%) */}
      <div className="flex-1 max-w-full md:max-w-[80%] overflow-hidden h-screen overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 md:p-8">
          <AnimatePresence mode="wait">
            
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900">Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <Store className="w-8 h-8 text-[#4169E1] mb-4" />
                    <h3 className="text-3xl font-black">{totalListings}</h3>
                    <p className="text-gray-500 font-semibold text-sm">Total Listings Added</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <ImageIcon className="w-8 h-8 text-[#D4AF37] mb-4" />
                    <h3 className="text-3xl font-black">0</h3>
                    <p className="text-gray-500 font-semibold text-sm">Banners Sold</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <Eye className="w-8 h-8 text-green-500 mb-4" />
                    <h3 className="text-3xl font-black">0</h3>
                    <p className="text-gray-500 font-semibold text-sm">Generated Traffic</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'earnings' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900">Earnings & Commission</h2>
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet className="w-32 h-32" /></div>
                  <p className="text-gray-400 font-bold uppercase tracking-wider text-sm mb-2">Total Estimated Earnings</p>
                  <h3 className="text-5xl font-black text-[#D4AF37] mb-6">?{totalEarnings.toLocaleString()}</h3>
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                      <p className="text-gray-300 text-xs font-bold uppercase">Listings (20%)</p>
                      <p className="text-xl font-bold mt-1">?{estListingEarnings.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                      <p className="text-gray-300 text-xs font-bold uppercase">Banners (15%)</p>
                      <p className="text-xl font-bold mt-1">?{estBannerEarnings.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                   <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                   <h3 className="text-xl font-bold text-gray-900">Next Payout: 1st of Next Month</h3>
                   <p className="text-gray-500 mt-2">All commissions are automatically calculated and processed at the start of the next month.</p>
                </div>
              </motion.div>
            )}

{activeTab === 'add_listing' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
                  <div className="w-1 h-6 bg-[#D4AF37] rounded-full"></div>
                  {editingListingId ? 'Edit Listing Details' : 'Add New Listing'}
                </h2>
                 
                <div className="space-y-6">
                  {/* Photo Uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Logo */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Profile Photo / Logo</label>
                      <div className="h-48 border-2 border-dashed border-[#4169E1]/30 bg-blue-50/50 rounded-xl flex flex-col items-center justify-center text-gray-500 overflow-hidden relative">
                        {formData.logoUrl && (
                          <div className="absolute inset-0 z-0">
                            <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                            <button type="button" onClick={(e) => { e.preventDefault(); setFormData(p => ({...p, logoUrl: ''})) }} className="absolute top-2 right-2 p-2 bg-white/80 rounded-full text-red-500 hover:bg-red-500 hover:text-white shadow z-10"><Trash2 className="size-4" /></button>
                          </div>
                        )}
                        <label className={`w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/80 transition-colors z-10 ${formData.logoUrl ? 'opacity-0 hover:opacity-100 bg-black/40 text-white' : ''}`}>
                          <UploadCloud className="size-8 mb-2 text-[#4169E1]" />
                          <span className="text-xs font-bold text-gray-600">Upload Logo</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSingleUpload(e, 'logoUrl')} />
                        </label>
                      </div>
                    </div>

                    {/* Cover Photo */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Cover Banner Image</label>
                      <div className="h-48 border-2 border-dashed border-[#4169E1]/30 bg-blue-50/50 rounded-xl flex flex-col items-center justify-center text-gray-500 overflow-hidden relative">
                        {formData.coverImage && (
                          <div className="absolute inset-0 z-0">
                            <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                            <button type="button" onClick={(e) => { e.preventDefault(); setFormData(p => ({...p, coverImage: ''})) }} className="absolute top-2 right-2 p-2 bg-white/80 rounded-full text-red-500 hover:bg-red-500 hover:text-white shadow z-10"><Trash2 className="size-4" /></button>
                          </div>
                        )}
                        <label className={`w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/80 transition-colors z-10 ${formData.coverImage ? 'opacity-0 hover:opacity-100 bg-black/40 text-white' : ''}`}>
                          <UploadCloud className="size-8 mb-2 text-[#4169E1]" />
                          <span className="text-xs font-bold text-gray-600">Upload Cover Banner</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSingleUpload(e, 'coverImage')} />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Gallery */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Gallery Photos (Max 5)</label>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {formData.images.map((url, i) => (
                        <div key={i} className="w-24 h-24 relative border rounded-xl overflow-hidden shadow-sm shrink-0 group">
                          <img src={url} alt="Gallery preview" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                          <button type="button" onClick={(e) => { e.preventDefault(); setFormData(p => ({...p, images: p.images.filter((_, idx) => idx !== i)})) }} className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-red-500 hover:bg-red-500 hover:text-white shadow"><Trash2 className="size-3.5" /></button>
                        </div>
                      ))}
                      {formData.images.length < 5 && (
                        <label className="w-24 h-24 border-2 border-dashed border-[#4169E1]/30 bg-blue-50/50 rounded-xl flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-blue-50 shrink-0">
                          <Plus className="size-6 mb-1 text-[#4169E1]/60" />
                          <input type="file" multiple className="hidden" accept="image/*" onChange={handleGalleryUpload} />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Shop / Business Name *</label>
                      <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Sri Sai Electronics" className="h-11 bg-gray-50 border-gray-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
                      <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val, subCategoryId: ''})}>
                        <SelectTrigger className="h-11 bg-gray-50 border-gray-200 rounded-xl"><SelectValue placeholder="Select Category" /></SelectTrigger>
                        <SelectContent>
                          {(dynamicCategories.length > 0 ? dynamicCategories.map(c => c.name) : CATEGORIES).map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {subCategories.length > 0 && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Sub-Category</label>
                      <Select value={formData.subCategoryId} onValueChange={(val) => setFormData({...formData, subCategoryId: val})}>
                        <SelectTrigger className="h-11 bg-gray-50 border-gray-200 rounded-xl"><SelectValue placeholder="Select Sub-Category" /></SelectTrigger>
                        <SelectContent>
                          {subCategories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.category === 'Real Estate' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-yellow-50/40 p-4 rounded-xl border border-yellow-100">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Price (₹)</label>
                        <Input value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="e.g. 50 Lakhs" className="bg-white border-gray-200 rounded-xl h-11" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Bedrooms</label>
                        <Input type="number" value={formData.bedroomCount} onChange={e => setFormData({...formData, bedroomCount: e.target.value})} placeholder="e.g. 3" className="bg-white border-gray-200 rounded-xl h-11" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Area</label>
                        <Input value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} placeholder="e.g. 200 sq yards" className="bg-white border-gray-200 rounded-xl h-11" />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Owner Name</label>
                      <Input value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} placeholder="e.g. Ramesh Kumar" className="h-11 bg-gray-50 border-gray-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Established Year</label>
                      <Input value={formData.establishedYear} onChange={e => setFormData({...formData, establishedYear: e.target.value})} placeholder="e.g. Estd. 1998" className="h-11 bg-gray-50 border-gray-200 rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                      <Input value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} placeholder="10-digit number" className="h-11 bg-gray-50 border-gray-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center justify-between">
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
                      </label>
                      <Input 
                        value={formData.sameAsPhone ? formData.phoneNumber : formData.whatsappNumber} 
                        onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} 
                        disabled={formData.sameAsPhone}
                        placeholder="WhatsApp number" 
                        className="h-11 bg-gray-50 border-gray-200 rounded-xl" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Secondary Phone Number</label>
                      <Input value={formData.secondaryPhone} onChange={e => setFormData({...formData, secondaryPhone: e.target.value})} placeholder="Optional number" className="h-11 bg-gray-50 border-gray-200 rounded-xl" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Village / Area</label>
                      <Select value={formData.villageId} onValueChange={(val) => setFormData({...formData, villageId: val})}>
                        <SelectTrigger className="h-11 bg-gray-50 border-gray-200 rounded-xl"><SelectValue placeholder="Select Village/Area" /></SelectTrigger>
                        <SelectContent>
                          {villages.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.name} - {v.pincode}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Physical Address</label>
                      <Input value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full address" className="h-11 bg-gray-50 border-gray-200 rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Business Hours</label>
                      <Input value={formData.operatingHours || ''} onChange={e => setFormData({...formData, operatingHours: e.target.value})} placeholder="e.g. 9:00 AM - 9:00 PM" className="h-11 bg-gray-50 border-gray-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Google Maps Link</label>
                      <Input value={formData.googleMapsUrl || ''} onChange={e => setFormData({...formData, googleMapsUrl: e.target.value})} placeholder="Maps Link" className="h-11 bg-gray-50 border-gray-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Rating (1-5)</label>
                      <Input type="number" min="1" max="5" step="0.1" value={formData.rating} onChange={e => setFormData({...formData, rating: parseFloat(e.target.value) || 5})} placeholder="5.0" className="h-11 bg-gray-50 border-gray-200 rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Instagram Username</label>
                      <Input value={formData.instagramUsername || ''} onChange={e => setFormData({...formData, instagramUsername: e.target.value})} placeholder="Username" className="h-11 bg-gray-50 border-gray-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Facebook URL</label>
                      <Input value={formData.facebookUrl || ''} onChange={e => setFormData({...formData, facebookUrl: e.target.value})} placeholder="https://..." className="h-11 bg-gray-50 border-gray-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">YouTube URL</label>
                      <Input value={formData.youtubeUrl || ''} onChange={e => setFormData({...formData, youtubeUrl: e.target.value})} placeholder="https://..." className="h-11 bg-gray-50 border-gray-200 rounded-xl" />
                    </div>
                  </div>

                  {/* Services Array Field */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                    <span className="text-gray-800 font-bold text-sm flex justify-between items-center">
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
                              placeholder="Service Name" 
                              value={svc.name}
                              onChange={(e) => {
                                const newSvcs = [...formData.services]
                                newSvcs[idx].name = e.target.value
                                setFormData({ ...formData, services: newSvcs })
                              }}
                              className="bg-white border-gray-200 h-9 text-xs rounded-lg"
                            />
                            <Input 
                              placeholder="Description" 
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
                        <p className="text-xs text-gray-400 italic">No services added yet.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                    <div className="border border-gray-200 rounded-xl overflow-hidden min-h-[200px] shadow-sm">
                      <RichTextEditor
                        content={formData.description}
                        onChange={(html) => setFormData({...formData, description: html})}
                        placeholder="Describe the business..."
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={submitListing} 
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8962E] hover:from-[#B8962E] hover:to-[#967A26] text-white py-6 rounded-xl text-lg shadow-lg font-bold border-none"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin size-5" /> : (editingListingId ? 'Update Listing' : 'Create Listing')}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          
{activeTab === 'add_news' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 p-6 md:p-8">
                  <h2 className="text-2xl font-black text-gray-900 mb-6 pb-4 border-b border-gray-100">Add Local News</h2>
                  <AgentNewsForm onSuccess={() => setActiveTab('portfolio')} />
                </div>
              </motion.div>
            )}

            {activeTab === 'add_blog' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 p-6 md:p-8">
                  <h2 className="text-2xl font-black text-gray-900 mb-6 pb-4 border-b border-gray-100">Add Blog Post</h2>
                  <AgentBlogForm onSuccess={() => setActiveTab('portfolio')} />
                </div>
              </motion.div>
            )}

            {activeTab === 'bulk_upload' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 p-8 flex flex-col items-center justify-center text-center">
                <div className="p-5 bg-blue-50 rounded-full mb-5">
                  <FileText className="size-12 text-[#4169E1]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Bulk CSV Upload</h2>
                <p className="text-gray-500 mb-8 max-w-md leading-relaxed">Upload a CSV file to instantly add multiple businesses at once.</p>
                
                <div className="flex gap-4 w-full max-w-sm">
                  <Button variant="outline" onClick={downloadTemplate} className="flex-1 flex gap-2 h-12 rounded-xl font-semibold border-gray-300 text-gray-700">
                    <Download className="size-4" /> Template
                  </Button>
                  <label className="flex-1">
                    <div className="flex items-center justify-center gap-2 bg-[#4169E1] hover:bg-[#3151b0] text-white px-4 py-2 rounded-xl cursor-pointer transition-colors shadow-md text-sm font-bold h-12">
                      <UploadCloud className="size-4" /> {csvFile ? 'Change File' : 'Upload CSV'}
                    </div>
                    <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                  </label>
                </div>
              </div>

              {parsedData.length > 0 && (
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <div className="w-1 h-5 bg-green-500 rounded-full"></div>
                      Preview ({parsedData.length} records)
                    </h3>
                    <Button onClick={submitBulkUpload} disabled={isUploadingBulk} className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md px-6 border-none">
                      {isUploadingBulk ? <Loader2 className="animate-spin size-4 mr-2" /> : <UploadCloud className="size-4 mr-2" />}
                      Upload All
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                        <tr>
                          <th className="px-5 py-4 font-semibold">Name</th>
                          <th className="px-5 py-4 font-semibold">Category</th>
                          <th className="px-5 py-4 font-semibold">Phone</th>
                          <th className="px-5 py-4 font-semibold">Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {parsedData.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 font-semibold text-gray-900">{row.name || '-'}</td>
                            <td className="px-5 py-3 text-gray-600">
                              <Badge variant="outline" className="bg-white">{row.category || '-'}</Badge>
                            </td>
                            <td className="px-5 py-3 text-gray-600 font-mono text-xs">{row.phoneNumber || '-'}</td>
                            <td className="px-5 py-3 text-gray-500 truncate max-w-[200px]">{row.address || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedData.length > 10 && (
                      <div className="px-5 py-4 text-center text-sm font-medium text-gray-500 bg-gray-50 border-t border-gray-200">
                        ... and {parsedData.length - 10} more records ready to upload
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          
{activeTab === 'portfolio' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
                 <div className="w-1 h-6 bg-[#4169E1] rounded-full"></div>
                 My Assignments
              </h2>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse border border-gray-100" />)}
                </div>
              ) : listingsData?.listings?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {listingsData.listings.map((listing: UserListing) => (
                    <div key={listing.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white hover:shadow-md transition-shadow">
                      <div className="h-36 bg-gray-100 relative group">
                        {listing.coverImage ? (
                          <Image src={listing.coverImage} alt={listing.name} fill className="object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-400 bg-gray-50"><ImageIcon className="size-8" /></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button onClick={() => openEdit(listing)} className="p-2 bg-white/95 backdrop-blur-sm rounded-lg hover:bg-white text-gray-700 shadow-sm transition-transform hover:scale-105"><Edit2 className="size-4" /></button>
                          <button onClick={() => deleteListing(listing.id)} className="p-2 bg-white/95 backdrop-blur-sm rounded-lg hover:bg-red-50 text-red-600 shadow-sm transition-transform hover:scale-105"><Trash2 className="size-4" /></button>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-gray-900 truncate mb-1">{listing.name}</h3>
                        <p className="text-xs font-semibold text-[#4169E1] mb-3">{listing.category}</p>
                        
                        <div className="mt-auto flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-1"><Eye className="size-3" /> {listing.viewsCount}</div>
                          <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">{listing.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                    <Store className="size-8 text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-600">No assignments found.</p>
                  <p className="text-sm mt-1">Start adding listings to see them here.</p>
                  <Button onClick={() => setActiveTab('add_listing')} className="mt-4 bg-[#D4AF37] hover:bg-[#B8962E] text-white rounded-xl shadow-md border-none">Add First Listing</Button>
                </div>
              )}
            </motion.div>
          )}
        
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
