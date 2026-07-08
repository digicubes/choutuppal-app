export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      return NextResponse.json(
        { error: 'Razorpay keys not configured' },
        { status: 500 }
      )
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!
    const keySecret = process.env.RAZORPAY_KEY_SECRET!

    const body = await request.json()
    const { amount, currency = 'INR', receipt } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'A valid amount is required' },
        { status: 400 }
      )
    }

    const orderPayload: Record<string, unknown> = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      payment_capture: 1,
    }

    if (receipt) {
      orderPayload.receipt = receipt
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(orderPayload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Razorpay order creation failed:', errorData)
      return NextResponse.json(
        { error: 'Failed to create Razorpay order' },
        { status: 500 }
      )
    }

    const order = await response.json()

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: keyId,
    })
  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    return NextResponse.json(
      { error: 'Failed to create Razorpay order' },
      { status: 500 }
    )
  }
}
