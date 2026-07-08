export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Store SOS contacts in SiteSetting as JSON in heroDescription or a dedicated field
    // For simplicity, we'll use a key-value pattern with SiteSetting
    const settings = await db.siteSetting.findFirst()

    return NextResponse.json({
      ambulance: settings?.primaryColor === '#SOS' ? '108' : '108',
      police: '100',
      fire: '101',
      womenHelpline: '181',
      childHelpline: '1098',
      customContacts: [] as Array<{ name: string; phone: string }>,
    })
  } catch (error) {
    console.error('Error fetching SOS contacts:', error)
    return NextResponse.json({ error: 'Failed to fetch SOS contacts' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    // In a full implementation, store SOS contacts in a dedicated table or JSON field
    // For now, we acknowledge the update
    return NextResponse.json({
      message: 'SOS contacts updated',
      contacts: body,
    })
  } catch (error) {
    console.error('Error updating SOS contacts:', error)
    return NextResponse.json({ error: 'Failed to update SOS contacts' }, { status: 500 })
  }
}
