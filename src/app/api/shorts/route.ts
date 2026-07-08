export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/shorts — List shorts for a city
// Query params: cityId (required), category (optional), page, limit
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get('cityId');
    const category = searchParams.get('category');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    if (!cityId) {
      return NextResponse.json(
        { error: 'cityId query parameter is required' },
        { status: 400 }
      );
    }

    // Build where clause: only approved shorts for the given city
    const where: Record<string, unknown> = {
      cityId,
      isApproved: true,
    };

    if (category) {
      where.category = category;
    }

    const [shorts, total] = await Promise.all([
      db.short.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          city: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          listing: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: true,
              images: true,
            },
          },
        },
        // Pinned first, then promoted, then newest
        orderBy: [
          { isPinned: 'desc' },
          { isPromoted: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      db.short.count({ where }),
    ]);

    // Increment viewsCount for each returned short (fire-and-forget)
    const shortIds = shorts.map((s) => s.id);
    if (shortIds.length > 0) {
      db.short.updateMany({
        where: { id: { in: shortIds } },
        data: { viewsCount: { increment: 1 } },
      }).catch((err) => {
        console.error('[SHORTS_VIEWS_INCREMENT]', err);
      });
    }

    return NextResponse.json({
      shorts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[SHORTS_GET]', error);
    return NextResponse.json(
      { shorts: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } },
      { status: 500 }
    );
  }
}

// POST /api/shorts — Create a new short
// Body: userId, cityId, title, youtubeVideoId, thumbnailUrl, category, linkedListingId
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      cityId,
      title,
      youtubeVideoId,
      thumbnailUrl,
      category,
      linkedListingId,
    } = body;

    // Validate required fields
    if (!userId || !cityId || !title || !youtubeVideoId) {
      return NextResponse.json(
        { error: 'userId, cityId, title, and youtubeVideoId are required' },
        { status: 400 }
      );
    }

    // Title length limit
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0 || trimmedTitle.length > 200) {
      return NextResponse.json(
        { error: 'Title must be between 1 and 200 characters' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify city exists
    const city = await db.city.findUnique({
      where: { id: cityId },
      select: { id: true },
    });
    if (!city) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      );
    }

    // If linking a listing, verify it exists
    if (linkedListingId) {
      const listing = await db.listing.findUnique({
        where: { id: linkedListingId },
        select: { id: true },
      });
      if (!listing) {
        return NextResponse.json(
          { error: 'Linked listing not found' },
          { status: 404 }
        );
      }
    }

    // Create the short
    const short = await db.short.create({
      data: {
        userId,
        cityId,
        title: trimmedTitle,
        youtubeVideoId: youtubeVideoId.trim(),
        thumbnailUrl: thumbnailUrl?.trim() || null,
        category: category || 'GENERAL',
        linkedListingId: linkedListingId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        city: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        listing: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            images: true,
          },
        },
      },
    });

    return NextResponse.json({ short }, { status: 201 });
  } catch (error) {
    console.error('[SHORTS_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create short' },
      { status: 500 }
    );
  }
}
