export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { coinsBalance: true },
    })

    // Return default response if user not found (e.g., demo users)
    if (!user) {
      const transactions = await db.coinTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({
        balance: 0,
        transactions,
      })
    }

    const transactions = await db.coinTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      balance: user.coinsBalance,
      transactions,
    })
  } catch (error) {
    console.error('Error fetching coins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coin data' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.userId || !body.action) {
      return NextResponse.json(
        { error: 'userId and action are required' },
        { status: 400 }
      )
    }

    const { userId, action, amount, reason } = body

    if (action === 'dailyClaim') {
      // Check if already claimed today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const existingClaim = await db.coinTransaction.findFirst({
        where: {
          userId,
          reason: 'Daily login reward',
          createdAt: { gte: today },
        },
      })

      if (existingClaim) {
        return NextResponse.json(
          { error: 'Daily coins already claimed today' },
          { status: 400 }
        )
      }

      // Award daily coins
      const dailyAmount = 10
      await db.coinTransaction.create({
        data: {
          userId,
          amount: dailyAmount,
          reason: 'Daily login reward',
        },
      })

      const updatedUser = await db.user.update({
        where: { id: userId },
        data: { coinsBalance: { increment: dailyAmount } },
      })

      return NextResponse.json({
        message: 'Daily coins claimed!',
        amount: dailyAmount,
        newBalance: updatedUser.coinsBalance,
      })
    }

    if (action === 'earn') {
      if (!amount || !reason) {
        return NextResponse.json(
          { error: 'amount and reason are required for earn action' },
          { status: 400 }
        )
      }

      await db.coinTransaction.create({
        data: { userId, amount, reason },
      })

      const updatedUser = await db.user.update({
        where: { id: userId },
        data: { coinsBalance: { increment: amount } },
      })

      return NextResponse.json({
        message: 'Coins earned!',
        amount,
        newBalance: updatedUser.coinsBalance,
      })
    }

    if (action === 'redeem') {
      if (!amount || !reason) {
        return NextResponse.json(
          { error: 'amount and reason are required for redeem action' },
          { status: 400 }
        )
      }

      const result = await db.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } })
        if (!user || user.coinsBalance < amount) throw new Error('Insufficient coins')
        await tx.user.update({
          where: { id: userId },
          data: { coinsBalance: { decrement: amount } },
        })
        await tx.coinTransaction.create({
          data: { userId, amount: -amount, reason },
        })
        return user
      }).catch(() => null)

      if (!result) {
        return NextResponse.json(
          { error: 'Insufficient coin balance' },
          { status: 400 }
        )
      }

      const updatedUser = await db.user.findUnique({
        where: { id: userId },
        select: { coinsBalance: true },
      })

      return NextResponse.json({
        message: 'Coins redeemed!',
        amount,
        newBalance: updatedUser?.coinsBalance ?? 0,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: dailyClaim, earn, or redeem' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing coins:', error)
    return NextResponse.json(
      { error: 'Failed to process coin action' },
      { status: 500 }
    )
  }
}
