const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard-view.tsx', 'utf-8');

// Ensure supabase import
if (!content.includes("import { supabase } from '@/lib/supabase'")) {
  content = content.replace("import { RichTextEditor } from '@/components/rich-text-editor'", "import { RichTextEditor } from '@/components/rich-text-editor'\nimport { supabase } from '@/lib/supabase'");
}

// 1. Revert compressAndUpload to use direct supabase upload
const oldCompressAndUploadRegex = /const compressAndUpload = async \([\s\S]*?return await res\.json\(\)\n  \}/;
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
    
    const { data, error } = await supabase.storage
      .from('listing-images')
      .upload(\`\${folder}/\${Date.now()}_\${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}\`, fileToUpload, { cacheControl: '3600', upsert: false });

    if (error) {
      console.error('Upload error:', error);
      alert('Image upload failed: ' + error.message);
      throw new Error('Upload failed');
    }
    const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(data.path);
    return { url: urlData.publicUrl };
  }`;

content = content.replace(oldCompressAndUploadRegex, newCompressAndUpload);

// 2. Fix submitListing and submitBanner error logging
const submitListingRegex = /if \(res\.ok\) \{[\s\S]*?toast\.error\('Something went wrong'\)/;
const newSubmitListingBody = `if (res.ok) {
        alert('Listing published successfully!')
        toast.success('Listing created successfully!')
        setIsCreatingListing(false)
        fetchListings()
        setFormData({
          name: '', category: '', description: '', phoneNumber: '', whatsappNumber: '', cityId: '', sameAsPhone: false, address: '',
          coverImage: '', logoUrl: '', gallery: [], instagramUrl: '', facebookUrl: '', youtubeUrl: ''
        })
      } else {
        const errData = await res.text();
        console.error('Submit API error response:', errData);
        alert('Failed to publish. Check console.')
        toast.error('Failed to create listing')
      }
    } catch (err) {
      console.error('Submit error:', err)
      alert('Failed to publish. Check console.')
      toast.error('Something went wrong')`;

content = content.replace(submitListingRegex, newSubmitListingBody);

const submitBannerRegex = /if \(res\.ok\) \{[\s\S]*?toast\.error\('Failed to create banner'\)\n\s*\}\n\s*\} catch \{/g;
const newSubmitBannerBody = `if (res.ok) {
        toast.success('Banner created successfully!')
        setIsCreatingBanner(false)
        fetchBanners()
      } else {
        const errData = await res.text();
        console.error('Banner submit API error response:', errData);
        toast.error('Failed to create banner')
      }
    } catch (err) {
      console.error('Submit banner error:', err);`;
content = content.replace(submitBannerRegex, newSubmitBannerBody);

fs.writeFileSync('src/components/dashboard-view.tsx', content, 'utf-8');
console.log('Patched dashboard-view.tsx for direct upload');
