export const revalidate = 60;
import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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
  };
  try {
    const body = await request.json()
    const { userId, cityId, listings } = body

    if (!userId || !cityId || !Array.isArray(listings) || listings.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields or empty listings array.' },
        { status: 400 }
      )
    }

    const createdListings: any[] = []

    for (const item of listings) {
      if (!item.name || !item.category) continue

      const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7)
      const sanitizedName = String(item.name).trim().slice(0, 200)
      const sanitizedCategory = String(item.category).trim().slice(0, 100)

      let logoUrl = null;
      if (item.imageUrl) {
        logoUrl = await fetchAndUploadImage(item.imageUrl, 'logos') || item.imageUrl;
      }
      let coverImage = null;
      if (item.coverUrl) {
        coverImage = await fetchAndUploadImage(item.coverUrl, 'covers') || item.coverUrl;
      }
      let finalGallery: string[] = [];
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
          images: finalGallery.length > 0 ? JSON.stringify(finalGallery) : null,
          isApproved: true,
          status: 'APPROVED',
          isPremium: false,
          isFeatured: false,
          
          // Optional real estate fields or others passed from CSV
          // (Commented out because these might not exist in the base schema natively yet)
          // price: item.price || null,
          // bedroomCount: item.bedroomCount ? parseInt(item.bedroomCount, 10) : null,
          // area: item.area || null,
        }
      })
      createdListings.push(newListing)
    }

    return NextResponse.json({ success: true, count: createdListings.length }, { status: 201 })
  } catch (error) {
    console.error('Error in bulk listing creation:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk upload' },
      { status: 500 }
    )
  }
}
