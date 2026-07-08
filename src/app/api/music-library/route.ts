export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/music-library - List all active royalty-free music tracks
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const genre = searchParams.get('genre')
    const all = searchParams.get('all')

    const where: Record<string, unknown> = {}

    // Only filter by isActive if not requesting all tracks (admin mode)
    if (all !== 'true') {
      where.isActive = true
    }

    if (search) {
      where.name = { contains: search }
    }
    if (genre) {
      where.genre = genre
    }

    const tracks = await db.musicLibrary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tracks)
  } catch (error) {
    console.error('Error fetching music library:', error)
    return NextResponse.json([])
  }
}

// POST /api/music-library - Add a new royalty-free track (Admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, artist, audioUrl, genre, duration, isRoyaltyFreeConfirmed, adminUserId } = body

    // RBAC: Verify admin user
    if (adminUserId) {
      const adminUser = await db.user.findUnique({
        where: { id: adminUserId },
        select: { role: true },
      })
      if (!adminUser || !['super_admin', 'city_admin'].includes(adminUser.role)) {
        return NextResponse.json(
          { error: 'Only admins can upload music tracks' },
          { status: 403 }
        )
      }
    }

    // COPYRIGHT PROTECTION: Admin MUST confirm the audio is royalty-free
    if (!isRoyaltyFreeConfirmed) {
      return NextResponse.json(
        { error: 'You must confirm this audio is royalty-free and safe for commercial use.' },
        { status: 400 }
      )
    }

    if (!name || !audioUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: name, audioUrl' },
        { status: 400 }
      )
    }

    const track = await db.musicLibrary.create({
      data: {
        name,
        artist: artist || 'Royalty Free',
        audioUrl,
        genre: genre || 'Telugu',
        duration: duration || 30,
        isActive: true,
      },
    })

    return NextResponse.json(track, { status: 201 })
  } catch (error) {
    console.error('Error creating music track:', error)
    return NextResponse.json({ error: 'Failed to create music track' }, { status: 500 })
  }
}
