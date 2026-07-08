export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper: build the common include object for short relations
const shortInclude = {
  user: {
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      role: true,
    },
  },
  city: {
    select: {
      id: true,
      name: true,
      slug: true,
      primaryColor: true,
    },
  },
  listing: {
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      images: true,
      whatsappNumber: true,
      address: true,
    },
  },
  _count: {
    select: { likes: true, comments: true },
  },
};

// GET /api/shorts/[id] — Get a single short by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const short = await db.short.findUnique({
      where: { id },
      include: shortInclude,
    });

    if (!short) {
      return NextResponse.json(
        { error: 'Short not found' },
        { status: 404 }
      );
    }

    // Increment viewsCount (fire-and-forget)
    db.short.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    }).catch((err) => {
      console.error('[SHORT_VIEWS_INCREMENT]', err);
    });

    return NextResponse.json({ short });
  } catch (error) {
    console.error('[SHORT_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch short' },
      { status: 500 }
    );
  }
}

// PATCH /api/shorts/[id] — Update a short (pin, promote, approve, or edit fields)
// Body: userId (for authorization demo), and any updatable fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      userId,
      title,
      youtubeVideoId,
      thumbnailUrl,
      category,
      linkedListingId,
      isPinned,
      isPromoted,
      isApproved,
      incrementViews,
    } = body;

    // Verify the short exists
    const existing = await db.short.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Short not found' },
        { status: 404 }
      );
    }

    // Demo auth: verify user exists
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      // Only the owner, city_admin, or super_admin can update
      const isOwner = existing.userId === userId;
      const isAdmin = user.role === 'city_admin' || user.role === 'super_admin';
      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: 'Not authorized to update this short' },
          { status: 403 }
        );
      }

      // Only admins can pin/promote/approve
      if (!isAdmin && (isPinned !== undefined || isPromoted !== undefined || isApproved !== undefined)) {
        return NextResponse.json(
          { error: 'Only admins can pin, promote, or moderate shorts' },
          { status: 403 }
        );
      }
    }

    // Build update data — only include fields that were provided
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      const trimmed = title.trim();
      if (trimmed.length === 0 || trimmed.length > 200) {
        return NextResponse.json(
          { error: 'Title must be between 1 and 200 characters' },
          { status: 400 }
        );
      }
      updateData.title = trimmed;
    }
    if (youtubeVideoId !== undefined) updateData.youtubeVideoId = youtubeVideoId.trim();
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl?.trim() || null;
    if (category !== undefined) updateData.category = category;
    if (linkedListingId !== undefined) updateData.linkedListingId = linkedListingId || null;
    if (isPinned !== undefined) updateData.isPinned = Boolean(isPinned);
    if (isPromoted !== undefined) updateData.isPromoted = Boolean(isPromoted);
    if (isApproved !== undefined) updateData.isApproved = Boolean(isApproved);

    // Optionally increment views via PATCH
    if (incrementViews) {
      updateData.viewsCount = { increment: 1 };
    }

    const short = await db.short.update({
      where: { id },
      data: updateData,
      include: shortInclude,
    });

    return NextResponse.json({ short });
  } catch (error) {
    console.error('[SHORT_PATCH]', error);
    return NextResponse.json(
      { error: 'Failed to update short' },
      { status: 500 }
    );
  }
}

// DELETE /api/shorts/[id] — Delete a short
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Verify the short exists
    const existing = await db.short.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Short not found' },
        { status: 404 }
      );
    }

    // Demo auth: verify user exists and has permission
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      const isOwner = existing.userId === userId;
      const isAdmin = user.role === 'city_admin' || user.role === 'super_admin';
      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: 'Not authorized to delete this short' },
          { status: 403 }
        );
      }
    }

    // Delete the short (cascades will handle likes and comments)
    await db.short.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Short deleted successfully' });
  } catch (error) {
    console.error('[SHORT_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete short' },
      { status: 500 }
    );
  }
}
