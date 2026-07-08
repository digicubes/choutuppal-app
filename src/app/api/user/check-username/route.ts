import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'Username missing' }, { status: 400 })
    }

    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '')
    
    if (cleanUsername !== username) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({
      where: { username: cleanUsername }
    })

    if (existingUser) {
      return NextResponse.json({ available: false })
    }

    return NextResponse.json({ available: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
