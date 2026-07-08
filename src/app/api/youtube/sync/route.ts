import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { supabase } from '@/lib/supabase'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

export async function POST(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)
    let requestBody: any = {}
    try {
      requestBody = await req.json()
    } catch (e) {
      // Ignored for empty bodies
    }
    const { channelId } = requestBody

    if (error || !user) {
      console.log('POST /youtube/sync - Auth Error:', error?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    console.log('POST /youtube/sync - User role:', dbUser?.role)

    if (!dbUser || !['admin', 'super_admin', 'city_admin'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API Key is missing in .env')
      return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 })
    }

    const whereClause: any = { isActive: true }
    if (channelId) {
      whereClause.channelId = channelId
    }

    const channels = await prisma.youtubeChannel.findMany({
      where: whereClause
    })

    if (channels.length === 0) {
      return NextResponse.json({ message: 'No active channels found', addedCount: 0 })
    }

    let totalAdded = 0

    for (const channel of channels) {
      // Fetch latest videos from this channel
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet,id&channelId=${channel.channelId}&maxResults=50&order=date&type=video&key=${YOUTUBE_API_KEY}`
      )
      
      if (!response.ok) {
        if (response.status === 403 || response.status === 400) {
          return NextResponse.json({ error: 'YouTube API Quota Exceeded or Invalid Key' }, { status: response.status })
        }
        console.error(`Failed to fetch for channel ${channel.channelId}`)
        continue
      }
      
      const data = await response.json()
      
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          const videoId = item.id.videoId
          const title = item.snippet.title
          const publishedAt = new Date(item.snippet.publishedAt)
          const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`

          // Upsert into ShortVideo
          await prisma.shortVideo.upsert({
            where: { youtubeUrl },
            update: {
              title,
              channelId: channel.id,
              publishedAt
            },
            create: {
              youtubeUrl,
              title,
              channelId: channel.id,
              publishedAt
            }
          })
          totalAdded++
        }
      }
    }

    return NextResponse.json({ message: 'Sync complete', addedCount: totalAdded })
  } catch (error) {
    console.error('Error syncing youtube shorts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
