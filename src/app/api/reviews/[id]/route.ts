import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const { id } = params
    
    // In a real app we'd verify the token
    const review = await db.review.findUnique({
      where: { id }
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    await db.review.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete review error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
