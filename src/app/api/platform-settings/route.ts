export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/platform-settings — List all platform settings
export async function GET() {
  try {
    const settings = await db.platformSetting.findMany({
      orderBy: { key: 'asc' },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching platform settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform settings' },
      { status: 500 }
    )
  }
}

// PUT /api/platform-settings — Update a platform setting by key
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined || value === null) {
      return NextResponse.json(
        { error: 'key and value are required' },
        { status: 400 }
      )
    }

    // Check if the setting exists
    const existing = await db.platformSetting.findUnique({ where: { key } })

    if (!existing) {
      return NextResponse.json(
        { error: `Setting with key "${key}" not found` },
        { status: 404 }
      )
    }

    const updated = await db.platformSetting.update({
      where: { key },
      data: { value: String(value) },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating platform setting:', error)
    return NextResponse.json(
      { error: 'Failed to update platform setting' },
      { status: 500 }
    )
  }
}
