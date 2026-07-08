import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { type } = await request.json()
    const resolvedParams = await params
    
    let updateData = {}
    if (type === 'whatsapp') updateData = { whatsappClicks: { increment: 1 } }
    if (type === 'call') updateData = { callClicks: { increment: 1 } }
    if (type === 'share') updateData = { shareClicks: { increment: 1 } }

    if (Object.keys(updateData).length > 0) {
      await prisma.listing.update({
        where: { id: resolvedParams.id },
        data: updateData
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Click Tracking Error:', error)
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 })
  }
}
