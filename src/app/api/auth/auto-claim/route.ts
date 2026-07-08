import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, phoneNumber } = body;

    if (!userId || !phoneNumber) {
      return NextResponse.json({ error: 'Missing userId or phoneNumber' }, { status: 400 });
    }

    // Update Listings where phoneNumber matches but userId is NOT current user
    const updatedListings = await db.listing.updateMany({
      where: {
        phoneNumber: phoneNumber,
        userId: { not: userId }
      },
      data: {
        userId: userId
      }
    });

    // Update BannerAds where phoneNumber matches but userId is NOT current user
    const updatedBanners = await db.bannerAd.updateMany({
      where: {
        phoneNumber: phoneNumber,
        userId: { not: userId }
      },
      data: {
        userId: userId
      }
    });

    return NextResponse.json({
      success: true,
      listingsTransferred: updatedListings.count,
      bannersTransferred: updatedBanners.count
    });
  } catch (error: any) {
    console.error('Auto-claim error:', error);
    return NextResponse.json({ error: 'Failed to process auto-claim' }, { status: 500 });
  }
}
