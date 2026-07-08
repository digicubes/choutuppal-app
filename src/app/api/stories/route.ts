export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get('cityId')
    const userId = searchParams.get('userId')

    const where: any = {
      expiresAt: { gt: new Date() }
    }

    if (cityId) {
      where.cityId = cityId
    }
    if (userId) {
      where.userId = userId
    }

    const stories = await db.story.findMany({
      where,
      select: {
        id: true,
        userId: true,
        cityId: true,
        title: true,
        mediaType: true,
        mediaUrl: true,
        musicId: true,
        musicName: true,
        isPremium: true,
        viewsCount: true,
        views: true,
        likes: true,
        ctaLink: true,
        text: true,
        expiresAt: true,
        createdAt: true,
        replies: true,
        viewers: true,
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            subscriptionTier: true,
          }
        },
        city: {
          select: { id: true, name: true, slug: true }
        },
        music: {
          select: { id: true, name: true, audioUrl: true, artist: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(stories)
  } catch (error) {
    console.error('Error fetching stories:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, cityId, mediaUrl, text, ctaLink, mediaType, musicId, musicName, isPremium } = body

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Missing user ID' }, { status: 401 })
    }

    let resolvedUserId = userId

    // Verify user exists in DB
    let user = await db.user.findUnique({ where: { id: resolvedUserId } })
    
    // Fallback: If not found by ID directly, look up user using session token (email verification)
    if (!user) {
      try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return cookieStore.getAll()
              },
              setAll(cookiesToSet) {
                try {
                  cookiesToSet.forEach(({ name, value, options }) =>
                    cookieStore.set(name, value, options)
                  )
                } catch {}
              },
            },
          }
        )
        const { data: { user: sbUser } } = await supabase.auth.getUser()
        if (sbUser && sbUser.email) {
          user = await db.user.findFirst({
            where: { email: sbUser.email }
          })
          if (user) {
            resolvedUserId = user.id
          }
        }
      } catch (err) {
        console.error('API routes auth session helper error:', err)
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid user' }, { status: 401 })
    }

    if (!cityId || !mediaUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: cityId, mediaUrl' },
        { status: 400 }
      )
    }

    // Set expiresAt to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const story = await db.story.create({
      data: {
        userId: resolvedUserId,
        cityId,
        mediaType: mediaType || 'IMAGE',
        mediaUrl,
        text: text || null,
        ctaLink: ctaLink || null,
        title: text || 'Story', // Fallback for title column
        musicId: musicId || null,
        musicName: musicName || null,
        isPremium: isPremium || false,
        expiresAt,
      },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true, subscriptionTier: true },
        },
        music: {
          select: { id: true, name: true, audioUrl: true, artist: true },
        },
      },
    })

    return NextResponse.json(story, { status: 201 })
  } catch (error) {
    console.error('Error creating story:', error)
    return NextResponse.json(
      { error: 'Failed to create story' },
      { status: 500 }
    )
  }
}
