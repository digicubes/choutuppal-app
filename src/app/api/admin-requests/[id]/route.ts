export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/admin-requests/[id] — Approve or reject an admin request
// Handles both city_admin and agent request types
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, franchiseeFeePaid, razorpayPaymentId } = body

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be "approved" or "rejected"' },
        { status: 400 }
      )
    }

    // Fetch the existing request
    const existingRequest = await db.adminRequest.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Admin request not found' },
        { status: 404 }
      )
    }

    if (existingRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'This request has already been processed' },
        { status: 400 }
      )
    }

    // Prepare update data for the admin request
    const requestUpdateData: Record<string, unknown> = { status }
    if (franchiseeFeePaid !== undefined) {
      requestUpdateData.franchiseeFeePaid = franchiseeFeePaid
    }
    if (razorpayPaymentId !== undefined) {
      requestUpdateData.razorpayPaymentId = razorpayPaymentId
    }

    // Update the request status
    const updatedRequest = await db.adminRequest.update({
      where: { id },
      data: requestUpdateData,
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

    // If approved, update user based on request type
    if (status === 'approved') {
      const requestType = existingRequest.type || 'city_admin'

      if (requestType === 'city_admin') {
        // City Admin approval: set role to city_admin and assign managedCityId
        let city = await db.city.findFirst({
          where: {
            name: {
              equals: existingRequest.cityName,
            },
          },
        })

        if (!city) {
          // Create the city with a slug derived from the name
          const slug = existingRequest.cityName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

          city = await db.city.create({
            data: {
              name: existingRequest.cityName,
              slug,
              subdomain: slug,
            },
          })
        }

        // Update user: set role to city_admin and assign managedCityId
        await db.user.update({
          where: { id: existingRequest.userId },
          data: {
            role: 'city_admin',
            managedCityId: city.id,
          },
        })
      } else if (requestType === 'agent') {
        // Agent approval: set role to agent, agentCityId, and isAgentApproved
        const agentCityId = existingRequest.agentCityId

        if (!agentCityId) {
          return NextResponse.json(
            { error: 'Agent request has no agentCityId specified' },
            { status: 400 }
          )
        }

        // Verify the city exists
        const city = await db.city.findUnique({ where: { id: agentCityId } })
        if (!city) {
          return NextResponse.json(
            { error: 'Agent city not found' },
            { status: 400 }
          )
        }

        // Update user: set role to agent, assign agentCityId, approve agent
        await db.user.update({
          where: { id: existingRequest.userId },
          data: {
            role: 'agent',
            agentCityId,
            isAgentApproved: true,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    })
  } catch (error) {
    console.error('Error updating admin request:', error)
    return NextResponse.json(
      { error: 'Failed to update admin request' },
      { status: 500 }
    )
  }
}
