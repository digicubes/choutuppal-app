import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if review exists
    const review = await db.review.findUnique({
      where: { id }
    })
    
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }
    
    // Hard delete the review
    await db.review.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting admin review:', error)
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
  }
}
