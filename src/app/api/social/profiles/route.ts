export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/social/profiles — Get profiles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const publicFigures = searchParams.get('publicFigures');

    // Single profile by userId
    if (userId) {
      const profile = await db.profile.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              role: true,
              phone: true,
            },
          },
        },
      });

      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      return NextResponse.json({ profile });
    }

    // Public figures only
    const where: Record<string, unknown> = {};
    if (publicFigures === 'true') {
      where.isPublicFigure = true;
    }

    const profiles = await db.profile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: { followersCount: 'desc' },
    });

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('[SOCIAL_PROFILES_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
}

// POST /api/social/profiles — Create or update profile (upsert)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, bio, avatarUrl, coverImageUrl } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upsert profile using findFirst + create/update pattern for SQLite
    const existingProfile = await db.profile.findUnique({
      where: { userId },
    });

    const updateData: Record<string, unknown> = {};
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl;
    if (body.isPublicFigure !== undefined) updateData.isPublicFigure = body.isPublicFigure;
    if (body.isVerified !== undefined) updateData.isVerified = body.isVerified;

    let profile;

    if (existingProfile) {
      profile = await db.profile.update({
        where: { userId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
      });
    } else {
      profile = await db.profile.create({
        data: {
          userId,
          ...updateData,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
      });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('[SOCIAL_PROFILES_POST]', error);
    return NextResponse.json({ error: 'Failed to upsert profile' }, { status: 500 });
  }
}
