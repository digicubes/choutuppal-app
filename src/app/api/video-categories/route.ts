export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/video-categories — List all video categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    // Build where clause — default to active categories only
    const where: Record<string, unknown> = {}
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    } else {
      where.isActive = true // Default: only active categories
    }

    const categories = await db.videoCategory.findMany({
      where,
      include: {
        _count: {
          select: { playlists: true },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching video categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video categories' },
      { status: 500 }
    )
  }
}
