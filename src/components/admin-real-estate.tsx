'use client'

import { useState, useEffect, useRef } from 'react'
import { getAdminListings, deleteAdminListing, createAdminListing, updateAdminListing } from '@/app/actions/admin-actions'
import { Loader2, Trash2, Plus, Edit, Image as ImageIcon, X, Search, Building2, CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function AdminRealEstate() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<any[]>([])
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('All') // All, Sale, Rent

  // Modals
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState<any>(null)
  const [uploading, setUploading] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [listingType, setListingType] = useState('Sale')
  const [bhk, setBhk] = useState('')
  const [area, setArea] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [galleryUrls, setGalleryUrls] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await getAdminListings()
      setListings(res.realEstate || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this property?')) return
    try {
      await deleteAdminListing(id, 'real_estate')
      fetchData()
      toast.success('Property deleted')
    } catch (e) {
      toast.error('Error deleting property')
    }
  }

  const handleToggleStatus = async (item: any) => {
    const newStatus = item.status === 'APPROVED' ? 'PENDING' : 'APPROVED'
    try {
      await updateAdminListing(item.id, { status: newStatus, isApproved: newStatus === 'APPROVED' }, 'real_estate')
      fetchData()
      toast.success(`Property ${newStatus === 'APPROVED' ? 'approved' : 'rejected'}`)
    } catch (e) {
      toast.error('Error updating status')
    }
  }

  const handleToggleFeature = async (item: any) => {
    try {
      await updateAdminListing(item.id, { isFeatured: !item.isFeatured }, 'real_estate')
      fetchData()
      toast.success(`Property ${!item.isFeatured ? 'featured' : 'un-featured'}`)
    } catch (e) {
      toast.error('Error updating feature status')
    }
  }

  const handleEditClick = (item: any) => {
    setIsEditing(item)
    setTitle(item.title || '')
    setPrice(item.price || '')
    setListingType(item.listingType || 'Sale')
    setBhk(item.bedroomCount?.toString() || '')
    setArea(item.area || '')
    setAddress(item.address || '')
    setPhone(item.ownerPhone || '')
    setGalleryUrls(item.images ? JSON.parse(item.images) : [])
    setIsFeatured(item.isFeatured || false)
    setIsCreating(true)
  }

  const resetForm = () => {
    setIsCreating(false)
    setIsEditing(null)
    setTitle('')
    setPrice('')
    setListingType('Sale')
    setBhk('')
    setArea('')
    setAddress('')
    setPhone('')
    setGalleryUrls([])
    setIsFeatured(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setUploading(true)
    toast.loading('Uploading image(s)...', { id: 'upload' })
    try {
      const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true }
      const newUrls: string[] = []
      
      for (const file of files) {
        if (galleryUrls.length + newUrls.length >= 5) break
        const compressedFile = await imageCompression(file, options)
        const fileName = `realestate/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
        const { error } = await supabase.storage.from('listing-images').upload(fileName, compressedFile)
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(fileName)
        newUrls.push(publicUrl)
      }

      setGalleryUrls(prev => [...prev, ...newUrls].slice(0, 5))
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
      const payload = {
        title,
        price,
        listingType,
        ownerPhone: phone,
        bedroomCount: bhk ? parseInt(bhk) : null,
        area,
        address,
        images: JSON.stringify(galleryUrls),
        status: 'APPROVED',
        isApproved: true,
        isFeatured,
        cityId: isEditing ? isEditing.cityId : (listings[0]?.cityId || (user as any)?.cityId || user?.id),
        userId: isEditing ? isEditing.userId : user?.id,
      }
      
      if (isEditing) {
        await updateAdminListing(isEditing.id, payload, 'real_estate')
        toast.success('Property updated')
      } else {
        await createAdminListing(payload, 'real_estate')
        toast.success('Property created')
      }
      
      resetForm()
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error(isEditing ? 'Failed to update' : 'Failed to create')
    } finally {
      setUploading(false)
    }
  }

  const filteredListings = listings.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.ownerPhone?.includes(searchQuery)
    const matchesType = filterType === 'All' || item.listingType?.toLowerCase() === filterType.toLowerCase()
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          Real Estate Management
        </h2>
        <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Add New Property
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search by title or phone..." 
            className="pl-9 rounded-xl border-gray-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-[200px] rounded-xl border-gray-200">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Types</SelectItem>
            <SelectItem value="Sale">Sale</SelectItem>
            <SelectItem value="Rent">Rent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Title</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Price</th>
                  <th className="px-6 py-4 font-semibold">Size (BHK / Area)</th>
                  <th className="px-6 py-4 font-semibold">Posted Date</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-center">Featured</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredListings.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        {item.images && JSON.parse(item.images)?.[0] ? (
                          <img src={JSON.parse(item.images)[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <span className="truncate max-w-[200px]">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={item.listingType?.toLowerCase() === 'rent' ? 'text-purple-600 border-purple-200 bg-purple-50' : 'text-blue-600 border-blue-200 bg-blue-50'}>
                        {item.listingType || 'Sale'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-semibold">{item.price}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.bedroomCount ? `${item.bedroomCount} BHK` : '-'} 
                      {item.area ? ` • ${item.area}` : ''}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={item.status === 'APPROVED' ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => handleToggleStatus(item)}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleToggleFeature(item)} className={`p-1.5 rounded-full transition ${item.isFeatured ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                        👑
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" className="text-gray-600 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleEditClick(item)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredListings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No real estate properties found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 p-6 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                {isEditing ? 'Edit Property' : 'Add New Property'}
              </h2>
              <button onClick={resetForm} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Property Title</label>
                  <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. 2BHK Independent House" className="rounded-xl border-gray-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Listing Type</label>
                  <Select value={listingType} onValueChange={setListingType}>
                    <SelectTrigger className="rounded-xl border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sale">Sale</SelectItem>
                      <SelectItem value="Rent">Rent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Price</label>
                  <Input required value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. ₹45 Lakhs or ₹10,000/month" className="rounded-xl border-gray-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Owner Phone Number</label>
                  <Input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 9876543210" className="rounded-xl border-gray-200" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">BHK (Bedrooms)</label>
                  <Input type="number" value={bhk} onChange={e => setBhk(e.target.value)} placeholder="e.g. 2" className="rounded-xl border-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Area</label>
                  <Input value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. 1500 sqft" className="rounded-xl border-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Featured</label>
                  <div className="flex items-center h-10">
                    <input 
                      type="checkbox" 
                      id="isFeaturedProp"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-2"
                    />
                    <label htmlFor="isFeaturedProp" className="text-sm font-bold text-gray-800 cursor-pointer">
                      👑 Feature Property
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Full Address / Location</label>
                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. Near Bus Stand, Choutuppal" className="rounded-xl border-gray-200" />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-gray-700 block mb-2">Property Images ({galleryUrls.length}/5)</label>
                <Input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} className="rounded-xl mb-3" />
                <div className="flex flex-wrap gap-2">
                  {galleryUrls.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="Gallery" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                      <button type="button" onClick={() => setGalleryUrls(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1 rounded-xl h-12">Cancel</Button>
                <Button type="submit" disabled={uploading} className="flex-1 rounded-xl h-12 bg-blue-600 hover:bg-blue-700 text-white">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (isEditing ? 'Save Changes' : 'Create Property')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
