import { Metadata } from 'next'
import { db } from '@/lib/db'
import ListingView from '@/components/listing-view'

async function getListing(id: string) {
  try {
    return await db.listing.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    })
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: { id: string } | Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  let listing: any = null
  try {
    listing = await db.listing.findFirst({
      where: { OR: [{ id: resolvedParams.id }, { slug: resolvedParams.id }] }
    })
  } catch (error) {
    console.error('Error fetching listing for metadata:', error);
  }

  if (!listing) return { title: 'Listing Not Found' }

  const title = `${listing.name} in Choutuppal | Choutuppal App`
  const description = listing.description?.replace(/<[^>]*>?/gm, '').substring(0, 160) || `Check out ${listing.name} on Choutuppal App`
  
  let firstGalleryImage = null;
  try {
    if (listing.images && typeof listing.images === 'string') {
      const parsed = JSON.parse(listing.images);
      if (Array.isArray(parsed) && parsed.length > 0) {
        firstGalleryImage = parsed[0];
      }
    }
  } catch {}

  const rawImage = listing.coverImage || listing.logoUrl || '/og-default.png'
  const absoluteImageUrl = rawImage.startsWith('/') 
    ? `https://choutuppal.in${rawImage}` 
    : rawImage

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: absoluteImageUrl, width: 1200, height: 630 }],
      type: 'website',
      url: `https://choutuppal.in/listing/${resolvedParams.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: absoluteImageUrl, width: 1200, height: 630 }],
    }
  }
}

export default function ListingDetailPage() {
  return <ListingView />
}
