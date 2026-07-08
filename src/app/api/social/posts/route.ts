export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/social/posts — Fetch posts for community feed
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const feedType = searchParams.get('feedType') || 'foryou'; // 'foryou' | 'following'

    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const where: any = {};
    if (!includeDeleted) {
      where.isDeleted = false;
    }

    if (userId) {
      if (feedType === 'following') {
        // Find users the current user follows
        const follows = await db.follow.findMany({
          where: { followerId: userId },
          select: { followingId: true }
        });
        const followingIds = follows.map(f => f.followingId);
        where.authorId = { in: followingIds };
      } else {
        // specific user's posts
        where.authorId = userId;
      }
    }

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              username: true,
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
          _count: {
            select: { comments: true, likes: true },
          },
          comments: {
            include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20
          }
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      db.post.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[SOCIAL_POSTS_GET]', error);
    // Pagination-safe error response
    return NextResponse.json({ posts: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }, { status: 500 });
  }
}

// POST /api/social/posts — Create a new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authorId, content, mediaUrls } = body;

    if (!authorId || !content || !content.trim()) {
      return NextResponse.json(
        { error: 'authorId and content are required' },
        { status: 400 }
      );
    }

    // Content length limit to prevent abuse
    const trimmedContent = content.trim()
    if (trimmedContent.length > 5000) {
      return NextResponse.json(
        { error: 'Post content must be under 5000 characters' },
        { status: 400 }
      );
    }

    // Auto-create profile if not exists
    const existingProfile = await db.profile.findUnique({
      where: { userId: authorId },
    });

    if (!existingProfile) {
      await db.profile.create({
        data: { userId: authorId },
      });
    }

    const post = await db.post.create({
      data: {
        authorId,
        content: trimmedContent,
        mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : null,
      },
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
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('[SOCIAL_POSTS_POST]', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
