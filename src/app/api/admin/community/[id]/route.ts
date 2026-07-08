import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if post exists
    const post = await db.post.findUnique({
      where: { id }
    })
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    
    // Delete the post (or mark as deleted based on schema)
    // Since there's an isDeleted flag, let's update it
    await db.post.update({
      where: { id },
      data: { isDeleted: true }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting admin post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
