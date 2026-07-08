export const dynamic = 'force-dynamic';
import crypto from 'crypto'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Razorpay keys not configured' },
        { status: 500 }
      )
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET!

    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature' },
        { status: 400 }
      )
    }

    const hmac = crypto.createHmac('sha256', keySecret)
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id)
    const expectedSignature = hmac.digest('hex')

    const verified = expectedSignature === razorpay_signature

    return NextResponse.json({ verified })
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
