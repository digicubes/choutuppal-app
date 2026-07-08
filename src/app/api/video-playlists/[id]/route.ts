export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/video-playlists/[id] — Get single playlist with all videos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const playlist = await db.videoPlaylist.findUnique({
      where: { id },
      include: {
        category: true,
        creator: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        videos: {
          orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'desc' },
          ],
        },
        _count: {
          select: { videos: true },
        },
      },
    })

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(playlist)
  } catch (error) {
    console.error('Error fetching video playlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video playlist' },
      { status: 500 }
    )
  }
}

// PATCH /api/video-playlists/[id] — Update playlist (feature, approve, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Verify playlist exists
    const existingPlaylist = await db.videoPlaylist.findUnique({ where: { id } })
    if (!existingPlaylist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      )
    }

    // Build update data — only include provided fields
    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.thumbnailUrl !== undefined) data.thumbnailUrl = body.thumbnailUrl
    if (body.isPremium !== undefined) data.isPremium = body.isPremium
    if (body.isFeatured !== undefined) data.isFeatured = body.isFeatured
    if (body.isApproved !== undefined) data.isApproved = body.isApproved
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder
    if (body.categoryId !== undefined) {
      // Verify new category exists
      const category = await db.videoCategory.findUnique({ where: { id: body.categoryId } })
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
      data.categoryId = body.categoryId
    }

    const updatedPlaylist = await db.videoPlaylist.update({
      where: { id },
      data,
      include: {
        category: true,
        creator: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        videos: {
          orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'desc' },
          ],
        },
        _count: {
          select: { videos: true },
        },
      },
    })

    return NextResponse.json(updatedPlaylist)
  } catch (error) {
    console.error('Error updating video playlist:', error)
    return NextResponse.json(
      { error: 'Failed to update video playlist' },
      { status: 500 }
    )
  }
}

// DELETE /api/video-playlists/[id] — Delete playlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify playlist exists
    const existingPlaylist = await db.videoPlaylist.findUnique({ where: { id } })
    if (!existingPlaylist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      )
    }

    // Delete the playlist (cascading will handle related videos)
    await db.videoPlaylist.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Playlist deleted successfully' })
  } catch (error) {
    console.error('Error deleting video playlist:', error)
    return NextResponse.json(
      { error: 'Failed to delete video playlist' },
      { status: 500 }
    )
  }
}
