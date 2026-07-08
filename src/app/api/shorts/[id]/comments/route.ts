export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/shorts/[id]/comments — List comments for a short (paginated)
// Query params: page, limit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shortId } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Verify the short exists
    const short = await db.short.findUnique({
      where: { id: shortId },
      select: { id: true },
    });

    if (!short) {
      return NextResponse.json(
        { error: 'Short not found' },
        { status: 404 }
      );
    }

    const [comments, total] = await Promise.all([
      db.shortComment.findMany({
        where: { shortId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.shortComment.count({ where: { shortId } }),
    ]);

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[SHORT_COMMENTS_GET]', error);
    return NextResponse.json(
      { comments: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      { status: 500 }
    );
  }
}

// POST /api/shorts/[id]/comments — Add a comment to a short
// Body: userId, content
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shortId } = await params;
    const body = await request.json();
    const { userId, content } = body;

    // Validate required fields
    if (!userId || !content || !content.trim()) {
      return NextResponse.json(
        { error: 'userId and content are required' },
        { status: 400 }
      );
    }

    // Content length limit
    const trimmedContent = content.trim();
    if (trimmedContent.length > 2000) {
      return NextResponse.json(
        { error: 'Comment must be under 2000 characters' },
        { status: 400 }
      );
    }

    // Verify the short exists
    const short = await db.short.findUnique({
      where: { id: shortId },
      select: { id: true },
    });

    if (!short) {
      return NextResponse.json(
        { error: 'Short not found' },
        { status: 404 }
      );
    }

    // Create comment and increment commentsCount atomically
    const comment = await db.$transaction(async (tx) => {
      const newComment = await tx.shortComment.create({
        data: {
          shortId,
          userId,
          content: trimmedContent,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      });

      await tx.short.update({
        where: { id: shortId },
        data: { commentsCount: { increment: 1 } },
      });

      return newComment;
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('[SHORT_COMMENTS_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
