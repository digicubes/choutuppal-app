import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const reviews = await db.review.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          }
        },
        listing: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching admin reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
