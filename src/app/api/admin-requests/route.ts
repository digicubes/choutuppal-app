export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin-requests — List admin requests with optional status and type filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      where.status = status
    }
    if (type && ['city_admin', 'agent'].includes(type)) {
      where.type = type
    }

    const requests = await db.adminRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            role: true,
            avatarUrl: true,
            agentCityId: true,
            isAgentApproved: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching admin requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin requests' },
      { status: 500 }
    )
  }
}

// POST /api/admin-requests — Create a new admin request (city_admin or agent)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, cityName, reason, type, agentCityId } = body

    if (!userId || !cityName) {
      return NextResponse.json(
        { error: 'userId and cityName are required' },
        { status: 400 }
      )
    }

    const requestType = type || 'city_admin'
    if (!['city_admin', 'agent'].includes(requestType)) {
      return NextResponse.json(
        { error: 'type must be "city_admin" or "agent"' },
        { status: 400 }
      )
    }

    // For agent requests, agentCityId is required
    if (requestType === 'agent' && !agentCityId) {
      return NextResponse.json(
        { error: 'agentCityId is required for agent requests' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already has a pending request of the same type
    const existingRequest = await db.adminRequest.findFirst({
      where: {
        userId,
        type: requestType,
        status: 'pending',
        ...(requestType === 'agent' ? { agentCityId } : { cityName }),
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: `You already have a pending ${requestType} request${requestType === 'agent' ? ' for this city' : ' for this city'}` },
        { status: 409 }
      )
    }

    const adminRequest = await db.adminRequest.create({
      data: {
        userId,
        cityName,
        reason: reason || null,
        type: requestType,
        agentCityId: requestType === 'agent' ? agentCityId : null,
        franchiseeFeePaid: false,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            role: true,
            avatarUrl: true,
            agentCityId: true,
            isAgentApproved: true,
          },
        },
      },
    })

    return NextResponse.json(adminRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating admin request:', error)
    return NextResponse.json(
      { error: 'Failed to create admin request' },
      { status: 500 }
    )
  }
}
