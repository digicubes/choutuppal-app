export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/social/likes — Check if user liked a post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const userId = searchParams.get('userId');

    if (!postId || !userId) {
      return NextResponse.json(
        { error: 'postId and userId are required' },
        { status: 400 }
      );
    }

    const like = await db.like.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });

    return NextResponse.json({ liked: !!like });
  } catch (error) {
    console.error('[SOCIAL_LIKES_GET]', error);
    return NextResponse.json({ error: 'Failed to check like status' }, { status: 500 });
  }
}

// POST /api/social/likes — Toggle like on a post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, userId } = body;

    if (!postId || !userId) {
      return NextResponse.json(
        { error: 'postId and userId are required' },
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

    // Check if already liked
    const existingLike = await db.like.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });

    if (existingLike) {
      // Unlike: delete the like and decrement count
      await db.$transaction(async (tx) => {
        await tx.like.delete({
          where: { id: existingLike.id },
        });
        await tx.post.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } },
        });
      });

      return NextResponse.json({ liked: false });
    } else {
      // Like: create and increment count
      await db.$transaction(async (tx) => {
        await tx.like.create({
          data: { postId, userId },
        });
        await tx.post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } },
        });
        
        const actor = await tx.user.findUnique({ where: { id: userId }, select: { fullName: true } });
        if (post.authorId !== userId && actor) {
          await tx.notification.create({
            data: {
              userId: post.authorId,
              actorId: userId,
              type: 'LIKE',
              message: `${actor.fullName} మీ పోస్ట్ ని లైక్ చేశారు`,
              link: `/community`,
            }
          });
        }
      });

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('[SOCIAL_LIKES_POST]', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
