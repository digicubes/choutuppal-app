export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/long-videos/[id] — Get single video with playlist and category info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const video = await db.longVideo.findUnique({
      where: { id },
      include: {
        playlist: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            isPremium: true,
            isFeatured: true,
            creator: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                iconUrl: true,
              },
            },
          },
        },
      },
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Increment views count (fire-and-forget style, non-blocking)
    await db.longVideo.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    })

    // Return video with incremented view (add 1 to reflect the current view)
    return NextResponse.json({
      ...video,
      viewsCount: video.viewsCount + 1,
    })
  } catch (error) {
    console.error('Error fetching long video:', error)
    return NextResponse.json(
      { error: 'Failed to fetch long video' },
      { status: 500 }
    )
  }
}

// PATCH /api/long-videos/[id] — Update video
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Verify video exists
    const existingVideo = await db.longVideo.findUnique({ where: { id } })
    if (!existingVideo) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Build update data — only include provided fields
    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.youtubeVideoId !== undefined) data.youtubeVideoId = body.youtubeVideoId
    if (body.thumbnailUrl !== undefined) data.thumbnailUrl = body.thumbnailUrl
    if (body.duration !== undefined) data.duration = body.duration
    if (body.isPublished !== undefined) data.isPublished = body.isPublished
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder
    if (body.playlistId !== undefined) {
      // Verify new playlist exists
      const playlist = await db.videoPlaylist.findUnique({ where: { id: body.playlistId } })
      if (!playlist) {
        return NextResponse.json(
          { error: 'Playlist not found' },
          { status: 404 }
        )
      }
      data.playlistId = body.playlistId
    }

    const updatedVideo = await db.longVideo.update({
      where: { id },
      data,
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

    return NextResponse.json(updatedVideo)
  } catch (error) {
    console.error('Error updating long video:', error)
    return NextResponse.json(
      { error: 'Failed to update long video' },
      { status: 500 }
    )
  }
}

// DELETE /api/long-videos/[id] — Delete video
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify video exists
    const existingVideo = await db.longVideo.findUnique({ where: { id } })
    if (!existingVideo) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Delete the video (progress records will need cleanup)
    await db.longVideo.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Video deleted successfully' })
  } catch (error) {
    console.error('Error deleting long video:', error)
    return NextResponse.json(
      { error: 'Failed to delete long video' },
      { status: 500 }
    )
  }
}
