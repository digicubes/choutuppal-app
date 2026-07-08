
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

async function generateUniqueRealEstateSlug(baseName: string) {
  let slug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  if (!slug) slug = 'property'
  
  const existing = await db.realEstateListing.findUnique({ where: { slug } })
  if (!existing) return slug
  
  return `${slug}-${crypto.randomBytes(3).toString('hex')}`
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get('cityId')
    const userId = searchParams.get('userId')
    const all = searchParams.get('all') === 'true'
    const sort = searchParams.get('sort') // 'newest' | 'popular' | null
    const bhk = searchParams.get('bhk')
    const minPrice = searchParams.get('minPrice') // Note: price is string in schema
    const maxPrice = searchParams.get('maxPrice')

    const where: Record<string, unknown> = {}
    if (!all) where.status = 'APPROVED'
    if (cityId) where.cityId = cityId
    if (userId) where.userId = userId
    if (bhk) where.bedroomCount = parseInt(bhk)
    
    let orderBy: any[] = []
    if (sort === 'newest') {
      orderBy = [{ createdAt: 'desc' }]
    } else {
      orderBy = [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ]
    }

    const listings = await db.realEstateListing.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
        city: { select: { id: true, name: true, slug: true } },
      },
      orderBy,
    })

    return NextResponse.json(listings, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=30'
      }
    })
  } catch (error) {
    console.error('Error fetching real estate listings:', error)
    return NextResponse.json({ error: 'Failed to fetch real estate listings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, price, images, ownerPhone, bedroomCount, area, cityId, userId, description, address, whatsappNumber, listingType } = body

    if (!title || !price || !ownerPhone || !cityId || !userId) {
      return NextResponse.json({ error: 'Missing required fields: title, price, ownerPhone, cityId, userId' }, { status: 400 })
    }

    const slug = await generateUniqueRealEstateSlug(title)

    const listing = await db.realEstateListing.create({
      data: {
        slug,
        title,
        price,
        images: Array.isArray(images) ? JSON.stringify(images) : (images ?? null),
        ownerPhone,
        bedroomCount: bedroomCount ? parseInt(String(bedroomCount)) : null,
        area: area || null,
        address: address || null,
        listingType: listingType || 'Sale',
        cityId,
        userId,
        status: 'PENDING',
        isApproved: false,
      },
    })

    return NextResponse.json(listing, { status: 201 })
  } catch (error) {
    console.error('Error creating real estate listing:', error)
    return NextResponse.json({ error: 'Failed to create real estate listing' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, title, price, images, ownerPhone, bedroomCount, area, cityId, address, listingType } = body

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const existing = await db.realEstateListing.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (price !== undefined) updateData.price = price
    if (images !== undefined) updateData.images = Array.isArray(images) ? JSON.stringify(images) : (images ?? null)
    if (ownerPhone !== undefined) updateData.ownerPhone = ownerPhone
    if (bedroomCount !== undefined) updateData.bedroomCount = bedroomCount ? parseInt(String(bedroomCount)) : null
    if (area !== undefined) updateData.area = area || null
    if (listingType !== undefined) updateData.listingType = listingType
    if (cityId !== undefined) updateData.cityId = cityId
    if (address !== undefined) updateData.address = address || null

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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await db.realEstateListing.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting real estate listing:', error)
    return NextResponse.json({ error: 'Failed to delete real estate listing' }, { status: 500 })
  }
}
