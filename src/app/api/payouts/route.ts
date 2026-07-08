export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/payouts — List payout requests with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (status && ['pending', 'approved', 'rejected', 'paid'].includes(status)) {
      where.status = status
    }

    const payouts = await db.payoutRequest.findMany({
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
            upiId: true,
            bankDetails: true,
            totalEarnings: true,
            pendingPayout: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(payouts)
  } catch (error) {
    console.error('Error fetching payout requests:', error)
    return NextResponse.json([])
  }
}

// POST /api/payouts — Create a payout request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, upiId, bankDetails } = body

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'userId and amount are required' },
        { status: 400 }
      )
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 }
      )
    }

    // Verify user exists and is an agent or city_admin
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!['agent', 'city_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only agents and city admins can request payouts' },
        { status: 400 }
      )
    }

    // Check if user has sufficient pending payout balance
    if (user.pendingPayout < parsedAmount) {
      return NextResponse.json(
        { error: `Insufficient pending payout balance. Available: ₹${user.pendingPayout}, Requested: ₹${parsedAmount}` },
        { status: 400 }
      )
    }

    const payoutRequest = await db.payoutRequest.create({
      data: {
        userId,
        amount: parsedAmount,
        upiId: upiId || user.upiId || null,
        bankDetails: bankDetails || user.bankDetails || null,
        status: 'pending',
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
            upiId: true,
            bankDetails: true,
            totalEarnings: true,
            pendingPayout: true,
          },
        },
      },
    })

    return NextResponse.json(payoutRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating payout request:', error)
    return NextResponse.json(
      { error: 'Failed to create payout request' },
      { status: 500 }
    )
  }
}

// PATCH /api/payouts — Approve, reject, or mark payout as paid (Admin only)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { payoutId, action, note, adminUserId } = body

    // RBAC: Verify admin user for payout actions
    if (adminUserId) {
      const adminUser = await db.user.findUnique({
        where: { id: adminUserId },
        select: { role: true },
      })
      if (!adminUser || !['super_admin', 'city_admin'].includes(adminUser.role)) {
        return NextResponse.json(
          { error: 'Only admins can approve/reject payouts' },
          { status: 403 }
        )
      }
    }

    if (!payoutId || !action) {
      return NextResponse.json(
        { error: 'payoutId and action are required' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject', 'paid'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approve", "reject", or "paid"' },
        { status: 400 }
      )
    }

    // Fetch the existing payout request
    const payoutRequest = await db.payoutRequest.findUnique({
      where: { id: payoutId },
      include: { user: true },
    })

    if (!payoutRequest) {
      return NextResponse.json(
        { error: 'Payout request not found' },
        { status: 404 }
      )
    }

    // Status transition validation
    const statusTransitions: Record<string, string[]> = {
      pending: ['approved', 'rejected'],
      approved: ['paid', 'rejected'],
      rejected: [],
      paid: [],
    }

    const newStatus =
      action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'paid'

    if (!statusTransitions[payoutRequest.status]?.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot change status from "${payoutRequest.status}" to "${newStatus}"` },
        { status: 400 }
      )
    }

    // Update the payout request
    const updated = await db.payoutRequest.update({
      where: { id: payoutId },
      data: {
        status: newStatus,
        note: note || null,
        updatedAt: new Date(),
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
            upiId: true,
            bankDetails: true,
            totalEarnings: true,
            pendingPayout: true,
          },
        },
      },
    })

    // When marked as paid, deduct from user's pendingPayout
    if (action === 'paid') {
      await db.user.update({
        where: { id: payoutRequest.userId },
        data: {
          pendingPayout: { decrement: payoutRequest.amount },
        },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating payout request:', error)
    return NextResponse.json(
      { error: 'Failed to update payout request' },
      { status: 500 }
    )
  }
}
