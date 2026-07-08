export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/blogs — List blogs with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get('cityId')
    const slug = searchParams.get('slug')
    const all = searchParams.get('all')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : undefined

    // Fetch single blog by slug
    if (slug) {
      const blog = await db.blog.findUnique({
        where: { slug },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          city: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      })

      if (!blog) {
        return NextResponse.json(
          { error: 'Blog not found' },
          { status: 404 }
        )
      }

      // If not admin view, only return published blogs
      if (!all || all !== 'true') {
        if (!blog.isPublished) {
          return NextResponse.json(
            { error: 'Blog not found' },
            { status: 404 }
          )
        }
      }

      return NextResponse.json(blog)
    }

    // Build where clause for listing
    const where: Record<string, unknown> = {}

    // Filter by published status unless admin view
    if (!all || all !== 'true') {
      where.isPublished = true
    }

    // City filter: include city-specific + global (cityId = null) blogs
    if (cityId) {
      where.OR = [
        { cityId },
        { cityId: null },
      ]
    }

    const blogs = await db.blog.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        city: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: limit } : {}),
    })

    return NextResponse.json(blogs)
  } catch (error) {
    console.error('Error fetching blogs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blogs' },
      { status: 500 }
    )
  }
}

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// POST /api/blogs — Create a new blog
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin' && profile.role !== 'city_admin' && profile.role !== 'agent')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, slug, coverImageUrl, content, cityId, authorName } = body

    if (!title || !slug) {
      return NextResponse.json(
        { error: 'title and slug are required' },
        { status: 400 }
      )
    }

    // Check for slug uniqueness
    const existingBlog = await db.blog.findUnique({ where: { slug } })
    if (existingBlog) {
      return NextResponse.json(
        { error: 'A blog with this slug already exists' },
        { status: 409 }
      )
    }

    // Verify city exists if provided
    let finalCityId = cityId || null;
    if (finalCityId) {
      const city = await db.city.findUnique({ where: { id: finalCityId } })
      if (!city) {
        const firstCity = await db.city.findFirst()
        finalCityId = firstCity ? firstCity.id : null
      }
    }

    try {
      const blog = await db.blog.create({
        data: {
          title,
          slug,
          coverImageUrl: coverImageUrl || null,
          content: content || null,
          authorName: authorName || 'Choutuppal App Team',
          authorId: user.id, // Always use authenticated user's ID
          cityId: finalCityId,
          isPublished: true, // Agent submissions are automatically APPROVED
        },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          city: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      })

      // Create notifications for all users
      try {
        const allUsers = await db.user.findMany({ select: { id: true } });
        const notifications = allUsers.map(u => ({
          userId: u.id,
          actorId: user.id,
          type: 'NEWS',
          message: `కొత్త బ్లాగ్: ${title}`,
          link: `/blog/${slug}`,
        }));
        await db.notification.createMany({ data: notifications });
      } catch (notifError) {
        console.error('Error creating notifications for blog:', notifError);
      }

      return NextResponse.json(blog, { status: 201 })
    } catch (createError: any) {
      console.error('Prisma Blog Create Error:', createError)
      return NextResponse.json(
        { error: createError.message || 'Failed to save blog post' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error creating blog:', error)
    return NextResponse.json(
      { error: 'Failed to create blog' },
      { status: 500 }
    )
  }
}
