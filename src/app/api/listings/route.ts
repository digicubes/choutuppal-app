export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

async function generateUniqueSlug(baseName: string) {
  let slug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  if (!slug) slug = 'listing'
  
  const existing = await db.listing.findUnique({ where: { slug } })
  if (!existing) return slug
  
  return `${slug}-${crypto.randomBytes(3).toString('hex')}`
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get('cityId')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const isFeatured = searchParams.get('isFeatured')
    const isPremium = searchParams.get('isPremium')
    const minRating = searchParams.get('minRating')
    const villageId = searchParams.get('villageId')
    const subCategoryId = searchParams.get('subCategoryId')
    const sort = searchParams.get('sort') // 'newest' | 'popular' | null
    const openNow = searchParams.get('openNow')
    const userId = searchParams.get('userId')
    const referredByAgentId = searchParams.get('referredByAgentId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    // If userId is provided, show ALL listings (including unapproved) for that user
    // If referredByAgentId is provided, show all listings for that agent (including unapproved)
    // Otherwise, only show approved listings
    if (userId) {
      where.userId = userId
    } else if (referredByAgentId) {
      // Show both approved and pending for agent's referrals
    } else {
      where.status = 'APPROVED'
    }

    if (cityId) {
      where.cityId = cityId
    }
    if (villageId) {
      where.villageId = villageId
    }
    if (category) {
      where.category = category
    }
    if (subCategoryId) {
      where.subCategoryId = subCategoryId
    }
    if (isFeatured === 'true') {
      where.isFeatured = true
    }
    if (isPremium === 'true') {
      where.isPremium = true
    }
    if (referredByAgentId) {
      where.referredByAgentId = referredByAgentId
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } },
      ]
    }
    
    if (minRating) {
      where.rating = { gte: parseFloat(minRating) }
    }
    
    if (openNow === 'true') {
      where.operatingHours = { not: null }
    }

    let orderBy: any[] = []
    if (sort === 'newest') {
      orderBy = [{ createdAt: 'desc' }]
    } else if (sort === 'popular') {
      orderBy = [{ viewsCount: 'desc' }]
    } else {
      orderBy = [
        { isFeatured: 'desc' },
        { isPremium: 'desc' },
        { viewsCount: 'desc' },
      ]
    }

    const [listings, total] = await Promise.all([
      db.listing.findMany({
        where,
        select: {
          id: true,
          slug: true,
          name: true,
          category: true,
          images: true,
          coverImage: true,
          logoUrl: true,
          whatsappNumber: true,
          phoneNumber: true,
          address: true,
          isPremium: true,
          isFeatured: true,
          viewsCount: true,
          rating: true,
          operatingHours: true,
          status: true,
          createdAt: true,
          userId: true,
          cityId: true,
          villageId: true,
          subCategoryId: true,
          user: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              avatarUrl: true,
            },
          },
          city: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { reviews: true, leads: true },
          },
          ...(userId ? {
            reviews: {
              include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
              orderBy: { createdAt: 'desc' as const }
            }
          } : {})
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.listing.count({ where }),
    ])

    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    })
  } catch (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json({
      listings: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.userId || !body.cityId || !body.name || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, cityId, name, category' },
        { status: 400 }
      )
    }
    
    const slug = body.slug || await generateUniqueSlug(body.name)
    // Sanitize string inputs
    const sanitizedName = String(body.name).trim().slice(0, 200)
    const sanitizedCategory = String(body.category).trim().slice(0, 100)
    const sanitizedDescription = body.description ? String(body.description).trim().slice(0, 5000) : null

    const rawGallery = body.gallery !== undefined ? body.gallery : (body.images !== undefined ? body.images : body.galleryUrls);
    let galleryString: string | null = null;
    if (rawGallery) {
      galleryString = typeof rawGallery === 'string' ? rawGallery : JSON.stringify(rawGallery);
    }

    const listing = await db.listing.create({
      data: {
        userId: body.userId,
        cityId: body.cityId,
        slug: slug,
        name: sanitizedName,
        category: sanitizedCategory,
        description: sanitizedDescription,
        services: body.services ? JSON.stringify(body.services) : null,
        images: galleryString,
        coverImage: body.coverImage || null,
        logoUrl: body.logoUrl || null,
        gallery: galleryString,
        instagramUrl: body.instagramUrl || null,
        instagramUsername: body.instagramUsername || null,
        facebookUrl: body.facebookUrl || null,
        youtubeUrl: body.youtubeUrl || null,
        phoneNumber: body.phoneNumber || null,
        whatsappNumber: body.whatsappNumber || null,
        secondaryPhone: body.secondaryPhone || null,
        address: body.address || null,
        ownerName: body.ownerName || null,
        establishedYear: body.establishedYear || null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        isApproved: false,
        status: 'APPROVED',
        isPremium: body.isPremium || false,
        isFeatured: body.isFeatured || false,
        operatingHours: body.operatingHours || null,
        referredByAgentId: body.referredByAgentId || null,
        rating: body.rating ? parseFloat(body.rating) : 5,
        villageId: body.villageId || null,
        subCategoryId: body.subCategoryId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        city: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    return NextResponse.json(listing, { status: 201 })
  } catch (error) {
    console.error('Error creating listing:', error)
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    )
  }
}
