export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/city/resolve
 *
 * Resolves the current city based on the subdomain from middleware headers.
 * The middleware sets x-city-subdomain header, which we use to look up the city.
 *
 * This is the SINGLE SOURCE OF TRUTH for "which city is this request for?"
 * All frontend components and API routes should use this to get the cityId.
 */
export async function GET(request: NextRequest) {
  try {
    // Middleware sets x-city-slug (not x-city-subdomain)
    const subdomain = request.headers.get('x-city-slug')

    if (!subdomain) {
      return NextResponse.json(
        { error: 'No city subdomain detected', city: null },
        { status: 404 }
      )
    }

    const city = await db.city.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        state: true,
        brandName: true,
        logoUrl: true,
        heroImageUrl: true,
        primaryColor: true,
        secondaryColor: true,
        latitude: true,
        longitude: true,
      },
    })

    if (!city) {
      // Invalid subdomain — client should redirect to root domain
      return NextResponse.json(
        { error: 'City not found', city: null, invalidSubdomain: true },
        { status: 404 }
      )
    }

    return NextResponse.json({ city })
  } catch (error) {
    console.error('Error resolving city:', error)
    return NextResponse.json(
      { error: 'Failed to resolve city', city: null },
      { status: 500 }
    )
  }
}
