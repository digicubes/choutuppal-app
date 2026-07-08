import json
import re

with open('src/components/agent-dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("address: '', coverImage: '',", "address: '', coverImage: '', logoUrl: '', galleryUrls: [],")
content = content.replace("address: l.address || '', coverImage: l.coverImage || '',", "address: l.address || '', coverImage: l.coverImage || '', logoUrl: l.logoUrl || '', galleryUrls: l.gallery ? JSON.parse(l.gallery) : [],")

payload_match = """        const payload = {
          ...formData,
          cityId: finalCityId,
          userId: user?.id,
          slug,
          isApproved: true,
          status: 'APPROVED',
        }"""
payload_replace = """        const payload = {
          ...formData,
          gallery: JSON.stringify(formData.galleryUrls),
          cityId: finalCityId,
          userId: user?.id,
          slug,
          isApproved: true,
          status: 'APPROVED',
        }"""
content = content.replace(payload_match, payload_replace)

# Modify handleImageUpload
handle_match = """    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return
      const file = e.target.files[0]"""
handle_replace = """    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'coverImage' | 'logoUrl' | 'gallery') => {
      if (!e.target.files || e.target.files.length === 0) return
      const file = e.target.files[0]"""
content = content.replace(handle_match, handle_replace)

setform_match = """      setFormData(prev => ({ ...prev, coverImage: publicUrl }))"""
setform_replace = """      if (field === 'gallery') {
        setFormData(prev => ({ ...prev, galleryUrls: [...prev.galleryUrls, publicUrl] }))
      } else {
        setFormData(prev => ({ ...prev, [field]: publicUrl }))
      }"""
content = content.replace(setform_match, setform_replace)

# Modify image input
input_match = """<input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />"""
input_replace = """<input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'coverImage')} />"""
content = content.replace(input_match, input_replace)

# Add Logo and Gallery upload UI
upload_ui_match = """                     {/* Image Upload */}
                     <div>
                       <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Photo</label>
                       <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="h-48 border-2 border-dashed border-[#4169E1]/30 bg-blue-50/50 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:bg-blue-50 cursor-pointer overflow-hidden relative transition-all duration-200"
                       >
                         {formData.coverImage ? (
                           <Image src={formData.coverImage} alt="Cover" fill className="object-cover" />
                         ) : (
                           <>
                             <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                               <UploadCloud className="size-6 text-[#4169E1]" />
                             </div>
                             <span className="text-sm font-medium text-gray-600">Click to upload cover photo</span>
                           </>
                         )}
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'coverImage')} />
                       </div>
                     </div>"""
upload_ui_replace = """                     {/* Image Upload Zones */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       {/* Logo Upload */}
                       <div>
                         <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Photo / Logo (షాప్ లోగో)</label>
                         <div className="h-48 border-2 border-dashed border-[#4169E1]/30 bg-blue-50/50 rounded-xl flex flex-col items-center justify-center text-gray-500 overflow-hidden relative transition-all duration-200">
                           {formData.logoUrl ? (
                             <>
                               <Image src={formData.logoUrl} alt="Logo" fill className="object-contain p-2" />
                               <button onClick={() => setFormData(p => ({...p, logoUrl: ''}))} className="absolute top-2 right-2 p-2 bg-white/80 rounded-full text-red-500 hover:bg-red-500 hover:text-white z-10 shadow"><Trash2 className="size-4" /></button>
                             </>
                           ) : (
                             <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50">
                               <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                                 <UploadCloud className="size-6 text-[#4169E1]" />
                               </div>
                               <span className="text-sm font-medium text-gray-600">Upload Logo</span>
                               <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} />
                             </label>
                           )}
                         </div>
                       </div>
                       {/* Cover Image Upload */}
                       <div>
                         <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Banner Image</label>
                         <div className="h-48 border-2 border-dashed border-[#4169E1]/30 bg-blue-50/50 rounded-xl flex flex-col items-center justify-center text-gray-500 overflow-hidden relative transition-all duration-200">
                           {formData.coverImage ? (
                             <>
                               <Image src={formData.coverImage} alt="Cover" fill className="object-cover" />
                               <button onClick={() => setFormData(p => ({...p, coverImage: ''}))} className="absolute top-2 right-2 p-2 bg-white/80 rounded-full text-red-500 hover:bg-red-500 hover:text-white z-10 shadow"><Trash2 className="size-4" /></button>
                             </>
                           ) : (
                             <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50">
                               <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                                 <UploadCloud className="size-6 text-[#4169E1]" />
                               </div>
                               <span className="text-sm font-medium text-gray-600">Upload Cover Photo</span>
                               <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'coverImage')} />
                             </label>
                           )}
                         </div>
                       </div>
                     </div>
                     {/* Gallery Upload */}
                     <div>
                       <label className="block text-sm font-semibold text-gray-700 mb-2">Gallery Images (up to 5 photos)</label>
                       <div className="flex gap-4 overflow-x-auto pb-2">
                         {formData.galleryUrls.map((url, i) => (
                           <div key={i} className="min-w-[120px] h-[120px] relative border rounded-xl overflow-hidden shadow-sm">
                             <Image src={url} alt={`Gallery ${i}`} fill className="object-cover" />
                             <button onClick={() => setFormData(p => ({...p, galleryUrls: p.galleryUrls.filter((_, idx) => idx !== i)}))} className="absolute top-1 right-1 p-1.5 bg-white/80 rounded-full text-red-500 hover:bg-red-500 hover:text-white z-10"><Trash2 className="size-3" /></button>
                           </div>
                         ))}
                         {formData.galleryUrls.length < 5 && (
                           <label className="min-w-[120px] h-[120px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer">
                             <Plus className="size-6 mb-1" />
                             <span className="text-xs">Add Photo</span>
                             <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'gallery')} />
                           </label>
                         )}
                       </div>
                     </div>"""
content = content.replace(upload_ui_match, upload_ui_replace)

# Ensure 'About/Description' uses Tiptap Rich Text Editor
desc_match = """                       <div className="md:col-span-2">
                         <label className="block text-sm font-semibold text-gray-700 mb-1">About / Description</label>
                         <textarea 
                           value={formData.description}
                           onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                           className="w-full border border-gray-200 rounded-xl px-4 py-3 min-h-[120px] focus:ring-2 focus:ring-[#4169E1] focus:border-transparent outline-none transition-all"
                           placeholder="Describe your business or property..."
                         ></textarea>
                       </div>"""
desc_replace = """                       <div className="md:col-span-2">
                         <label className="block text-sm font-semibold text-gray-700 mb-1">About / Description</label>
                         <RichTextEditor
                           content={formData.description}
                           onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                           placeholder="Describe your business or property..."
                         />
                       </div>"""
content = content.replace(desc_match, desc_replace)

with open('src/components/agent-dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Patch applied')
