export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const featuredUsers = await db.user.findMany({
      where: { isFeatured: true },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        profile: {
          select: {
            bio: true,
            isVerified: true,
          }
        }
      },
    });

    return NextResponse.json({ profiles: featuredUsers });
  } catch (error) {
    console.error('[FEATURED_PROFILES_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
