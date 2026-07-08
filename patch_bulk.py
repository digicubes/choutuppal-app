import re

with open('src/app/api/listings/bulk/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

import_statement = """import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase'"""
content = content.replace("import { db } from '@/lib/db'", import_statement)

upload_helper = """export async function POST(request: Request) {
  const fetchAndUploadImage = async (url: string, pathPrefix: string) => {
    try {
      if (!url || !url.startsWith('http')) return null;
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      
      const { data, error } = await supabase.storage.from('listing-images').upload(`${pathPrefix}/${fileName}`, buffer, {
        contentType: blob.type || 'image/jpeg'
      });
      
      if (error) {
        console.error('Upload error:', error);
        return null;
      }
      const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(`${pathPrefix}/${fileName}`);
      return publicUrl;
    } catch (e) {
      console.error('Fetch image error:', e);
      return null;
    }
  };"""
content = content.replace("export async function POST(request: Request) {", upload_helper)

data_insertion_match = """      const newListing = await db.listing.create({
        data: {
          userId,
          cityId,
          slug,
          name: sanitizedName,
          category: sanitizedCategory,
          description: item.description || null,
          phoneNumber: item.phoneNumber || null,
          whatsappNumber: item.whatsappNumber || null,
          address: item.address || null,
          latitude: item.latitude ? parseFloat(item.latitude) : null,
          longitude: item.longitude ? parseFloat(item.longitude) : null,
          
          isApproved: true,
          status: 'APPROVED',
          isPremium: false,
          isFeatured: false,"""

data_insertion_replace = """      let logoUrl = null;
      if (item.imageUrl) {
        logoUrl = await fetchAndUploadImage(item.imageUrl, 'logos') || item.imageUrl;
      }
      let coverImage = null;
      if (item.coverUrl) {
        coverImage = await fetchAndUploadImage(item.coverUrl, 'covers') || item.coverUrl;
      }
      let finalGallery = [];
      if (item.galleryUrls) {
        const urls = item.galleryUrls.split(',').map((u: string) => u.trim()).filter(Boolean);
        for (const u of urls) {
          const uploaded = await fetchAndUploadImage(u, 'gallery');
          if (uploaded) finalGallery.push(uploaded);
          else finalGallery.push(u);
        }
      }

      const newListing = await db.listing.create({
        data: {
          userId,
          cityId,
          slug,
          name: sanitizedName,
          category: sanitizedCategory,
          description: item.description || null,
          phoneNumber: item.phoneNumber || null,
          whatsappNumber: item.whatsappNumber || null,
          address: item.address || null,
          latitude: item.latitude ? parseFloat(item.latitude) : null,
          longitude: item.longitude ? parseFloat(item.longitude) : null,
          logoUrl,
          coverImage,
          gallery: finalGallery.length > 0 ? JSON.stringify(finalGallery) : null,
          isApproved: true,
          status: 'APPROVED',
          isPremium: false,
          isFeatured: false,"""

content = content.replace(data_insertion_match, data_insertion_replace)

with open('src/app/api/listings/bulk/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print('Patch applied')
