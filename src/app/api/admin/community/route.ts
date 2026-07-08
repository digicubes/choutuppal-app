import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const posts = await db.post.findMany({
      where: { isDeleted: false },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching admin posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}
