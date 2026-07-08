export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/social/verification — Get verification requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const requests = await db.verificationRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
            phone: true,
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('[SOCIAL_VERIFICATION_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch verification requests' }, { status: 500 });
  }
}

// POST /api/social/verification — Apply for verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, category, idProofUrl, reason } = body;

    if (!userId || !category || !reason) {
      return NextResponse.json(
        { error: 'userId, category, and reason are required' },
        { status: 400 }
      );
    }

    const validCategories = ['POLITICIAN', 'INFLUENCER', 'CELEBRITY', 'GOVT_OFFICIAL'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `category must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has a pending verification request
    const existingPending = await db.verificationRequest.findUnique({
      where: { userId },
    });

    if (existingPending && existingPending.status === 'pending') {
      return NextResponse.json(
        { error: 'You already have a pending verification request' },
        { status: 409 }
      );
    }

    // If user has an existing request (approved/rejected), update it; otherwise create new
    let verificationRequest;
    if (existingPending) {
      // Update existing request to resubmit
      verificationRequest = await db.verificationRequest.update({
        where: { userId },
        data: {
          category,
          idProofUrl: idProofUrl || null,
          reason,
          status: 'pending',
          adminNote: null,
        },
      });
    } else {
      verificationRequest = await db.verificationRequest.create({
        data: {
          userId,
          category,
          idProofUrl: idProofUrl || null,
          reason,
        },
      });
    }

    return NextResponse.json({ verificationRequest }, { status: 201 });
  } catch (error) {
    console.error('[SOCIAL_VERIFICATION_POST]', error);
    return NextResponse.json({ error: 'Failed to apply for verification' }, { status: 500 });
  }
}
