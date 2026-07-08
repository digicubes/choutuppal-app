export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Support both ID and slug lookup
    const listing = await db.listing.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            avatarUrl: true,
            whatsappNumber: true,
          },
        },
        city: {
          select: { id: true, name: true, slug: true },
        },
        reviews: {
          include: {
            user: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        leads: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { reviews: true, leads: true },
        },
      },
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(listing)
  } catch (error) {
    console.error('Error fetching listing:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existingListing = await db.listing.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    })

    if (!existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const listingId = existingListing.id

    // Delete related records to prevent foreign key constraint violations
    await db.lead.deleteMany({ where: { listingId } })
    await db.review.deleteMany({ where: { listingId } })
    await db.short.deleteMany({ where: { linkedListingId: listingId } })
    await db.claimRequest.deleteMany({ where: { listingId } })

    await db.listing.delete({ where: { id: listingId } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting listing:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete listing' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'name', 'category', 'description', 'services', 'images',
      'coverImage', 'logoUrl', 'gallery', 'instagramUrl', 'instagramUsername', 'facebookUrl', 'youtubeUrl',
      'phoneNumber', 'whatsappNumber', 'secondaryPhone', 'address', 'ownerName', 'establishedYear', 'latitude', 'longitude',
      'isPremium', 'isFeatured', 'operatingHours',
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'services' && typeof body[field] !== 'string') {
          updateData[field] = JSON.stringify(body[field])
        } else if (field === 'images' || field === 'gallery') {
          // Handled separately below to sync both database fields
        } else {
          updateData[field] = body[field]
        }
      }
    }

    const rawGallery = body.gallery !== undefined ? body.gallery : (body.images !== undefined ? body.images : body.galleryUrls);
    if (rawGallery !== undefined) {
      const galleryString = rawGallery === null ? null : (typeof rawGallery === 'string' ? rawGallery : JSON.stringify(rawGallery));
      updateData.images = galleryString;
      updateData.gallery = galleryString;
    }

    // Support both ID and slug lookup
    const existingListing = await db.listing.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true, userId: true },
    })
    if (!existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Ownership check: only the owner or an admin can update
    if (body.userId && body.userId !== existingListing.userId && !body.adminUserId) {
      return NextResponse.json({ error: 'Forbidden: not the listing owner' }, { status: 403 })
    }

    const listing = await db.listing.update({
      where: { id: existingListing.id },
      data: updateData,
      include: {
        user: {
          select: { id: true, fullName: true, phone: true },
        },
        city: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    return NextResponse.json(listing)
  } catch (error) {
    console.error('Error updating listing:', error)
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Increment views count
    if (body.action === 'incrementViews') {
      // Support both ID and slug lookup
      const existingListing = await db.listing.findFirst({
        where: { OR: [{ id }, { slug: id }] },
        select: { id: true },
      })
      if (!existingListing) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
      }
      const listing = await db.listing.update({
        where: { id: existingListing.id },
        data: { viewsCount: { increment: 1 } },
      })
      return NextResponse.json({ viewsCount: listing.viewsCount })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error patching listing:', error)
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    )
  }
}
