export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  try {
    
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
        },
      }
    )
    
    let session: any = null;
    let authUser: any = null;
    const authHeader = request?.headers?.get('authorization') || request?.headers?.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user) {
        authUser = user;
        session = { user };
      }
    }
    
    if (!session) {
      const { data: sessionData } = await supabase.auth.getSession()
      session = sessionData?.session;
    }

    if (!session) {
      console.error('Session failed to parse in API: /api/settings')
    }


    let settings = await db.siteSetting.findFirst();

    if (!settings) {
      settings = await db.siteSetting.create({
        data: {
          appLogoUrl: '/brand-logo.png',
          faviconUrl: '/icons/icon-192x192.png',
          pwaIconUrl: '/icons/icon-512x512.png',
          heroHeadline: 'Discover Choutuppal - Your Town, One App',
          heroDescription: 'Find the best local businesses, services, real estate, news, and more.',
          primaryColor: '#D4AF37',
          accentColor: '#4169E1'
        }
      });
    }

    return NextResponse.json(settings, { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
        },
      }
    )
    
    let session: any = null;
    let authUser: any = null;
    const authHeader = request?.headers?.get('authorization') || request?.headers?.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user) {
        authUser = user;
        session = { user };
      }
    }
    
    if (!session) {
      const { data: sessionData } = await supabase.auth.getSession()
      session = sessionData?.session;
    }

    if (!session) {
      console.error('Session failed to parse in API: /api/settings')
    }


    const body = await request.json();
    const existing = await db.siteSetting.findFirst();

    let settings;
    if (existing) {
      settings = await db.siteSetting.update({
        where: { id: existing.id },
        data: body
      });
    } else {
      settings = await db.siteSetting.create({
        data: body
      });
    }

    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
