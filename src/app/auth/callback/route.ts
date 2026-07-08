import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * GET /auth/callback
 *
 * Handles the OAuth redirect from Google (or any provider).
 * Exchanges the authorization code for a Supabase session,
 * then redirects the user back to the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // "next" param allows us to redirect to a specific page after auth
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing sessions.
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.session?.user) {
      const authUser = data.session.user
      
      // Auto-generate logic if name is missing in metadata
      let fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name
      if (!fullName) {
        const phone = authUser.phone || authUser.user_metadata?.phone
        if (phone && phone.length >= 4) {
          fullName = `Guest-${phone.slice(-4)}`
        } else {
          fullName = `User-${Math.floor(1000 + Math.random() * 9000)}`
        }
      }

      try {
        const { db } = await import('@/lib/db')
        
        // Upsert user to ensure they exist with a valid fullName
        await db.user.upsert({
          where: { id: authUser.id },
          update: {
            // Update name only if it's currently null or empty
            // But upsert doesn't have a direct "only if null" without raw SQL,
            // so let's just make sure they have a name.
          },
          create: {
            id: authUser.id,
            email: authUser.email,
            fullName: fullName,
            phone: authUser.phone || authUser.user_metadata?.phone || '',
            avatarUrl: authUser.user_metadata?.avatar_url || null,
          }
        })
        
        // Ensure the fullName is set in DB if it was generated
        const existingUser = await db.user.findUnique({ where: { id: authUser.id }})
        if (existingUser && (!existingUser.fullName || existingUser.fullName.trim() === '')) {
           await db.user.update({
             where: { id: authUser.id },
             data: { fullName }
           })
        }
      } catch (dbError) {
        console.error('Callback DB Error:', dbError)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If code exchange fails, redirect to homepage with error
  return NextResponse.redirect(`${origin}/?auth_error=true`)
}
