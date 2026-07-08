import { NextResponse } from 'next/server';

export async function GET() {
  const envStatus = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DIRECT_URL: !!process.env.DIRECT_URL,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    YOUTUBE_API_KEY: !!process.env.YOUTUBE_API_KEY,
    NEXT_PUBLIC_FB_PIXEL_ID: !!process.env.NEXT_PUBLIC_FB_PIXEL_ID,
    VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  };

  return NextResponse.json(envStatus);
}
