import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    if (!q) {
      return NextResponse.json({ users: [] })
    }

    const users = await db.user.findMany({
      where: {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        avatarUrl: true,
        bio: true,
        isPublic: true,
      },
      take: 20
    })

    // Optionally filter out private users if requested
    const publicUsers = users.filter(u => u.isPublic)

    return NextResponse.json({ users: publicUsers })
  } catch (error: any) {
    console.error('Search error', error)
    return NextResponse.json({ users: [] }, { status: 500 })
  }
}
