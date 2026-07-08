import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.log('GET /admin/youtube-channels - Auth Error:', error?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    console.log('GET /admin/youtube-channels - User role:', dbUser?.role)

    if (!dbUser || !['admin', 'super_admin', 'city_admin'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const channels = await prisma.youtubeChannel.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ channels })
  } catch (error) {
    console.error('Error fetching youtube channels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.log('POST /admin/youtube-channels - Auth Error:', error?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    console.log('POST /admin/youtube-channels - User role:', dbUser?.role)

    if (!dbUser || !['admin', 'super_admin', 'city_admin'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { channelId, channelName } = body

    if (!channelId || !channelName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const channel = await prisma.youtubeChannel.create({
      data: {
        channelId,
        channelName,
        userId: user.id
      }
    })

    return NextResponse.json({ channel })
  } catch (error: any) {
    console.error('Error adding youtube channel:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Channel ID already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.log('DELETE /admin/youtube-channels - Auth Error:', error?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    console.log('DELETE /admin/youtube-channels - User role:', dbUser?.role)

    if (!dbUser || !['admin', 'super_admin', 'city_admin'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing channel ID' }, { status: 400 })
    }

    await prisma.youtubeChannel.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting youtube channel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
