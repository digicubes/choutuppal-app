import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

async function getUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { get(name: string) { return cookieStore.get(name)?.value } },
    }
  )
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function POST(request: Request) {
  try {
    const user = await getUser()
    const userId = user?.id || null 

    const { endpoint, keys } = await request.json()

    if (!endpoint || !keys) {
      return NextResponse.json({ error: 'Endpoint and keys are required' }, { status: 400 })
    }

    const subscription = await db.pushSubscription.upsert({
      where: { endpoint },
      update: { userId, keys },
      create: { userId, endpoint, keys },
    })

    return NextResponse.json({ success: true, subscription })
  } catch (error) {
    console.error('Error saving subscription:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
