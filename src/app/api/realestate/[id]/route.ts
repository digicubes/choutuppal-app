export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const listing = await db.realEstateListing.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, phone: true } },
        city: { select: { id: true, name: true, slug: true } },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    return NextResponse.json(listing)
  } catch (error) {
    console.error('Error fetching property:', error)
    return NextResponse.json({ error: 'Failed to fetch property' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, price, images, gallery, ownerPhone, bedroomCount, area, cityId, address, isFeatured } = body

    const existing = await db.realEstateListing.findUnique({ where: { id }, select: { id: true, userId: true } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // If a non-admin user is trying to edit, ensure they own it
    if (body.userId && body.userId !== existing.userId && !body.adminUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (price !== undefined) updateData.price = price
    
    const rawImages = images || gallery
    if (rawImages !== undefined) {
      updateData.images = Array.isArray(rawImages) ? JSON.stringify(rawImages) : (rawImages ?? null)
    }
    
    if (ownerPhone !== undefined) updateData.ownerPhone = ownerPhone
    if (bedroomCount !== undefined) updateData.bedroomCount = bedroomCount ? parseInt(String(bedroomCount)) : null
    if (area !== undefined) updateData.area = area || null
    if (cityId !== undefined) updateData.cityId = cityId
    if (address !== undefined) updateData.address = address || null
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured

    const listing = await db.realEstateListing.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(listing)
  } catch (error) {
    console.error('Error updating real estate listing:', error)
    return NextResponse.json({ error: 'Failed to update real estate listing' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.realEstateListing.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting property:', error)
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 })
  }
}
