'use client'

import { useState, useEffect, useRef } from 'react'
import { getAdminListings, deleteAdminListing, createAdminListing, updateAdminListing, bulkCreateAdminListings } from '@/app/actions/admin-actions'
import { Loader2, Trash2, Upload, Plus, Edit, Image as ImageIcon, X, Search, FileDown, FileUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'
import Papa from 'papaparse'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const CATEGORIES = ['All', 'Tiffin', 'Medical', 'Salon', 'Plumber', 'Services', 'Electronics', 'Automobile', 'Tailor', 'Hardware', 'Education']

export default function AdminListings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ listings: any[] }>({ listings: [] })
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')

  // Modals
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState<any>(null) // null or listing object
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form State
  const [category, setCategory] = useState('Business')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [bhk, setBhk] = useState('')
  const [area, setArea] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')

  // Images State
  const [logoUrl, setLogoUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [galleryUrls, setGalleryUrls] = useState<string[]>([])
  const [isFeatured, setIsFeatured] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await getAdminListings()
      setData(res)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, type: 'business' | 'real_estate') => {
    if (!confirm('Are you sure you want to delete this listing?')) return
    try {
      await deleteAdminListing(id, type)
      fetchData()
    } catch (e) {
      alert('Error deleting listing')
    }
  }

  const handleEditClick = (item: any) => {
    setIsEditing(item)
    setCategory(item.category || 'Business')
    setName(item.name || item.title || '')
    setDescription(item.description || '')
    setPrice(item.price || '')
    setBhk(item.bedroomCount?.toString() || '')
    setArea(item.area || '')
    setAddress(item.address || '')
    setPhone(item.phoneNumber || item.ownerPhone || '')
    setLogoUrl(item.logoUrl || '')
    setCoverUrl(item.coverImage || (item.images && JSON.parse(item.images)[0]) || '')
    setGalleryUrls(item.gallery ? JSON.parse(item.gallery) : (item.images ? JSON.parse(item.images) : []))
    setIsFeatured(item.isFeatured || false)
  }

  const resetForm = () => {
    setIsCreating(false)
    setIsEditing(null)
    setCategory('Business')
    setName('')
    setDescription('')
    setPrice('')
    setBhk('')
    setArea('')
    setAddress('')
    setPhone('')
    setLogoUrl('')
    setCoverUrl('')
    setGalleryUrls([])
    setIsFeatured(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover' | 'gallery') => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setUploading(true)
    toast.loading('Uploading image(s)...', { id: 'upload' })
    try {
      const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true }
      
      const newUrls: string[] = []
      for (const file of files) {
        if (type === 'gallery' && galleryUrls.length + newUrls.length >= 5) break
        
        const compressedFile = await imageCompression(file, options)
        const fileName = `${type}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
        
        const { error } = await supabase.storage.from('listing-images').upload(fileName, compressedFile)
        if (error) throw error

        const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(fileName)
        newUrls.push(publicUrl)
      }

      if (type === 'logo') setLogoUrl(newUrls[0])
      if (type === 'cover') setCoverUrl(newUrls[0])
      if (type === 'gallery') setGalleryUrls(prev => [...prev, ...newUrls].slice(0, 5))
      
      toast.success('Upload successful!', { id: 'upload' })
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Upload failed', { id: 'upload' })
    } finally {
      setUploading(false)
    }
    e.target.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    try {
      const cityId = data.listings[0]?.cityId || (user as any)?.cityId || user?.id // fallback cityId

        const payload = {
          name,
          category,
          description,
          phoneNumber: phone,
          address,
          logoUrl,
          coverImage: coverUrl,
          images: JSON.stringify(galleryUrls),
          gallery: JSON.stringify(galleryUrls),
          status: 'APPROVED',
          isApproved: true,
          isFeatured,
          cityId: isEditing ? isEditing.cityId : cityId,
          userId: isEditing ? isEditing.userId : user?.id,
        } as any;

        if (!isEditing) {
          payload.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
        }
        if (isEditing) {
          await updateAdminListing(isEditing.id, payload, 'business')
        } else {
          await createAdminListing(payload, 'business')
        }
      
      resetForm()
      fetchData()
    } catch (error) {
      console.error(error)
      alert(isEditing ? 'Failed to update' : 'Failed to create')
    } finally {
      setUploading(false)
    }
  }

  const downloadSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,name,category,description,phoneNumber,whatsappNumber,address,coverImage,logoUrl\nSample Business,Services,A great service,9876543210,9876543210,123 Main St,https://example.com/cover.jpg,https://example.com/logo.jpg";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "listings_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const formattedListings = results.data.map((row: any) => ({
            name: row.name,
            category: row.category || 'Services',
            description: row.description,
            phoneNumber: row.phoneNumber,
            whatsappNumber: row.whatsappNumber,
            address: row.address,
            coverImage: row.coverImage,
            logoUrl: row.logoUrl,
            status: 'APPROVED',
            isApproved: true,
            cityId: data.listings[0]?.cityId || user?.id,
            userId: user?.id,
          }))

          if (formattedListings.length > 0) {
            await bulkCreateAdminListings(formattedListings, 'business')
            fetchData()
            alert('Bulk upload successful!')
          }
        } catch (error) {
          console.error(error)
          alert('Error processing CSV')
        } finally {
          setUploading(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      }
    })
  }

  const allListings = [
    ...data.listings.map(l => ({ ...l, _type: 'business' }))
  ]

  const filteredListings = allListings.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.phoneNumber?.includes(searchQuery) ||
                          item.ownerPhone?.includes(searchQuery)
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Listings Management</h2>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Add Listing
          </Button>
          <Button onClick={downloadSampleCSV} variant="outline" className="rounded-xl">
            <FileDown className="w-4 h-4 mr-2" /> Sample CSV
          </Button>
          <div>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleCSVUpload}
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              variant="outline" 
              className="rounded-xl bg-gray-50 hover:bg-gray-100"
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileUp className="w-4 h-4 mr-2" />} 
              Upload CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search by name or phone..." 
            className="pl-9 rounded-xl border-gray-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full md:w-[200px] rounded-xl border-gray-200">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden group">
              <div className="h-40 bg-gray-100 relative">
                {item.coverImage || (item.images && JSON.parse(item.images)?.[0]) ? (
                  <img loading="lazy" decoding="async" 
                    src={item.coverImage || JSON.parse(item.images)[0]} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-8 h-8 opacity-20" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge variant={item.status === 'APPROVED' ? 'default' : 'secondary'} className="shadow-sm">
                    {item.status}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                </div>
                <div className="space-y-1 mb-4">
                  <Badge variant="outline" className="text-xs text-blue-600 bg-blue-50 border-blue-100">
                    {item.category}
                  </Badge>
                  <p className="text-sm text-gray-500 font-medium">{item.phoneNumber || item.ownerPhone || 'No Phone'}</p>
                </div>
                <div className="flex justify-end gap-2 border-t border-gray-50 pt-3">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    onClick={() => handleEditClick(item)}
                  >
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    onClick={() => handleDelete(item.id, item._type)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {filteredListings.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">
              No listings found matching your search.
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {(isCreating || isEditing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 p-6 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold">{isEditing ? 'Edit Listing' : 'Add New Listing'}</h2>
              <button onClick={resetForm} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full rounded-xl border-gray-200 bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(c => c !== 'All').map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Name / Title</label>
                  <Input 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="rounded-xl border-gray-200 bg-gray-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Description</label>
                <textarea 
                  className="w-full min-h-[100px] p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Business Owner Phone Number (Required for Auto-Claim)</label>
                  <Input required value={phone} onChange={e => setPhone(e.target.value)} className="rounded-xl border-gray-200 bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Address</label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} className="rounded-xl border-gray-200 bg-gray-50" />
                </div>
              </div>

                <div className="grid grid-cols-1 gap-4 p-4 bg-yellow-50/50 rounded-2xl border border-yellow-100 mt-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                    <div className="flex items-center gap-2 mt-2">
                      <input 
                        type="checkbox" 
                        id="isFeaturedBusiness"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="w-5 h-5 text-yellow-600 rounded border-yellow-300 focus:ring-yellow-500"
                      />
                      <label htmlFor="isFeaturedBusiness" className="text-sm font-bold text-yellow-900 cursor-pointer">
                        👑 Mark as Featured Listing (Shows at the top)
                      </label>
                    </div>
                  </div>
                </div>



              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-900 border-b pb-2">Images</h3>
                
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">Logo</label>
                    <div className="flex items-center gap-4">
                      {logoUrl && <img loading="lazy" decoding="async" src={logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />}
                      <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'logo')} disabled={uploading} className="rounded-xl" />
                    </div>
                  </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Cover Image</label>
                  <div className="flex items-center gap-4">
                    {coverUrl && <img loading="lazy" decoding="async" src={coverUrl} alt="Cover" className="w-24 h-16 rounded-xl object-cover border border-gray-200" />}
                    <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'cover')} disabled={uploading} className="rounded-xl" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Gallery ({galleryUrls.length}/5)</label>
                  <Input type="file" accept="image/*" multiple onChange={e => handleImageUpload(e, 'gallery')} disabled={uploading} className="rounded-xl mb-3" />
                  <div className="flex flex-wrap gap-2">
                    {galleryUrls.map((url, i) => (
                      <div key={i} className="relative group">
                        <img loading="lazy" decoding="async" src={url} alt="Gallery" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                        <button type="button" onClick={() => setGalleryUrls(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1 rounded-xl h-12">Cancel</Button>
                <Button type="submit" disabled={uploading} className="flex-1 rounded-xl h-12 bg-blue-600 hover:bg-blue-700 text-white">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (isEditing ? 'Save Changes' : 'Create Listing')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
