export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/social/follows — Check follow status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const followerId = searchParams.get('followerId');
    const followingId = searchParams.get('followingId');

    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: 'followerId and followingId are required' },
        { status: 400 }
      );
    }

    const follow = await db.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    return NextResponse.json({ following: !!follow });
  } catch (error) {
    console.error('[SOCIAL_FOLLOWS_GET]', error);
    return NextResponse.json({ error: 'Failed to check follow status' }, { status: 500 });
  }
}

// POST /api/social/follows — Toggle follow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { followerId, followingId } = body;

    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: 'followerId and followingId are required' },
        { status: 400 }
      );
    }

    if (followerId === followingId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Verify both users exist
    const [follower, following] = await Promise.all([
      db.user.findUnique({ where: { id: followerId }, select: { id: true } }),
      db.user.findUnique({ where: { id: followingId }, select: { id: true } }),
    ]);

    if (!follower || !following) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already following
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (existingFollow) {
      // Unfollow: delete the follow and decrement both counts
      await db.$transaction(async (tx) => {
        await tx.follow.delete({
          where: { id: existingFollow.id },
        });

        // Decrement follower's followingCount
        await tx.profile.updateMany({
          where: { userId: followerId },
          data: { followingCount: { decrement: 1 } },
        });

        // Decrement following user's followersCount
        await tx.profile.updateMany({
          where: { userId: followingId },
          data: { followersCount: { decrement: 1 } },
        });
      });

      return NextResponse.json({ following: false });
    } else {
      // Follow: create and increment both counts
      await db.$transaction(async (tx) => {
        await tx.follow.create({
          data: { followerId, followingId },
        });

        // Ensure profiles exist, auto-create if missing
        const followerProfile = await tx.profile.findUnique({
          where: { userId: followerId },
        });
        if (!followerProfile) {
          await tx.profile.create({
            data: { userId: followerId, followingCount: 1 },
          });
        } else {
          await tx.profile.update({
            where: { userId: followerId },
            data: { followingCount: { increment: 1 } },
          });
        }

        const followingProfile = await tx.profile.findUnique({
          where: { userId: followingId },
        });
        if (!followingProfile) {
          await tx.profile.create({
            data: { userId: followingId, followersCount: 1 },
          });
        } else {
          await tx.profile.update({
            where: { userId: followingId },
            data: { followersCount: { increment: 1 } },
          });
        }
        
        const followerUser = await tx.user.findUnique({ where: { id: followerId }, select: { fullName: true } });
        if (followerUser) {
          await tx.notification.create({
            data: {
              userId: followingId,
              actorId: followerId,
              type: 'FOLLOW',
              message: `${followerUser.fullName} మిమ్మల్ని ఫాలో అవుతున్నారు`,
              link: `/profile/${followerId}`,
            }
          });
        }
      });

      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error('[SOCIAL_FOLLOWS_POST]', error);
    return NextResponse.json({ error: 'Failed to toggle follow' }, { status: 500 });
  }
}
