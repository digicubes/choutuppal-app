'use client'

import { useState } from 'react'
import { Ticket, Check, X, Loader2, Tag, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAppliedCoupon, useCouponActions } from '@/hooks/use-coupon-store'
import { toast } from 'sonner'

interface ApplyCouponProps {
  cartTotal: number
  onCouponApplied?: (discount: number) => void
  onCouponRemoved?: () => void
  className?: string
}

export function ApplyCoupon({ cartTotal, onCouponApplied, onCouponRemoved, className }: ApplyCouponProps) {
  const appliedCoupon = useAppliedCoupon()
  const { applyCoupon, removeAppliedCoupon } = useCouponActions()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleApply = async () => {
    if (!code.trim()) {
      toast.error('Please enter a coupon code')
      return
    }

    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))

    const result = applyCoupon(code, cartTotal)

    setLoading(false)

    if (result.success && result.coupon) {
      toast.success('Coupon applied!', {
        description: `You saved ₹${result.coupon.discountAmount}`,
      })
      setCode('')
      onCouponApplied?.(result.coupon.discountAmount)
    } else {
      toast.error(result.error || 'Invalid or expired coupon')
    }
  }

  const handleRemove = () => {
    removeAppliedCoupon()
    onCouponRemoved?.()
    toast.info('Coupon removed')
  }

  if (appliedCoupon) {
    return (
      <div className={`rounded-xl border border-green-200 bg-green-50/60 p-4 ${className || ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-100 shrink-0">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">
                Coupon <code className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-mono text-xs">{appliedCoupon.code}</code> applied!
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                {appliedCoupon.discountType === 'percentage'
                  ? `${appliedCoupon.discountValue}% discount`
                  : `₹${appliedCoupon.discountValue} off`}
                {' — You save '}
                <span className="font-bold">₹{appliedCoupon.discountAmount}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="p-1.5 rounded-lg hover:bg-green-100 text-green-500 hover:text-green-700 transition-colors shrink-0"
            title="Remove coupon"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-4 ${className || ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-4 h-4 text-[#D4AF37]" />
        <span className="text-sm font-semibold text-gray-800">Have a coupon?</span>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter') handleApply() }}
            className="pl-10 h-10 uppercase font-mono tracking-wider border-gray-200 text-gray-800 placeholder:text-gray-400"
            disabled={loading}
          />
        </div>
        <Button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="h-10 px-5 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] hover:from-[#C9A533] hover:to-[#A88518] text-white font-semibold shadow-md"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
        </Button>
      </div>
      <p className="text-[10px] text-gray-400 mt-1.5">Coupon codes are case-insensitive</p>
    </div>
  )
}

/**
 * CouponDiscountSummary — Shows pricing breakdown with coupon discount.
 * Uses useAppliedCoupon() selector (returns a primitive-friendly value).
 * Computes total directly instead of using getDiscountedTotal function.
 */
export function CouponDiscountSummary({
  originalTotal,
  className,
}: {
  originalTotal: number
  className?: string
}) {
  const appliedCoupon = useAppliedCoupon()
  const discount = appliedCoupon?.discountAmount ?? 0
  const finalTotal = Math.max(0, originalTotal - discount)

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Subtotal</span>
        <span className="text-gray-800 font-medium">₹{originalTotal}</span>
      </div>
      {appliedCoupon && discount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-green-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Coupon Discount ({appliedCoupon.code})
          </span>
          <span className="text-green-600 font-medium">-₹{discount}</span>
        </div>
      )}
      <div className="flex justify-between text-base pt-2 border-t border-gray-100">
        <span className="font-bold text-gray-800">Total</span>
        <span className="font-bold text-gray-800">₹{finalTotal}</span>
      </div>
    </div>
  )
}
