export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/long-videos — List videos with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playlistId = searchParams.get('playlistId')
    const isPublished = searchParams.get('isPublished')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Build where clause
    const where: Record<string, unknown> = {}

    if (playlistId) {
      where.playlistId = playlistId
    }

    if (isPublished !== null) {
      where.isPublished = isPublished === 'true'
    }

    // Calculate pagination offset
    const skip = (page - 1) * limit

    // Fetch videos and total count in parallel
    const [videos, total] = await Promise.all([
      db.longVideo.findMany({
        where,
        include: {
          playlist: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      db.longVideo.count({ where }),
    ])

    return NextResponse.json({
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching long videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch long videos' },
      { status: 500 }
    )
  }
}

// POST /api/long-videos — Create a new video
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playlistId, title, description, youtubeVideoId, thumbnailUrl, duration, isPublished } = body

    // Validate required fields
    if (!playlistId || !title || !youtubeVideoId) {
      return NextResponse.json(
        { error: 'playlistId, title, and youtubeVideoId are required' },
        { status: 400 }
      )
    }

    // Verify playlist exists
    const playlist = await db.videoPlaylist.findUnique({
      where: { id: playlistId },
      include: { category: true },
    })
    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      )
    }

    const video = await db.longVideo.create({
      data: {
        playlistId,
        title,
        description: description || null,
        youtubeVideoId,
        thumbnailUrl: thumbnailUrl || null,
        duration: duration || null,
        isPublished: isPublished ?? true,
      },
      include: {
        playlist: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(video, { status: 201 })
  } catch (error) {
    console.error('Error creating long video:', error)
    return NextResponse.json(
      { error: 'Failed to create long video' },
      { status: 500 }
    )
  }
}
