export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const subscriptions = await db.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    const activeSubscription = subscriptions.find(s => s.status === 'active')

    return NextResponse.json({
      subscriptions,
      active: activeSubscription || null,
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.userId || !body.plan) {
      return NextResponse.json({ error: 'userId and plan are required' }, { status: 400 })
    }

    // Expire any existing active subscription
    await db.subscription.updateMany({
      where: { userId: body.userId, status: 'active' },
      data: { status: 'expired' },
    })

    // Create new subscription
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1) // 1 month subscription

    const subscription = await db.subscription.create({
      data: {
        userId: body.userId,
        plan: body.plan,
        status: 'active',
        razorpayPaymentId: body.razorpayPaymentId || null,
        startDate: new Date(),
        endDate,
      },
    })

    // Update user subscription tier
    await db.user.update({
      where: { id: body.userId },
      data: { subscriptionTier: body.plan },
    })

    return NextResponse.json(subscription, { status: 201 })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
