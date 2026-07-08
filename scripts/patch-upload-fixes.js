const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard-view.tsx', 'utf-8');

// 1. Revert compressAndUpload to use API route
const oldCompressAndUploadRegex = /const compressAndUpload = async \([\s\S]*?return \{ url: publicUrl \}\n  \}/;
const newCompressAndUpload = `  const compressAndUpload = async (file: File, folder: string) => {
    let fileToUpload = file
    if (file.type.startsWith('image/')) {
      try {
        const imageCompression = (await import('browser-image-compression')).default
        const options = { maxSizeMB: 1, maxWidthOrHeight: 800, useWebWorker: true, initialQuality: 0.6 }
        fileToUpload = await imageCompression(file, options)
      } catch (err) {
        console.error('Image compression error:', err)
      }
    }
    
    const uploadData = new FormData()
    uploadData.append('file', fileToUpload)
    uploadData.append('folder', folder)
    const res = await fetch('/api/upload', { method: 'POST', body: uploadData })
    if (!res.ok) throw new Error('Upload failed')
    return await res.json()
  }`;

content = content.replace(oldCompressAndUploadRegex, newCompressAndUpload);

// Also remove import { supabase } from '@/lib/supabase' since we don't need it on client for upload anymore
content = content.replace("import { supabase } from '@/lib/supabase'", "");

// 2. Lock 'Real Estate' Category
// Look for category select and add disabled condition
const selectRegex = /<select \n\s*value=\{formData\.category\}\n\s*onChange=\{\(e\) => setFormData\(\{\.\.\.formData, category: e\.target\.value\}\)\}\n\s*className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl h-12 px-4 focus:ring-2 focus:ring-\[#4169E1\] focus:outline-none appearance-none"\n\s*>/;

const newSelect = `<select 
                      value={formData.category} 
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      disabled={formData.category === 'Real Estate'}
                      className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl h-12 px-4 focus:ring-2 focus:ring-[#4169E1] focus:outline-none appearance-none disabled:bg-gray-100 disabled:text-gray-500"
                    >`;
content = content.replace(selectRegex, newSelect);


// 3. Update submitListing with console.log and alerts
const submitListingRegex = /const submitListing = async \(\) => {[\s\S]*?setUploading\(false\)\n    }\n  }/;
const newSubmitListing = `const submitListing = async () => {
    if (!currentUser || !formData.name || !formData.category) return
    console.log('Submitting:', formData)
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
          phoneNumber: formData.phoneNumber || null,
          whatsappNumber: formData.sameAsPhone ? formData.phoneNumber : (formData.whatsappNumber || null),
          address: formData.address || null,
          coverImage: formData.coverImage || null,
          logoUrl: formData.logoUrl || null,
          gallery: formData.gallery.length > 0 ? formData.gallery : null,
          instagramUrl: formData.instagramUrl || null,
          facebookUrl: formData.facebookUrl || null,
          youtubeUrl: formData.youtubeUrl || null,
        }),
      })
      if (res.ok) {
        alert('Listing published successfully!')
        toast.success('Listing created successfully!')
        setIsCreatingListing(false)
        fetchListings()
        setFormData({
          name: '', category: '', description: '', phoneNumber: '', whatsappNumber: '', cityId: '', sameAsPhone: false, address: '',
          coverImage: '', logoUrl: '', gallery: [], instagramUrl: '', facebookUrl: '', youtubeUrl: ''
        })
      } else {
        alert('Failed to publish. Check console.')
        toast.error('Failed to create listing')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to publish. Check console.')
      toast.error('Something went wrong')
    } finally {
      setUploading(false)
    }
  }`;

content = content.replace(submitListingRegex, newSubmitListing);

// 4. Add Banner UI if it's missing
if (!content.includes('isCreatingBanner &&')) {
  const bannerUIRegex = /<\/AnimatePresence>\n\s*<\/div>\n\s*<\/div>\n\s*\)\n\}/;
  const bannerUI = `</AnimatePresence>

      {/* Banner Form Modal */}
      <AnimatePresence>
        {isCreatingBanner && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white md:bg-black/50 flex flex-col md:items-center md:justify-center md:p-6"
          >
            <div className="flex flex-col w-full h-full md:h-auto md:max-h-[90vh] md:max-w-md md:bg-white md:rounded-2xl md:shadow-2xl md:overflow-hidden relative">
            <div className="p-4 pt-safe-top flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-20 shadow-sm">
              <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-100 rounded-full" onClick={() => setIsCreatingBanner(false)}>
                <X className="w-6 h-6" />
              </Button>
              <span className="text-gray-900 font-black text-lg">New Banner Ad</span>
              <div className="w-10"></div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50 p-4 pb-32">
              <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
                
                <div className="flex flex-col gap-2">
                  <span className="text-gray-800 font-bold text-sm">Banner Image *</span>
                  <label className="flex items-center justify-center gap-2 bg-gray-50 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl h-32 cursor-pointer hover:bg-gray-100 transition overflow-hidden relative">
                    {bannerData.imageUrl ? (
                      <Image src={bannerData.imageUrl} alt="Banner" fill className="object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <UploadCloud className="w-6 h-6 text-purple-500" />
                        <span className="font-bold text-sm">Upload Banner</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleBannerFileChange} />
                  </label>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-gray-800 font-bold text-sm">Target Link / URL</span>
                  <Input placeholder="https://..." value={bannerData.linkUrl || ''} onChange={e => setBannerData({...bannerData, linkUrl: e.target.value})} className="bg-white border-gray-200 text-gray-900 rounded-xl h-12 focus-visible:ring-purple-500" />
                </div>
                
                {/* Fallback required field */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-gray-800 font-bold text-sm">Internal Title *</span>
                  <Input placeholder="E.g., Diwali Sale" value={bannerData.title || ''} onChange={e => setBannerData({...bannerData, title: e.target.value})} className="bg-white border-gray-200 text-gray-900 rounded-xl h-12 focus-visible:ring-purple-500" />
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-safe-bottom z-30">
              <Button onClick={submitBanner} disabled={uploading || !bannerData.title || !bannerData.imageUrl} className="w-full max-w-lg mx-auto h-14 text-lg font-extrabold rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center">
                {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Publish Banner'}
              </Button>
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}`;
  content = content.replace(bannerUIRegex, bannerUI);
}

fs.writeFileSync('src/components/dashboard-view.tsx', content, 'utf-8');
console.log('Patched dashboard-view.tsx');
