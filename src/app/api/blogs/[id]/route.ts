export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/blogs/[id] — Get single blog by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const blog = await db.blog.findUnique({
      where: { id },
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

    return NextResponse.json(blog)
  } catch (error) {
    console.error('Error fetching blog:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog' },
      { status: 500 }
    )
  }
}

// PUT /api/blogs/[id] — Update a blog
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, coverImageUrl, content, cityId, isPublished } = body

    // Verify blog exists
    const existingBlog = await db.blog.findUnique({ where: { id } })
    if (!existingBlog) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      )
    }

    // Verify city exists if provided
    if (cityId !== undefined && cityId !== null) {
      const city = await db.city.findUnique({ where: { id: cityId } })
      if (!city) {
        return NextResponse.json(
          { error: 'City not found' },
          { status: 404 }
        )
      }
    }

    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title
    if (coverImageUrl !== undefined) data.coverImageUrl = coverImageUrl
    if (content !== undefined) data.content = content
    if (cityId !== undefined) data.cityId = cityId
    if (isPublished !== undefined) data.isPublished = isPublished

    const updatedBlog = await db.blog.update({
      where: { id },
      data,
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

    return NextResponse.json(updatedBlog)
  } catch (error) {
    console.error('Error updating blog:', error)
    return NextResponse.json(
      { error: 'Failed to update blog' },
      { status: 500 }
    )
  }
}

// DELETE /api/blogs/[id] — Delete a blog
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify blog exists
    const existingBlog = await db.blog.findUnique({ where: { id } })
    if (!existingBlog) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      )
    }

    await db.blog.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Blog deleted successfully' })
  } catch (error) {
    console.error('Error deleting blog:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog' },
      { status: 500 }
    )
  }
}
