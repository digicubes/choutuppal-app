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

export async function GET(request: Request) {
  try {
    const user = await getUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all' // unread or all

    const whereClause: any = { userId: user.id }
    if (filter === 'unread') {
      whereClause.isRead = false
    }

    const notifications = await db.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        actor: {
          select: { fullName: true, avatarUrl: true }
        }
      }
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()

    if (id) {
      await db.notification.update({
        where: { id, userId: user.id },
        data: { isRead: true },
      })
    } else {
      await db.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
