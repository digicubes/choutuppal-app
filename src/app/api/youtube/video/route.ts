import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.log('POST /youtube/video - Auth Error:', error?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!dbUser || !['admin', 'super_admin', 'city_admin'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { videoUrl } = await req.json()

    if (!videoUrl) {
      return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 })
    }

    // Extract videoId from URL (handles both youtu.be/xyz and youtube.com/watch?v=xyz)
    let videoId = ''
    try {
      if (videoUrl.includes('youtu.be/')) {
        videoId = videoUrl.split('youtu.be/')[1].split('?')[0]
      } else if (videoUrl.includes('youtube.com/watch')) {
        const urlObj = new URL(videoUrl)
        videoId = urlObj.searchParams.get('v') || ''
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    if (!videoId) {
      return NextResponse.json({ error: 'Could not extract video ID' }, { status: 400 })
    }

    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`

    // Fetch video details via oEmbed (no API key required)
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`)
    if (!oembedRes.ok) {
      return NextResponse.json({ error: 'Could not fetch video details from YouTube' }, { status: oembedRes.status })
    }

    const oembedData = await oembedRes.json()
    const title = oembedData.title || 'Untitled Video'
    
    // Save to database
    const video = await prisma.shortVideo.upsert({
      where: { youtubeUrl },
      update: {
        title,
        isManual: true,
      },
      create: {
        youtubeUrl,
        title,
        publishedAt: new Date(),
        isManual: true,
      }
    })

    return NextResponse.json({ message: 'Video added successfully', video })
  } catch (error) {
    console.error('Error adding specific youtube video:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
