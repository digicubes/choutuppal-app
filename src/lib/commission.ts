/**
 * Commission Calculation Utility
 * 
 * Handles the franchisee & commission-based multi-tenant SaaS financial logic.
 * 
 * Commission Flow:
 * 1. Agent earns a % of total amount (from PlatformSetting `agent_commission_{type}`)
 * 2. Remaining amount after agent commission is split:
 *    - City Admin gets `city_admin_commission_share`% of the remaining
 *    - Super Admin gets the rest
 * 3. If no agent is involved, the full amount is split between City Admin and Super Admin
 */

export type TransactionType = 'LISTING' | 'BANNER' | 'NEWS_POST' | 'SUBSCRIPTION' | 'FRANCHISEE_FEE'

export interface CommissionBreakdown {
  agentCommission: number
  cityAdminShare: number
  superAdminShare: number
  totalAmount: number
  agentPercent: number
  cityAdminPercent: number
}

/**
 * Get the PlatformSetting key for an agent commission rate based on transaction type
 */
export function getAgentCommissionKey(type: TransactionType): string {
  const keyMap: Record<TransactionType, string> = {
    LISTING: 'agent_commission_listing',
    BANNER: 'agent_commission_banner',
    NEWS_POST: 'agent_commission_news_post',
    SUBSCRIPTION: 'agent_commission_subscription',
    FRANCHISEE_FEE: 'agent_commission_subscription', // fallback
  }
  return keyMap[type]
}

/**
 * Calculate commission breakdown for a transaction
 * 
 * @param amount - Total transaction amount
 * @param type - Transaction type (LISTING, BANNER, etc.)
 * @param hasAgent - Whether an agent is involved
 * @param platformSettings - Key-value map of platform settings
 * @returns CommissionBreakdown with all shares calculated
 */
export function calculateCommission(
  amount: number,
  type: TransactionType,
  hasAgent: boolean,
  platformSettings: Record<string, string>
): CommissionBreakdown {
  const agentCommissionKey = getAgentCommissionKey(type)
  const cityAdminCommissionKey = 'city_admin_commission_share'

  const getSetting = (key: string, defaultVal: number): number => {
    const val = platformSettings[key]
    if (!val) return defaultVal
    const parsed = parseFloat(val)
    return isNaN(parsed) ? defaultVal : parsed
  }

  const agentPercent = hasAgent ? getSetting(agentCommissionKey, 10) : 0
  const cityAdminPercent = getSetting(cityAdminCommissionKey, 30)

  let agentCommission = 0
  let cityAdminShare = 0
  let superAdminShare = 0

  if (hasAgent) {
    // Agent gets commission from total amount
    agentCommission = amount * (agentPercent / 100)
    // Remaining after agent commission is split between city admin and super admin
    const remaining = amount - agentCommission
    cityAdminShare = remaining * (cityAdminPercent / 100)
    superAdminShare = remaining - cityAdminShare
  } else {
    // No agent: full amount is split between city admin and super admin
    cityAdminShare = amount * (cityAdminPercent / 100)
    superAdminShare = amount - cityAdminShare
  }

  // Round to 2 decimal places
  agentCommission = Math.round(agentCommission * 100) / 100
  cityAdminShare = Math.round(cityAdminShare * 100) / 100
  superAdminShare = Math.round(superAdminShare * 100) / 100

  return {
    agentCommission,
    cityAdminShare,
    superAdminShare,
    totalAmount: amount,
    agentPercent,
    cityAdminPercent,
  }
}

/**
 * Format currency in Indian Rupees
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Get the price for a listing plan from platform settings
 */
export function getListingPrice(tier: 'pro' | 'premium', platformSettings: Record<string, string>): number {
  const key = tier === 'pro' ? 'listing_price_pro' : 'listing_price_premium'
  const val = platformSettings[key]
  if (!val) return tier === 'pro' ? 299 : 499
  const parsed = parseFloat(val)
  return isNaN(parsed) ? (tier === 'pro' ? 299 : 499) : parsed
}

/**
 * Get the franchisee fee from platform settings
 */
export function getFranchiseeFee(platformSettings: Record<string, string>): number {
  const val = platformSettings['city_admin_fee']
  if (!val) return 50000
  const parsed = parseFloat(val)
  return isNaN(parsed) ? 50000 : parsed
}

/**
 * Get minimum payout amount from platform settings
 */
export function getMinPayoutAmount(platformSettings: Record<string, string>): number {
  const val = platformSettings['min_payout_amount']
  if (!val) return 500
  const parsed = parseFloat(val)
  return isNaN(parsed) ? 500 : parsed
}
