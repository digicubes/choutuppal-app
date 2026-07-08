export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH /api/social/verification/[id] — Approve or reject verification request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, adminNote } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Find the verification request
    const verificationRequest = await db.verificationRequest.findUnique({
      where: { id },
    });

    if (!verificationRequest) {
      return NextResponse.json(
        { error: 'Verification request not found' },
        { status: 404 }
      );
    }

    if (verificationRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      );
    }

    // Update the request and profile in a transaction
    const updatedRequest = await db.$transaction(async (tx) => {
      // Update verification request
      const updated = await tx.verificationRequest.update({
        where: { id },
        data: {
          status,
          adminNote: adminNote || null,
        },
      });

      // If approved, update the user's profile
      if (status === 'approved') {
        const existingProfile = await tx.profile.findUnique({
          where: { userId: verificationRequest.userId },
        });

        if (existingProfile) {
          await tx.profile.update({
            where: { userId: verificationRequest.userId },
            data: {
              isPublicFigure: true,
              isVerified: true,
              publicFigureCategory: verificationRequest.category,
            },
          });
        } else {
          // Auto-create profile with verified status
          await tx.profile.create({
            data: {
              userId: verificationRequest.userId,
              isPublicFigure: true,
              isVerified: true,
              publicFigureCategory: verificationRequest.category,
            },
          });
        }
      }

      return updated;
    });

    return NextResponse.json({ verificationRequest: updatedRequest });
  } catch (error) {
    console.error('[SOCIAL_VERIFICATION_PATCH]', error);
    return NextResponse.json({ error: 'Failed to process verification request' }, { status: 500 });
  }
}
