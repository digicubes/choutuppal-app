export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// GET /api/banners â€” Fetch banner ads (public: active only; admin: all)
export async function GET(request: Request) {
  try {
    
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
        },
      }
    )
    
    let session: any = null;
    let authUser: any = null;
    const authHeader = request?.headers?.get('authorization') || request?.headers?.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user) {
        authUser = user;
        session = { user };
      }
    }
    
    if (!session) {
      const { data: sessionData } = await supabase.auth.getSession()
      session = sessionData?.session;
    }

    if (!session) {
      console.error('Session failed to parse in API: ' + (request?.url || '/api/settings'))
    }


    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get('cityId')
    const citySlug = searchParams.get('citySlug')
    const userId = searchParams.get('userId')
    const all = searchParams.get('all') === 'true'

    const where: Record<string, unknown> = {}
    if (!all) {
      where.isActive = true
      where.status = 'APPROVED'
      where.expiresAt = { gt: new Date() }
    }
    // Single city architecture: return all approved banners.
    // Ignored cityId and citySlug filtering.
    
    if (userId) where.userId = userId

    const ads = await db.bannerAd.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(ads)
  } catch (error) {
    console.error('Error fetching banner ads:', error)
    return NextResponse.json([])
  }
}

// POST /api/banners â€” Create a new banner ad
export async function POST(request: Request) {
  try {
    
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
        },
      }
    )
    
    let session: any = null;
    let authUser: any = null;
    const authHeader = request?.headers?.get('authorization') || request?.headers?.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user) {
        authUser = user;
        session = { user };
      }
    }
    
    if (!session) {
      const { data: sessionData } = await supabase.auth.getSession()
      session = sessionData?.session;
    }

    if (!session) {
      console.error('Session failed to parse in API: ' + (request?.url || '/api/settings'))
    }


    const body = await request.json()
    const { title, imageUrl, shopName, offerText, linkUrl, phoneNumber, cityId, isActive, userId } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const banner = await db.bannerAd.create({
      data: {
        title: title.trim(),
        imageUrl: imageUrl || null,
        shopName: shopName || '',
        offerText: offerText || null,
        linkUrl: linkUrl || null,
        phoneNumber: phoneNumber || null,
        cityId: cityId || null,
        userId: userId || null,
        isActive: true,
        status: 'APPROVED',
        expiresAt,
      },
    })

    return NextResponse.json(banner, { status: 201 })
  } catch (error) {
    console.error('Error creating banner ad:', error)
    return NextResponse.json({ error: 'Failed to create banner ad' }, { status: 500 })
  }
}

// PUT /api/banners â€” Update a banner ad
export async function PUT(request: Request) {
  try {
    
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
        },
      }
    )
    
    let session: any = null;
    let authUser: any = null;
    const authHeader = request?.headers?.get('authorization') || request?.headers?.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user) {
        authUser = user;
        session = { user };
      }
    }
    
    if (!session) {
      const { data: sessionData } = await supabase.auth.getSession()
      session = sessionData?.session;
    }

    if (!session) {
      console.error('Session failed to parse in API: ' + (request?.url || '/api/settings'))
    }


    const body = await request.json()
    const { id, title, imageUrl, shopName, offerText, linkUrl, phoneNumber, cityId, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 })
    }

    const existing = await db.bannerAd.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title.trim()
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null
    if (shopName !== undefined) updateData.shopName = shopName || ''
    if (offerText !== undefined) updateData.offerText = offerText || null
    if (linkUrl !== undefined) updateData.linkUrl = linkUrl || null
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null
    if (cityId !== undefined) updateData.cityId = cityId || null
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    const updated = await db.bannerAd.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating banner ad:', error)
    return NextResponse.json({ error: 'Failed to update banner ad' }, { status: 500 })
  }
}

// DELETE /api/banners â€” Delete a banner ad
export async function DELETE(request: Request) {
  try {
    
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
        },
      }
    )
    
    let session: any = null;
    let authUser: any = null;
    const authHeader = request?.headers?.get('authorization') || request?.headers?.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user) {
        authUser = user;
        session = { user };
      }
    }
    
    if (!session) {
      const { data: sessionData } = await supabase.auth.getSession()
      session = sessionData?.session;
    }

    if (!session) {
      console.error('Session failed to parse in API: ' + (request?.url || '/api/settings'))
    }


    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 })
    }

    const existing = await db.bannerAd.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    await db.bannerAd.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting banner ad:', error)
    return NextResponse.json({ error: 'Failed to delete banner ad' }, { status: 500 })
  }
}
