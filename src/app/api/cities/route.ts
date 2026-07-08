export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/cities — List all cities
export async function GET() {
  try {
    const cities = await db.city.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { listings: true, users: true },
        },
      },
    })
    return NextResponse.json(cities)
  } catch (error) {
    console.error('Error fetching cities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    )
  }
}

// POST /api/cities — Create a new city
export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.name || !body.slug || !body.subdomain) {
      return NextResponse.json(
        { error: 'name, slug, and subdomain are required' },
        { status: 400 }
      )
    }

    const city = await db.city.create({
      data: {
        name: body.name,
        slug: body.slug,
        subdomain: body.subdomain,
        state: body.state || 'Telangana',
        brandName: body.brandName || 'Choutuppal App',
        logoUrl: body.logoUrl || null,
        heroImageUrl: body.heroImageUrl || null,
        primaryColor: body.primaryColor || '#4169E1',
        secondaryColor: body.secondaryColor || '#D4AF37',
        latitude: body.latitude ?? 17.2985,
        longitude: body.longitude ?? 78.9256,
      },
    })

    return NextResponse.json(city, { status: 201 })
  } catch (error) {
    console.error('Error creating city:', error)
    return NextResponse.json(
      { error: 'Failed to create city' },
      { status: 500 }
    )
  }
}

// PUT /api/cities?id=xxx — Update a city
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Verify city exists
    const existingCity = await db.city.findUnique({ where: { id } })
    if (!existingCity) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      )
    }

    // Build update data
    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = body.name
    if (body.slug !== undefined) data.slug = body.slug
    if (body.subdomain !== undefined) data.subdomain = body.subdomain
    if (body.state !== undefined) data.state = body.state
    if (body.brandName !== undefined) data.brandName = body.brandName
    if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl
    if (body.heroImageUrl !== undefined) data.heroImageUrl = body.heroImageUrl
    if (body.primaryColor !== undefined) data.primaryColor = body.primaryColor
    if (body.secondaryColor !== undefined) data.secondaryColor = body.secondaryColor
    if (body.latitude !== undefined) data.latitude = body.latitude
    if (body.longitude !== undefined) data.longitude = body.longitude

    const updatedCity = await db.city.update({
      where: { id },
      data,
    })

    // When primaryColor or secondaryColor changes, update SiteSetting to match
    const colorChanged =
      (body.primaryColor !== undefined && body.primaryColor !== existingCity.primaryColor) ||
      (body.secondaryColor !== undefined && body.secondaryColor !== existingCity.secondaryColor)

    if (colorChanged) {
      // Find or create the first SiteSetting (singleton pattern)
      const siteSetting = await db.siteSetting.findFirst()

      if (siteSetting) {
        const settingData: Record<string, unknown> = {}
        if (body.primaryColor !== undefined) {
          settingData.primaryColor = body.primaryColor
        }
        if (body.secondaryColor !== undefined) {
          settingData.accentColor = body.secondaryColor
        }

        await db.siteSetting.update({
          where: { id: siteSetting.id },
          data: settingData,
        })
      }
    }

    return NextResponse.json(updatedCity)
  } catch (error) {
    console.error('Error updating city:', error)
    return NextResponse.json(
      { error: 'Failed to update city' },
      { status: 500 }
    )
  }
}

// DELETE /api/cities?id=xxx — Delete a city
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    await db.city.delete({ where: { id } })

    return NextResponse.json({ message: 'City deleted successfully' })
  } catch (error) {
    console.error('Error deleting city:', error)
    return NextResponse.json(
      { error: 'Failed to delete city' },
      { status: 500 }
    )
  }
}
