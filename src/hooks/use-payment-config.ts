'use client'

import { useState, useCallback, useEffect } from 'react'


// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentConfig {
  /** Whether the Razorpay payment gateway is active. Default: false (free launch) */
  paymentGatewayEnabled: boolean
  /** Banner message shown on pricing page when gateway is OFF */
  freeListingMessage: string
  /** The auto-applied 100% coupon code when gateway is OFF */
  freeLaunchCouponCode: string
}

const STORAGE_KEY = 'manaPaymentConfig'

const DEFAULT_CONFIG: PaymentConfig = {
  paymentGatewayEnabled: false,
  freeListingMessage: '🎉 Early Bird Offer: Post Premium Listings for FREE!',
  freeLaunchCouponCode: 'LAUNCH100',
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePaymentConfig() {
  const [config, setConfig] = useState<PaymentConfig>(DEFAULT_CONFIG)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(stored) })
      }
    } catch {
      // Use defaults
    } finally {
      setIsLoaded(true)
    }
  }, [])

  const saveConfig = useCallback((updates: Partial<PaymentConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
      } catch {
        // LocalStorage full or unavailable
      }
      return newConfig
    })
  }, [])

  const togglePaymentGateway = useCallback((enabled: boolean) => {
    saveConfig({ paymentGatewayEnabled: enabled })
  }, [saveConfig])

  const updateFreeListingMessage = useCallback((message: string) => {
    saveConfig({ freeListingMessage: message })
  }, [saveConfig])

  return {
    config,
    isLoaded,
    saveConfig,
    togglePaymentGateway,
    updateFreeListingMessage,
    /** Whether the app is in "free launch" mode (payment gateway OFF) */
    isFreeLaunch: !config.paymentGatewayEnabled,
  }
}

// ─── Standalone reader (for non-hook contexts) ────────────────────────────────

export function getPaymentConfig(): PaymentConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) }
  } catch {
    // Use defaults
  }
  return DEFAULT_CONFIG
}
