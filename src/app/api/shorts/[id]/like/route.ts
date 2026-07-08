export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/shorts/[id]/like — Toggle like on a short
// Body: userId
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shortId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Verify the short exists
    const short = await db.short.findUnique({
      where: { id: shortId },
      select: { id: true, likesCount: true },
    });

    if (!short) {
      return NextResponse.json(
        { error: 'Short not found' },
        { status: 404 }
      );
    }

    // Check if the user already liked this short
    const existingLike = await db.shortLike.findUnique({
      where: {
        shortId_userId: { shortId, userId },
      },
    });

    if (existingLike) {
      // Unlike: remove the like and decrement count
      await db.$transaction(async (tx) => {
        await tx.shortLike.delete({
          where: { id: existingLike.id },
        });
        await tx.short.update({
          where: { id: shortId },
          data: { likesCount: { decrement: 1 } },
        });
      });

      // Fetch updated count
      const updated = await db.short.findUnique({
        where: { id: shortId },
        select: { likesCount: true },
      });

      return NextResponse.json({
        liked: false,
        likesCount: updated?.likesCount ?? 0,
      });
    } else {
      // Like: create the like and increment count
      await db.$transaction(async (tx) => {
        await tx.shortLike.create({
          data: { shortId, userId },
        });
        await tx.short.update({
          where: { id: shortId },
          data: { likesCount: { increment: 1 } },
        });
      });

      // Fetch updated count
      const updated = await db.short.findUnique({
        where: { id: shortId },
        select: { likesCount: true },
      });

      return NextResponse.json({
        liked: true,
        likesCount: updated?.likesCount ?? 0,
      });
    }
  } catch (error) {
    console.error('[SHORT_LIKE_TOGGLE]', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}
