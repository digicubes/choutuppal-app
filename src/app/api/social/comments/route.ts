export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/social/comments — Create a comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, userId, content } = body;

    if (!postId || !userId || !content || !content.trim()) {
      return NextResponse.json(
        { error: 'postId, userId, and content are required' },
        { status: 400 }
      );
    }

    // Comment length limit to prevent abuse
    const trimmedContent = content.trim()
    if (trimmedContent.length > 2000) {
      return NextResponse.json(
        { error: 'Comment must be under 2000 characters' },
        { status: 400 }
      );
    }

    // Verify post exists and is not deleted
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true, isDeleted: true, authorId: true },
    });

    if (!post || post.isDeleted) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Create comment and increment commentsCount in a transaction
    const comment = await db.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          postId,
          userId,
          content: trimmedContent,
        },
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
      });

      await tx.post.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } },
      });

      const actor = await tx.user.findUnique({ where: { id: userId }, select: { fullName: true } });
      if (post.authorId !== userId && actor) {
        await tx.notification.create({
          data: {
            userId: post.authorId,
            actorId: userId,
            type: 'COMMENT',
            message: `${actor.fullName} మీ పోస్ట్ పై కామెంట్ చేశారు`,
            link: `/community`,
          }
        });
      }

      return newComment;
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('[SOCIAL_COMMENTS_POST]', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
