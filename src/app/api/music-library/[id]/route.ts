export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// PATCH - Update a music track
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const { title, artist, audioUrl, coverUrl, duration, isActive, category } = body
    const allowedFields = { title, artist, audioUrl, coverUrl, duration, isActive, category }
    const data = Object.fromEntries(Object.entries(allowedFields).filter(([_, v]) => v !== undefined))

    const track = await db.musicLibrary.update({
      where: { id },
      data,
    })
    return NextResponse.json(track)
  } catch (error) {
    console.error('Error updating music track:', error)
    return NextResponse.json({ error: 'Failed to update music track' }, { status: 500 })
  }
}

// DELETE - Remove a music track
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.musicLibrary.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting music track:', error)
    return NextResponse.json({ error: 'Failed to delete music track' }, { status: 500 })
  }
}
