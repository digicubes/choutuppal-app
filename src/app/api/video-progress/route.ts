export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/video-progress — Get user's video progress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const videoId = searchParams.get('videoId')

    // userId is required
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // If videoId is provided, return progress for a specific video
    if (videoId) {
      const progress = await db.videoProgress.findUnique({
        where: {
          userId_videoId: { userId, videoId },
        },
        include: {
          video: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              duration: true,
              playlist: {
                select: {
                  id: true,
                  title: true,
                  category: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (!progress) {
        return NextResponse.json(
          { error: 'No progress found for this video' },
          { status: 404 }
        )
      }

      return NextResponse.json(progress)
    }

    // Otherwise, return all progress records for the user
    const progressList = await db.videoProgress.findMany({
      where: { userId },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            duration: true,
            youtubeVideoId: true,
            playlist: {
              select: {
                id: true,
                title: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(progressList)
  } catch (error) {
    console.error('Error fetching video progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video progress' },
      { status: 500 }
    )
  }
}

// POST /api/video-progress — Update video progress (upsert)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, videoId, timestamp, completed } = body

    // Validate required fields
    if (!userId || !videoId) {
      return NextResponse.json(
        { error: 'userId and videoId are required' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify video exists
    const video = await db.longVideo.findUnique({ where: { id: videoId } })
    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Upsert progress record — create if not exists, update if exists
    const progress = await db.videoProgress.upsert({
      where: {
        userId_videoId: { userId, videoId },
      },
      update: {
        // Only update timestamp if provided and greater than current
        ...(timestamp !== undefined && { timestamp }),
        // Only mark completed if explicitly set
        ...(completed !== undefined && { completed }),
      },
      create: {
        userId,
        videoId,
        timestamp: timestamp ?? 0,
        completed: completed ?? false,
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            duration: true,
          },
        },
      },
    })

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Error updating video progress:', error)
    return NextResponse.json(
      { error: 'Failed to update video progress' },
      { status: 500 }
    )
  }
}
