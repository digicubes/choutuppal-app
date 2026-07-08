export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/announcements — Fetch active announcements (for ticker)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') !== 'false'
    const citySlug = searchParams.get('citySlug') || null

    // Build filter: always match global (no citySlug) + optionally match specific city
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (activeOnly) where.isActive = true
    if (citySlug) {
      // Return announcements that are global (null) OR match the requested city
      where.OR = [{ citySlug: null }, { citySlug }]
    }

    const announcements = await db.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json([])
  }
}

// POST /api/announcements — Create a new announcement
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { text, isActive, citySlug } = body

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Announcement text is required' }, { status: 400 })
    }

    const announcement = await db.announcement.create({
      data: {
        text: text.trim(),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        citySlug: citySlug || null,
      },
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}

// PUT /api/announcements — Update an announcement
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, text, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 })
    }

    const existing = await db.announcement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (text !== undefined) updateData.text = text.trim()
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    const updated = await db.announcement.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating announcement:', error)
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
  }
}

// DELETE /api/announcements — Delete an announcement
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 })
    }

    const existing = await db.announcement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    await db.announcement.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
  }
}
