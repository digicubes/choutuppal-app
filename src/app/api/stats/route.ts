export const dynamic = 'force-dynamic';
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // ── Core counts (existing) ──────────────────────────────────
    const [
      totalUsers,
      totalListings,
      totalLeads,
      approvedListings,
      featuredListings,
      premiumListings,
      totalReviews,
      totalSubscriptions,
      cities,
    ] = await Promise.all([
      db.user.count(),
      db.listing.count(),
      db.lead.count(),
      db.listing.count({ where: { isApproved: true } }),
      db.listing.count({ where: { isFeatured: true } }),
      db.listing.count({ where: { isPremium: true } }),
      db.review.count(),
      db.subscription.count({ where: { status: 'active' } }),
      db.city.findMany({
        include: {
          _count: {
            select: {
              listings: true,
              users: true,
              news: true,
              stories: true,
            },
          },
        },
      }),
    ])

    // ── Revenue calculation (subscription-based, existing) ──────
    const activeSubscriptions = await db.subscription.findMany({
      where: { status: 'active' },
      select: { plan: true },
    })
    const planPrices: Record<string, number> = { pro: 499, premium: 999 }
    const totalRevenue = activeSubscriptions.reduce((sum, sub) => sum + (planPrices[sub.plan] || 0), 0)

    // ── Group-by queries (existing) ─────────────────────────────
    const [leadsByStatus, listingsByCategory, usersByRole, subscriptionsByPlan] = await Promise.all([
      db.lead.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      db.listing.groupBy({
        by: ['category'],
        _count: { category: true },
        where: { isApproved: true },
      }),
      db.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      db.subscription.groupBy({
        by: ['plan'],
        _count: { plan: true },
        where: { status: 'active' },
      }),
    ])

    // ── Average rating (existing) ───────────────────────────────
    const reviews = await db.review.findMany({
      select: { rating: true },
    })
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0

    // ── Financial aggregates from Transaction table ─────────────
    const [
      transactionRevenueAgg,
      platformRevenueAgg,
      agentCommissionsAgg,
      cityAdminRevenueAgg,
      pendingPayoutsAgg,
      franchiseeFeesAgg,
      transactionsByTypeRaw,
      cityRevenueRaw,
    ] = await Promise.all([
      // 1. Total transaction-based revenue
      db.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'completed' },
      }),
      // 2. Total platform revenue (superAdminShare)
      db.transaction.aggregate({
        _sum: { superAdminShare: true },
        where: { status: 'completed' },
      }),
      // 3. Total agent commissions
      db.transaction.aggregate({
        _sum: { agentCommission: true },
        where: { status: 'completed' },
      }),
      // 4. Total city admin revenue
      db.transaction.aggregate({
        _sum: { cityAdminShare: true },
        where: { status: 'completed' },
      }),
      // 5. Pending payout totals
      db.payoutRequest.aggregate({
        _sum: { amount: true },
        where: { status: 'pending' },
      }),
      // 6. Total franchisee fees collected
      db.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'FRANCHISEE_FEE', status: 'completed' },
      }),
      // 7. Transaction counts by type
      db.transaction.groupBy({
        by: ['type'],
        _count: { type: true },
        _sum: { amount: true },
        where: { status: 'completed' },
      }),
      // 8. City-wise revenue breakdown
      db.transaction.groupBy({
        by: ['cityId'],
        _sum: {
          amount: true,
          agentCommission: true,
          cityAdminShare: true,
          superAdminShare: true,
        },
        _count: true,
        where: { status: 'completed' },
      }),
    ])

    // Build city name lookup for city-wise breakdown
    const cityMap = new Map(cities.map((c) => [c.id, c.name]))
    const cityRevenueBreakdown = cityRevenueRaw.map((row) => ({
      cityId: row.cityId,
      cityName: cityMap.get(row.cityId) || 'Unknown',
      totalRevenue: row._sum.amount || 0,
      agentCommissions: row._sum.agentCommission || 0,
      cityAdminShare: row._sum.cityAdminShare || 0,
      superAdminShare: row._sum.superAdminShare || 0,
      transactionCount: row._count,
    }))

    // ── Transaction revenue growth (last 6 months) ──────────────
    const now = new Date()
    const transactionRevenueGrowth: Array<{ month: string; revenue: number }> = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const agg = await db.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: 'completed',
          createdAt: { gte: monthStart, lt: monthEnd },
        },
      })
      transactionRevenueGrowth.push({
        month: monthStart.toLocaleDateString('en-IN', { month: 'short' }),
        revenue: agg._sum.amount || 0,
      })
    }

    // ── User growth over time (last 6 months, existing) ─────────
    const userGrowth: Array<{ month: string; users: number }> = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const count = await db.user.count({
        where: {
          createdAt: { gte: monthStart, lt: monthEnd },
        },
      })
      userGrowth.push({
        month: monthStart.toLocaleDateString('en-IN', { month: 'short' }),
        users: count,
      })
    }

    // ── Revenue over time from subscriptions (existing) ─────────
    const revenueGrowth: Array<{ month: string; revenue: number }> = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthSubscriptions = await db.subscription.findMany({
        where: {
          status: 'active',
          startDate: { gte: monthStart, lt: monthEnd },
        },
        select: { plan: true },
      })
      const monthRevenue = monthSubscriptions.reduce((sum, sub) => sum + (planPrices[sub.plan] || 0), 0)
      revenueGrowth.push({
        month: monthStart.toLocaleDateString('en-IN', { month: 'short' }),
        revenue: monthRevenue,
      })
    }

    // ── Most viewed listings (existing) ─────────────────────────
    const [mostViewedListings, whatsappClicks] = await Promise.all([
      db.listing.findMany({
        where: { isApproved: true },
        select: { id: true, name: true, category: true, viewsCount: true, slug: true },
        orderBy: { viewsCount: 'desc' },
        take: 5,
      }),
      db.lead.count({ where: { source: 'whatsapp' } }),
    ])

    // ── Build response ──────────────────────────────────────────
    return NextResponse.json({
      // Existing fields
      totalUsers,
      totalListings,
      totalLeads,
      approvedListings,
      featuredListings,
      premiumListings,
      totalReviews,
      totalActiveSubscriptions: totalSubscriptions,
      totalRevenue,
      averageRating: Math.round(avgRating * 10) / 10,
      cities,
      leadsByStatus: leadsByStatus.map((item) => ({
        status: item.status,
        count: item._count.status,
      })),
      listingsByCategory: listingsByCategory.map((item) => ({
        category: item.category,
        count: item._count.category,
      })),
      usersByRole: usersByRole.map((item) => ({
        role: item.role,
        count: item._count.role,
      })),
      userGrowth,
      revenueGrowth,
      subscriptionsByPlan: subscriptionsByPlan.map((item) => ({
        plan: item.plan,
        count: item._count.plan,
      })),
      mostViewedListings,
      whatsappClicks,

      // New financial fields
      totalTransactionRevenue: transactionRevenueAgg._sum.amount || 0,
      totalPlatformRevenue: platformRevenueAgg._sum.superAdminShare || 0,
      totalAgentCommissions: agentCommissionsAgg._sum.agentCommission || 0,
      totalCityAdminRevenue: cityAdminRevenueAgg._sum.cityAdminShare || 0,
      cityRevenueBreakdown,
      pendingPayouts: pendingPayoutsAgg._sum.amount || 0,
      transactionsByType: transactionsByTypeRaw.map((item) => ({
        type: item.type,
        count: item._count.type,
        totalAmount: item._sum.amount || 0,
      })),
      transactionRevenueGrowth,
      totalFranchiseeFees: franchiseeFeesAgg._sum.amount || 0,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    // Return safe default structure so frontend never breaks
    return NextResponse.json({
      totalUsers: 0,
      totalListings: 0,
      totalLeads: 0,
      approvedListings: 0,
      featuredListings: 0,
      premiumListings: 0,
      totalReviews: 0,
      totalActiveSubscriptions: 0,
      totalRevenue: 0,
      averageRating: 0,
      cities: [],
      leadsByStatus: [],
      listingsByCategory: [],
      usersByRole: [],
      userGrowth: [],
      revenueGrowth: [],
      subscriptionsByPlan: [],
      mostViewedListings: [],
      whatsappClicks: 0,
      // New financial defaults
      totalTransactionRevenue: 0,
      totalPlatformRevenue: 0,
      totalAgentCommissions: 0,
      totalCityAdminRevenue: 0,
      cityRevenueBreakdown: [],
      pendingPayouts: 0,
      transactionsByType: [],
      transactionRevenueGrowth: [],
      totalFranchiseeFees: 0,
    })
  }
}
