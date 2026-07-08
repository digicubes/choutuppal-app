export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Check if user can spin (1 spin per day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayTransaction = await db.coinTransaction.findFirst({
      where: {
        userId: body.userId,
        reason: { contains: 'Spin wheel' },
        createdAt: { gte: today },
      },
    })

    if (todayTransaction) {
      return NextResponse.json(
        { error: 'You have already spun the wheel today. Come back tomorrow!' },
        { status: 400 }
      )
    }

    // Get active spin prizes
    const prizes = await db.spinPrize.findMany({
      where: { isActive: true },
    })

    if (prizes.length === 0) {
      return NextResponse.json(
        { error: 'No prizes available' },
        { status: 400 }
      )
    }

    // Weighted random selection based on probability
    const totalProbability = prizes.reduce((sum, p) => sum + p.probability, 0)
    let random = Math.random() * totalProbability
    let selectedPrize = prizes[0]

    for (const prize of prizes) {
      random -= prize.probability
      if (random <= 0) {
        selectedPrize = prize
        break
      }
    }

    // Process the prize
    let rewardAmount = 0
    let message = ''

    switch (selectedPrize.prizeType) {
      case 'coins': {
        rewardAmount = selectedPrize.prizeValue
        await db.coinTransaction.create({
          data: {
            userId: body.userId,
            amount: rewardAmount,
            reason: `Spin wheel prize: ${selectedPrize.label}`,
          },
        })
        await db.user.update({
          where: { id: body.userId },
          data: { coinsBalance: { increment: rewardAmount } },
        })
        message = `You won ${selectedPrize.label}!`
        break
      }
      case 'discount': {
        rewardAmount = selectedPrize.prizeValue
        await db.coinTransaction.create({
          data: {
            userId: body.userId,
            amount: rewardAmount,
            reason: `Spin wheel prize: ${selectedPrize.label}`,
          },
        })
        await db.user.update({
          where: { id: body.userId },
          data: { coinsBalance: { increment: rewardAmount } },
        })
        message = `You won ${selectedPrize.label}! Added as coins to your wallet.`
        break
      }
      case 'free_listing': {
        await db.coinTransaction.create({
          data: {
            userId: body.userId,
            amount: 0,
            reason: `Spin wheel prize: ${selectedPrize.label}`,
          },
        })
        message = `You won a Free Listing Day! Contact admin to redeem.`
        break
      }
      case 'none': {
        await db.coinTransaction.create({
          data: {
            userId: body.userId,
            amount: 0,
            reason: `Spin wheel: ${selectedPrize.label}`,
          },
        })
        message = 'Better luck next time! Try again tomorrow.'
        break
      }
    }

    return NextResponse.json({
      prize: {
        id: selectedPrize.id,
        label: selectedPrize.label,
        prizeType: selectedPrize.prizeType,
        prizeValue: selectedPrize.prizeValue,
        color: selectedPrize.color,
      },
      message,
      rewardAmount,
    })
  } catch (error) {
    console.error('Error processing spin:', error)
    return NextResponse.json(
      { error: 'Failed to process spin' },
      { status: 500 }
    )
  }
}
