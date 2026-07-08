'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Coupon {
  id: string
  code: string
  discountType: 'percentage' | 'flat'
  discountValue: number
  minimumPurchase: number
  expiryDate: string
  maxUsage: number
  currentUsage: number
  isActive: boolean
  createdAt: string
  description?: string
}

export interface AppliedCoupon {
  code: string
  discountType: 'percentage' | 'flat'
  discountValue: number
  discountAmount: number
  minimumPurchase: number
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function generateCouponCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface CouponState {
  // Data
  coupons: Coupon[]
  appliedCoupon: AppliedCoupon | null
  _hasSeeded?: boolean

  // Actions
  addCoupon: (data: Omit<Coupon, 'id' | 'code' | 'currentUsage' | 'createdAt'> & { code?: string }) => Coupon
  updateCoupon: (id: string, data: Partial<Coupon>) => void
  deleteCoupon: (id: string) => void
  toggleCouponStatus: (id: string) => void
  applyCoupon: (code: string, cartTotal: number) => { success: boolean; error?: string; coupon?: AppliedCoupon }
  removeAppliedCoupon: () => void
  getDiscountedTotal: (cartTotal: number) => number
  generateCode: () => string
}

// ─── Zustand Store ────────────────────────────────────────────────────────────
//
// ARCHITECTURE DECISION: WHY ZUSTAND + persist
//
// PREVIOUS BUGS (useSyncExternalStore + localStorage):
//   useSyncExternalStore's getSnapshot MUST return the exact same JS object
//   reference when data hasn't changed. JSON.parse(localStorage.getItem(...))
//   ALWAYS creates new objects. This caused an infinite re-render loop.
//
//   Module-level caching (comparing raw strings) still failed in React 18
//   concurrent mode and Strict Mode double-invocation.
//
//   useState + useEffect + custom events still had edge cases with
//   synchronous setState in effects and cross-tab sync.
//
// WHY ZUSTAND + persist FIXES THIS:
//   1. State lives in JS memory (Zustand store). getSnapshot returns a
//      reference to the SAME internal state object until set() is called.
//   2. localStorage is ONLY a write-through persistence layer — never read
//      during render.
//   3. Hydration from localStorage happens asynchronously after first render,
//      so server and client initial renders match (both empty).
//   4. No useSyncExternalStore, no getSnapshot, no ref tricks needed.
//   5. useShallow ensures selectors that return objects/arrays compare by
//      value, not reference — no false-positive re-renders.

export const useCouponStore = create<CouponState>()(
  persist(
    (set, get) => ({
      coupons: [],
      appliedCoupon: null,

      // ─── Seed default launch coupon on first load ──────────────────────
      _hasSeeded: false,

      // ─── CRUD ───────────────────────────────────────────────────────────

      addCoupon: (data) => {
        const newCoupon: Coupon = {
          id: `coupon-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          code: data.code?.toUpperCase() || generateCouponCode(),
          discountType: data.discountType,
          discountValue: data.discountValue,
          minimumPurchase: data.minimumPurchase || 0,
          expiryDate: data.expiryDate,
          maxUsage: data.maxUsage || 100,
          currentUsage: 0,
          isActive: data.isActive,
          createdAt: new Date().toISOString(),
          description: data.description,
        }
        set((state) => ({ coupons: [...state.coupons, newCoupon] }))
        return newCoupon
      },

      updateCoupon: (id, data) => {
        set((state) => ({
          coupons: state.coupons.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }))
      },

      deleteCoupon: (id) => {
        set((state) => ({
          coupons: state.coupons.filter((c) => c.id !== id),
        }))
      },

      toggleCouponStatus: (id) => {
        set((state) => ({
          coupons: state.coupons.map((c) =>
            c.id === id ? { ...c, isActive: !c.isActive } : c
          ),
        }))
      },

      // ─── Apply / Remove ─────────────────────────────────────────────────

      applyCoupon: (code, cartTotal) => {
        const upperCode = code.toUpperCase().trim()
        const allCoupons = get().coupons
        const coupon = allCoupons.find((c) => c.code === upperCode)

        if (!coupon) return { success: false, error: 'Invalid coupon code' }
        if (!coupon.isActive) return { success: false, error: 'This coupon is no longer active' }
        if (new Date(coupon.expiryDate) < new Date()) return { success: false, error: 'This coupon has expired' }
        if (coupon.currentUsage >= coupon.maxUsage) return { success: false, error: 'This coupon has reached its usage limit' }
        if (coupon.minimumPurchase > 0 && cartTotal < coupon.minimumPurchase) return { success: false, error: `Minimum purchase of ₹${coupon.minimumPurchase} required` }

        let discountAmount: number
        if (coupon.discountType === 'percentage') {
          discountAmount = Math.round((cartTotal * coupon.discountValue) / 100)
          if (discountAmount > cartTotal) discountAmount = cartTotal
        } else {
          discountAmount = coupon.discountValue
          if (discountAmount > cartTotal) discountAmount = cartTotal
        }

        const applied: AppliedCoupon = {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount,
          minimumPurchase: coupon.minimumPurchase,
        }

        // Single atomic set — updates coupons AND appliedCoupon together
        set({
          coupons: allCoupons.map((c) =>
            c.code === upperCode ? { ...c, currentUsage: c.currentUsage + 1 } : c
          ),
          appliedCoupon: applied,
        })

        return { success: true, coupon: applied }
      },

      removeAppliedCoupon: () => {
        set({ appliedCoupon: null })
      },

      getDiscountedTotal: (cartTotal: number) => {
        const discount = get().appliedCoupon?.discountAmount || 0
        return Math.max(0, cartTotal - discount)
      },

      generateCode: () => generateCouponCode(),
    }),
    {
      name: 'choutuppal_coupon_store',
      partialize: (state) => ({
        coupons: state.coupons,
        appliedCoupon: state.appliedCoupon,
        _hasSeeded: state._hasSeeded,
      }),
      // After hydration, seed the LAUNCH100 coupon if not already present
      onRehydrateStorage: () => (state) => {
        if (state && !state._hasSeeded) {
          const hasLaunch100 = state.coupons.some((c) => c.code === 'LAUNCH100')
          if (!hasLaunch100) {
            state.coupons.push({
              id: 'coupon-launch100-seed',
              code: 'LAUNCH100',
              discountType: 'percentage',
              discountValue: 100,
              minimumPurchase: 0,
              expiryDate: '2026-12-31',
              maxUsage: 99999,
              currentUsage: 0,
              isActive: true,
              createdAt: new Date().toISOString(),
              description: 'Launch offer — 100% off all paid plans during free launch period',
            })
          }
          state._hasSeeded = true
        }
      },
    }
  )
)

// ─── Selector Hooks ───────────────────────────────────────────────────────────
//
// ALL consumers MUST use these pre-built selector hooks instead of calling
// useCouponStore() directly. This ensures useShallow is always used for
// object/array selections, preventing infinite loops from new references.
//
// RULE: Never do   const { coupons, appliedCoupon } = useCouponStore()
//        Always do  const { coupons, appliedCoupon } = useCouponData()

export function useCouponData() {
  return useCouponStore(
    useShallow((state) => ({
      coupons: state.coupons,
      appliedCoupon: state.appliedCoupon,
    }))
  )
}

export function useCouponActions() {
  return useCouponStore(
    useShallow((state) => ({
      addCoupon: state.addCoupon,
      updateCoupon: state.updateCoupon,
      deleteCoupon: state.deleteCoupon,
      toggleCouponStatus: state.toggleCouponStatus,
      applyCoupon: state.applyCoupon,
      removeAppliedCoupon: state.removeAppliedCoupon,
      getDiscountedTotal: state.getDiscountedTotal,
      generateCode: state.generateCode,
    }))
  )
}

// Single-field selectors — these return primitives, so useShallow isn't needed
export function useAppliedCoupon() {
  return useCouponStore((state) => state.appliedCoupon)
}

export function useCoupons() {
  return useCouponStore((state) => state.coupons)
}
