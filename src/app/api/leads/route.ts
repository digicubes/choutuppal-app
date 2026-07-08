export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}

    if (listingId) {
      where.listingId = listingId
    }
    if (userId) {
      where.userId = userId
    }
    if (status) {
      where.status = status
    }

    const leads = await db.lead.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.listingId || !body.customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: listingId, customerPhone' },
        { status: 400 }
      )
    }
    // Validate phone format (Indian mobile)
    const phone = String(body.customerPhone).trim()
    if (!/^[6-9]\d{9}$/.test(phone.replace(/^\+91/, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    const lead = await db.lead.create({
      data: {
        listingId: body.listingId,
        userId: body.userId || null,
        customerPhone: phone,
        customerName: body.customerName || null,
        requirementText: body.requirementText || null,
        source: body.source || 'form',
        status: body.status || 'new',
      },
      include: {
        listing: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    if (!body.leadId) {
      return NextResponse.json(
        { error: 'Missing required field: leadId' },
        { status: 400 }
      )
    }

    const existingLead = await db.lead.findUnique({
      where: { id: body.leadId },
    })

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    const updatedLead = await db.lead.update({
      where: { id: body.leadId },
      data: {
        status: body.status || 'contacted',
      },
      include: {
        listing: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json(updatedLead)
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}
