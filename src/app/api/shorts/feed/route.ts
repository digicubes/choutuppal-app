import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET() {
  try {
    const shorts = await prisma.shortVideo.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 20,
      include: {
        channel: true
      }
    })

    return NextResponse.json({ shorts })
  } catch (error) {
    console.error('Error fetching shorts feed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
