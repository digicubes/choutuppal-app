import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: Request) {
  try {
    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { followingId } = body;
    const followerId = user.id;

    if (!followingId) {
      return NextResponse.json({ error: 'Missing followingId' }, { status: 400 });
    }

    if (followerId === followingId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Toggle logic
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    if (existingFollow) {
      // Unfollow
      await db.follow.delete({
        where: { id: existingFollow.id }
      });
      return NextResponse.json({ success: true, following: false });
    } else {
      // Follow
      await db.follow.create({
        data: {
          followerId,
          followingId
        }
      });
      return NextResponse.json({ success: true, following: true });
    }

  } catch (error: any) {
    console.error('Follow toggle error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
