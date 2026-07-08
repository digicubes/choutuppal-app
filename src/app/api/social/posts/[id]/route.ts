export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/social/posts/[id] — Get single post with author and comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const post = await db.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
            profile: {
              select: {
                id: true,
                bio: true,
                avatarUrl: true,
                coverImageUrl: true,
                isPublicFigure: true,
                publicFigureCategory: true,
                isVerified: true,
                followersCount: true,
                followingCount: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                role: true,
                profile: {
                  select: {
                    id: true,
                    bio: true,
                    avatarUrl: true,
                    isPublicFigure: true,
                    publicFigureCategory: true,
                    isVerified: true,
                    followersCount: true,
                    followingCount: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    if (!post || post.isDeleted) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('[SOCIAL_POST_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

// DELETE /api/social/posts/[id] — Soft delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const post = await db.post.findUnique({
      where: { id },
      select: { authorId: true, isDeleted: true },
    });

    if (!post || post.isDeleted) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Verify ownership or admin role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isOwner = post.authorId === userId;
    const isAdmin = user.role === 'super_admin' || user.role === 'city_admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.post.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('[SOCIAL_POST_DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}

// PATCH /api/social/posts/[id] — Update post (pin/unpin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isPinned, userId } = body;

    if (userId === undefined) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const post = await db.post.findUnique({
      where: { id },
      select: { authorId: true, isDeleted: true },
    });

    if (!post || post.isDeleted) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Only admin or post owner can pin
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isOwner = post.authorId === userId;
    const isAdmin = user.role === 'super_admin' || user.role === 'city_admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (isPinned !== undefined) {
      updateData.isPinned = isPinned;
    }

    const updatedPost = await db.post.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
            profile: {
              select: {
                id: true,
                bio: true,
                avatarUrl: true,
                isPublicFigure: true,
                isVerified: true,
                followersCount: true,
              },
            },
          },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error('[SOCIAL_POST_PATCH]', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}
