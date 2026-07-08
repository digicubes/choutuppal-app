import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  try {
    const { supabase } = await import('@/lib/supabase');
    const token = req.headers.get('Authorization')?.split(' ')[1];
    
    // Fallback simple auth check for server context or SSR cookies if needed. 
    // Ideally we should use the same auth as other admin routes. 
    const { data: { user } } = await supabase.auth.getUser(token);
    
    // In many of these routes, the client uses a token or the route relies on Next SSR auth.
    // For simplicity in this admin tool, we just do a basic check.
    // However, if the client doesn't send a token, we might need a cookie-based check.
    // We'll use the token from the header first.
    
    if (!user) {
       // Since the admin-settings component might not pass the token manually if it uses SWR, 
       // let's try the cookie approach used in blogs API.
       const { cookies } = await import('next/headers');
       const { createServerClient } = await import('@supabase/ssr');
       const cookieStore = await cookies();
       
       const supabaseSsr = createServerClient(
         process.env.NEXT_PUBLIC_SUPABASE_URL!,
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
         {
           cookies: {
             get(name: string) { return cookieStore.get(name)?.value; },
           },
         }
       );
       const { data: { user: ssrUser } } = await supabaseSsr.auth.getUser();
       
       if (!ssrUser) {
           return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
       }
       
       const { db } = await import('@/lib/db');
       const profile = await db.user.findUnique({ where: { id: ssrUser.id }});
       if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
           return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
       }
    } else {
        const { db } = await import('@/lib/db');
        const profile = await db.user.findUnique({ where: { id: user.id }});
        if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
           return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
    }

    // Revalidate everything
    revalidatePath('/', 'layout')

    return NextResponse.json({ success: true, message: 'Cache cleared successfully' })
  } catch (error) {
    console.error('Error revalidating cache:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
