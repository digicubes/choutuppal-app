import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const allUsers = await prisma.user.findMany({
      where: {
        isPublic: true
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        bio: true,
      },
      take: 100,
      orderBy: {
        createdAt: 'desc',
      }
    })

    return NextResponse.json(allUsers)
  } catch (error) {
    console.error('Error fetching community users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
