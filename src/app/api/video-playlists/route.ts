export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/video-playlists — List playlists with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const isPremium = searchParams.get('isPremium')
    const isFeatured = searchParams.get('isFeatured')

    // Build where clause
    const where: Record<string, unknown> = {}

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (isPremium !== null) {
      where.isPremium = isPremium === 'true'
    }

    if (isFeatured !== null) {
      where.isFeatured = isFeatured === 'true'
    }

    const playlists = await db.videoPlaylist.findMany({
      where,
      include: {
        category: true,
        creator: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { videos: true },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(playlists)
  } catch (error) {
    console.error('Error fetching video playlists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video playlists' },
      { status: 500 }
    )
  }
}

// POST /api/video-playlists — Create a new playlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { categoryId, title, description, thumbnailUrl, creatorId, isPremium } = body

    // Validate required fields
    if (!categoryId || !title || !creatorId) {
      return NextResponse.json(
        { error: 'categoryId, title, and creatorId are required' },
        { status: 400 }
      )
    }

    // Verify category exists
    const category = await db.videoCategory.findUnique({ where: { id: categoryId } })
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Verify creator exists
    const creator = await db.user.findUnique({ where: { id: creatorId } })
    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    const playlist = await db.videoPlaylist.create({
      data: {
        categoryId,
        title,
        description: description || null,
        thumbnailUrl: thumbnailUrl || null,
        creatorId,
        isPremium: isPremium ?? false,
      },
      include: {
        category: true,
        creator: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { videos: true },
        },
      },
    })

    return NextResponse.json(playlist, { status: 201 })
  } catch (error) {
    console.error('Error creating video playlist:', error)
    return NextResponse.json(
      { error: 'Failed to create video playlist' },
      { status: 500 }
    )
  }
}
