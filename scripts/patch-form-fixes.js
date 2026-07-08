const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard-view.tsx', 'utf-8');

// Ensure supabase import
if (!content.includes("import { supabase } from '@/lib/supabase'")) {
  content = content.replace("import { RichTextEditor } from '@/components/rich-text-editor'", "import { RichTextEditor } from '@/components/rich-text-editor'\nimport { supabase } from '@/lib/supabase'");
}

// 1. Fix compressAndUpload
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
    
    // Upload to Supabase 'listing-images' bucket
    const fileExt = fileToUpload.name.split('.').pop()
    const fileName = \`\${Math.random().toString(36).substring(2, 15)}.\${fileExt}\`
    const filePath = \`\${folder}/\${fileName}\`

    const { data, error } = await supabase.storage
      .from('listing-images')
      .upload(filePath, fileToUpload)

    if (error) {
      console.error('Supabase upload error:', error)
      throw new Error('Upload failed')
    }

    const { data: { publicUrl } } = supabase.storage
      .from('listing-images')
      .getPublicUrl(filePath)

    return { url: publicUrl }
  }`;

content = content.replace(/const compressAndUpload = async \([\s\S]*?return await res\.json\(\)\n  \}/, newCompressAndUpload);


// 2. Fix Category Dropdown
const oldCategoryHtml = `<Select value={formData.category} onValueChange={val => setFormData({...formData, category: val})}>
                      <SelectTrigger className="bg-white border-gray-200 text-gray-900 rounded-xl h-12 focus:ring-[#4169E1]">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 text-gray-900 max-h-60">
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>`;

const newCategoryHtml = `<select 
                      value={formData.category} 
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl h-12 px-4 focus:ring-2 focus:ring-[#4169E1] focus:outline-none appearance-none"
                    >
                      <option value="" disabled>Select Category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>`;

content = content.replace(oldCategoryHtml, newCategoryHtml);


// 3. Fix Same as Phone Checkbox and Input
// Look for the label with CheckSquare/Square
const checkboxRegex = /<label className="flex items-center gap-1\.5 text-xs text-\[#4169E1\] font-bold cursor-pointer bg-\[#4169E1\]\/5 px-2 py-1 rounded">[\s\S]*?<\/label>/;
const newCheckboxHtml = `<label className="flex items-center gap-1.5 text-xs text-[#4169E1] font-bold cursor-pointer bg-[#4169E1]/5 px-2 py-1 rounded select-none">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-[#4169E1] rounded border-gray-300"
                          checked={formData.sameAsPhone}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setFormData({
                              ...formData, 
                              sameAsPhone: isChecked, 
                              whatsappNumber: isChecked ? formData.phoneNumber : formData.whatsappNumber
                            });
                          }}
                        />
                        <span>Same as Phone</span>
                      </label>`;

content = content.replace(checkboxRegex, newCheckboxHtml);

// Fix the WhatsApp input to disable it when sameAsPhone is true
const oldWaInput = `                    {!formData.sameAsPhone && (
                      <div className="relative">
                        <MessageCircle className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        <Input placeholder="WhatsApp Number" type="tel" value={formData.whatsappNumber} onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} className="bg-white border-gray-200 text-gray-900 rounded-xl h-12 pl-10 focus-visible:ring-[#25D366]" />
                      </div>
                    )}`;

const newWaInput = `                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <Input 
                        placeholder="WhatsApp Number" 
                        type="tel" 
                        value={formData.sameAsPhone ? formData.phoneNumber : formData.whatsappNumber} 
                        onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} 
                        disabled={formData.sameAsPhone}
                        className="bg-white border-gray-200 text-gray-900 rounded-xl h-12 pl-10 focus-visible:ring-[#25D366] disabled:bg-gray-100 disabled:text-gray-500" 
                      />
                    </div>`;

content = content.replace(oldWaInput, newWaInput);

fs.writeFileSync('src/components/dashboard-view.tsx', content, 'utf-8');
console.log('Patched dashboard-view.tsx');
