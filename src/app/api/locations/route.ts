export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/locations — List locations with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')
    const district = searchParams.get('district')
    const city = searchParams.get('city')

    const where: Record<string, unknown> = {}
    if (state) where.state = state
    if (district) where.district = district
    if (city) where.city = city

    const locations = await db.location.findMany({
      where,
      orderBy: [{ state: 'asc' }, { district: 'asc' }, { city: 'asc' }],
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

// POST /api/locations — Create a new location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { state, district, city, mandal, pincode, latitude, longitude } = body

    if (!state || !district || !city) {
      return NextResponse.json(
        { error: 'state, district, and city are required' },
        { status: 400 }
      )
    }

    const location = await db.location.create({
      data: {
        state,
        district,
        city,
        mandal: mandal || null,
        pincode: pincode || null,
        latitude: latitude ? parseFloat(latitude) : 0,
        longitude: longitude ? parseFloat(longitude) : 0,
      },
    })

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
}

// PUT /api/locations — Update a location
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, state, district, city, mandal, pincode, latitude, longitude } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    // Check if location exists
    const existing = await db.location.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    const data: Record<string, unknown> = {}
    if (state !== undefined) data.state = state
    if (district !== undefined) data.district = district
    if (city !== undefined) data.city = city
    if (mandal !== undefined) data.mandal = mandal
    if (pincode !== undefined) data.pincode = pincode
    if (latitude !== undefined) data.latitude = parseFloat(latitude)
    if (longitude !== undefined) data.longitude = parseFloat(longitude)

    const updated = await db.location.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}

// DELETE /api/locations — Delete a location by id
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      )
    }

    // Check if location exists
    const existing = await db.location.findUnique({
      where: { id },
      include: {
        users: { select: { id: true } },
        cities: { select: { id: true } },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    if (existing.users.length > 0 || existing.cities.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete location: it is referenced by users or cities' },
        { status: 400 }
      )
    }

    await db.location.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Location deleted' })
  } catch (error) {
    console.error('Error deleting location:', error)
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    )
  }
}
