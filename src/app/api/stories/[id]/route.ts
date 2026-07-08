export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const story = await db.story.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true, subscriptionTier: true }
        },
        city: {
          select: { id: true, name: true, slug: true }
        },
        music: {
          select: { id: true, name: true, audioUrl: true, artist: true }
        }
      }
    })
    return NextResponse.json(story)
  } catch (error) {
    console.error('Error fetching story:', error)
    return NextResponse.json({ error: 'Failed to fetch story' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, userId, fullName, avatarUrl, text } = body

    if (!action || !userId) {
      return NextResponse.json({ error: 'Missing action or userId' }, { status: 400 })
    }

    // Fetch the story first to check owner
    const story = await db.story.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    if (action === 'view') {
      // ONLY increment views if the viewer is NOT the owner
      if (userId !== story.userId) {
        // Prepare viewer info
        const existingViewers = Array.isArray(story.viewers) ? story.viewers : []
        const alreadyViewed = existingViewers.some((v: any) => v.userId === userId)
        
        let updateData: any = {
          views: { increment: 1 },
          viewsCount: { increment: 1 }
        }

        if (!alreadyViewed) {
          const newViewer = {
            userId,
            fullName: fullName || 'Anonymous',
            avatarUrl: avatarUrl || null,
            timestamp: new Date().toISOString()
          }
          updateData.viewers = [...existingViewers, newViewer]
        }

        const updated = await db.story.update({
          where: { id },
          data: updateData
        })
        return NextResponse.json(updated)
      } else {
        // Viewer is the owner, return the story without incrementing views
        return NextResponse.json(story)
      }
    }

    if (action === 'like') {
      const updated = await db.story.update({
        where: { id },
        data: {
          likes: { increment: 1 }
        }
      })
      return NextResponse.json(updated)
    }

    if (action === 'reply') {
      if (!text) {
        return NextResponse.json({ error: 'Reply text is required' }, { status: 400 })
      }

      const existingReplies = Array.isArray(story.replies) ? story.replies : []
      const newReply = {
        userId,
        fullName: fullName || 'Anonymous',
        avatarUrl: avatarUrl || null,
        text,
        timestamp: new Date().toISOString()
      }

      const updated = await db.story.update({
        where: { id },
        data: {
          replies: [...existingReplies, newReply]
        }
      })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in story action API:', error)
    return NextResponse.json({ error: 'Failed to process story action' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.story.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting story:', error)
    return NextResponse.json({ error: 'Failed to delete story' }, { status: 500 })
  }
}
