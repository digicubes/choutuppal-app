import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { followerId } = await req.json()
    const followingId = params.id

    if (!followerId || !followingId) {
      return NextResponse.json({ error: 'Missing ids' }, { status: 400 })
    }

    if (followerId === followingId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    const follow = await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      },
      update: {},
      create: {
        followerId,
        followingId
      }
    })

    return NextResponse.json(follow)
  } catch (error) {
    console.error('Error following user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const followerId = searchParams.get('followerId')
    const followingId = params.id

    if (!followerId || !followingId) {
      return NextResponse.json({ error: 'Missing ids' }, { status: 400 })
    }

    await prisma.follow.deleteMany({
      where: {
        followerId,
        followingId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unfollowing user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
