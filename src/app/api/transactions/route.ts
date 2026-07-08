export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/transactions — List transactions with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const agentId = searchParams.get('agentId')
    const cityAdminId = searchParams.get('cityAdminId')
    const cityId = searchParams.get('cityId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (agentId) where.agentId = agentId
    if (cityAdminId) where.cityAdminId = cityAdminId
    if (cityId) where.cityId = cityId
    if (type) where.type = type
    if (status) where.status = status

    const transactions = await db.transaction.findMany({
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
          },
        },
        agent: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            role: true,
            avatarUrl: true,
            upiId: true,
          },
        },
        cityAdmin: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
        city: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json([])
  }
}

// POST /api/transactions — Create a transaction with commission calculation (Admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, agentId, cityId, type, amount, description } = body

    if (!userId || !cityId || !type || !amount) {
      return NextResponse.json(
        { error: 'userId, cityId, type, and amount are required' },
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

    // Validate valid transaction types
    const validTypes = ['LISTING', 'BANNER', 'NEWS_POST', 'SUBSCRIPTION', 'FRANCHISEE_FEE']
    const normalizedType = type.toUpperCase()
    if (!validTypes.includes(normalizedType)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User (buyer) not found' },
        { status: 404 }
      )
    }

    // Verify city exists
    const city = await db.city.findUnique({
      where: { id: cityId },
      include: { cityAdmins: true },
    })
    if (!city) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      )
    }

    // Find the city admin for this city
    const cityAdmin = city.cityAdmins.find((admin: { role: string }) => admin.role === 'city_admin')
    if (!cityAdmin) {
      return NextResponse.json(
        { error: 'No city admin found for this city' },
        { status: 400 }
      )
    }

    // Verify agent if provided
    if (agentId) {
      const agent = await db.user.findUnique({ where: { id: agentId } })
      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        )
      }
      if (agent.role !== 'agent' || !agent.isAgentApproved) {
        return NextResponse.json(
          { error: 'User is not an approved agent' },
          { status: 400 }
        )
      }
    }

    // ── Commission Calculation Engine ──────────────────────────
    // Fetch platform settings for commission rates
    const agentCommissionKey = `agent_commission_${normalizedType.toLowerCase()}`
    const cityAdminCommissionKey = 'city_admin_commission_share'

    const settings = await db.platformSetting.findMany({
      where: {
        key: { in: [agentCommissionKey, cityAdminCommissionKey] },
      },
    })

    const getSettingValue = (key: string, defaultVal: number): number => {
      const setting = settings.find((s) => s.key === key)
      if (!setting) return defaultVal
      const val = parseFloat(setting.value)
      return isNaN(val) ? defaultVal : val
    }

    const agentCommissionPercent = getSettingValue(agentCommissionKey, 10)
    const cityAdminCommissionShare = getSettingValue(cityAdminCommissionKey, 30)

    let agentCommission = 0
    let cityAdminShare = 0
    let superAdminShare = 0

    if (agentId) {
      // Agent gets commission from total amount
      agentCommission = parsedAmount * (agentCommissionPercent / 100)
      // Remaining after agent commission is split between city admin and super admin
      const remaining = parsedAmount - agentCommission
      cityAdminShare = remaining * (cityAdminCommissionShare / 100)
      superAdminShare = remaining - cityAdminShare
    } else {
      // No agent: full amount is split between city admin and super admin
      agentCommission = 0
      cityAdminShare = parsedAmount * (cityAdminCommissionShare / 100)
      superAdminShare = parsedAmount - cityAdminShare
    }

    // Round to 2 decimal places to avoid floating point issues
    agentCommission = Math.round(agentCommission * 100) / 100
    cityAdminShare = Math.round(cityAdminShare * 100) / 100
    superAdminShare = Math.round(superAdminShare * 100) / 100

    // Create the transaction
    const transaction = await db.transaction.create({
      data: {
        userId,
        agentId: agentId || null,
        cityAdminId: cityAdmin.id,
        cityId,
        type: normalizedType,
        amount: parsedAmount,
        agentCommission,
        cityAdminShare,
        superAdminShare,
        status: 'completed',
        description: description || null,
      },
      include: {
        user: {
          select: { id: true, fullName: true, phone: true, role: true },
        },
        agent: {
          select: { id: true, fullName: true, phone: true, role: true },
        },
        cityAdmin: {
          select: { id: true, fullName: true, phone: true, role: true },
        },
        city: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    // Update agent earnings if applicable
    if (agentId) {
      await db.user.update({
        where: { id: agentId },
        data: {
          totalEarnings: { increment: agentCommission },
          pendingPayout: { increment: agentCommission },
        },
      })
    }

    // Update city admin earnings
    await db.user.update({
      where: { id: cityAdmin.id },
      data: {
        totalEarnings: { increment: cityAdminShare },
        pendingPayout: { increment: cityAdminShare },
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
