'use client'

import { useState, useEffect } from 'react'
import { Check, X, Crown, Zap, Star, Megaphone, Ticket, PartyPopper, Rocket, ShieldCheck } from 'lucide-react'
import { GlassCard } from '@/components/glass-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { ApplyCoupon, CouponDiscountSummary } from '@/components/apply-coupon'
import { useAppliedCoupon, useCouponActions, useCoupons } from '@/hooks/use-coupon-store'
import { usePaymentConfig } from '@/hooks/use-payment-config'

interface PricingPlan {
  id: string
  name: string
  price: string
  priceValue: number
  period: string
  description: string
  icon: React.ElementType
  features: { text: string; included: boolean }[]
  accent: string
  variant: 'default' | 'gold' | 'premium'
  popular?: boolean
}

const PLANS: PricingPlan[] = [
  {
    id: 'basic', name: 'Basic', price: 'Free', priceValue: 0, period: '',
    description: 'Get started with basic visibility', icon: Zap,
    features: [
      { text: '1 Business Listing', included: true }, { text: 'Basic Profile Page', included: true },
      { text: 'WhatsApp Button', included: true }, { text: 'Featured Placement', included: false },
      { text: 'Analytics Dashboard', included: false }, { text: 'Priority Support', included: false },
    ],
    accent: 'text-gray-600', variant: 'default',
  },
  {
    id: 'pro', name: 'Pro', price: '₹299', priceValue: 299, period: '/mo',
    description: 'Grow your business reach', icon: Star,
    features: [
      { text: '5 Business Listings', included: true }, { text: 'Enhanced Profile', included: true },
      { text: 'WhatsApp + Lead Forms', included: true }, { text: 'Featured Placement', included: true },
      { text: 'Analytics Dashboard', included: true }, { text: 'Priority Support', included: false },
    ],
    accent: 'text-[#4169E1]', variant: 'default',
  },
  {
    id: 'premium', name: 'Premium', price: '₹499', priceValue: 499, period: '/mo',
    description: 'Maximum visibility & features', icon: Crown,
    features: [
      { text: 'Unlimited Listings', included: true }, { text: 'Premium Gold Profile', included: true },
      { text: 'All Lead Capture Tools', included: true }, { text: 'Top Featured Placement', included: true },
      { text: 'Full Analytics Suite', included: true }, { text: 'Priority 24/7 Support', included: true },
    ],
    accent: 'text-[#D4AF37]', variant: 'gold', popular: true,
  },
  {
    id: 'banner', name: 'Banner Ad', price: '₹99', priceValue: 99, period: '/day',
    description: 'Single day promotion blast', icon: Megaphone,
    features: [
      { text: '24hr Banner Placement', included: true }, { text: 'Homepage Visibility', included: true },
      { text: 'Click-through Tracking', included: true }, { text: 'Custom Design Support', included: false },
      { text: 'A/B Testing', included: false }, { text: 'Dedicated Manager', included: false },
    ],
    accent: 'text-orange-500', variant: 'default',
  },
]

export function PricingSection() {
  const { isAuthenticated, setShowLoginModal } = useAuth()
  const navigateTo = useAppStore((s) => s.navigateTo)
  const appliedCoupon = useAppliedCoupon()
  const { applyCoupon } = useCouponActions()
  const coupons = useCoupons()
  const { config: paymentConfig, isFreeLaunch } = usePaymentConfig()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successPlanName, setSuccessPlanName] = useState('')

  // ── Auto-apply LAUNCH100 coupon when in free launch mode ──
  useEffect(() => {
    if (!isFreeLaunch) return
    if (appliedCoupon) return // Already has a coupon applied

    const freeCode = paymentConfig.freeLaunchCouponCode
    // Check if the LAUNCH100 coupon exists in the coupon store
    const couponExists = coupons.some((c) => c.code === freeCode && c.isActive)
    if (!couponExists) return // Coupon not created yet

    // Auto-apply
    applyCoupon(freeCode, 499) // Use a reasonable cart total
  }, [isFreeLaunch, appliedCoupon, coupons, paymentConfig.freeLaunchCouponCode, applyCoupon])

  // ── Calculate discount per-plan ──
  const getDiscountedPrice = (plan: PricingPlan): number => {
    if (plan.priceValue <= 0) return 0
    if (isFreeLaunch) return 0 // Free launch = everything is free
    if (!appliedCoupon) return plan.priceValue
    if (appliedCoupon.discountType === 'percentage') {
      const pctDiscount = Math.round((plan.priceValue * appliedCoupon.discountValue) / 100)
      return Math.max(0, plan.priceValue - pctDiscount)
    }
    return Math.max(0, plan.priceValue - appliedCoupon.discountValue)
  }

  const hasActiveDiscount = isFreeLaunch || !!appliedCoupon

  // ── Subscribe handler ──
  const handleSubscribe = (planId: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }
    const plan = PLANS.find((p) => p.id === planId)
    if (!plan) return

    if (plan.priceValue <= 0) {
      // Basic/free plan — just navigate
      toast.success('Welcome! Your free listing is ready.')
      setTimeout(() => navigateTo('dashboard'), 1500)
      return
    }

    const discountedPrice = getDiscountedPrice(plan)

    if (isFreeLaunch || discountedPrice === 0) {
      // FREE LAUNCH: Skip checkout, directly activate
      setSuccessPlanName(plan.name)
      setShowSuccessModal(true)
      return
    }

    // Normal paid flow — open checkout modal
    setSelectedPlan(planId)
  }

  // ── Checkout handler (paid flow) ──
  const handleCheckout = () => {
    if (!selectedPlan) return
    const plan = PLANS.find((p) => p.id === selectedPlan)
    if (!plan) return
    const discountedPrice = getDiscountedPrice(plan)

    // If price is 0 after coupon, skip payment
    if (discountedPrice === 0) {
      setSelectedPlan(null)
      setSuccessPlanName(plan.name)
      setShowSuccessModal(true)
      return
    }

    // Otherwise, open Razorpay
    const saved = plan.priceValue - discountedPrice
    toast.success('Payment gateway opening...', {
      description: saved > 0
        ? `You're paying ₹${discountedPrice} (saved ₹${saved} with coupon!)`
        : `Amount: ₹${plan.priceValue}${plan.period}`,
      duration: 4000,
    })
    setSelectedPlan(null)
    setTimeout(() => navigateTo('dashboard'), 1500)
  }

  const checkoutPlan = PLANS.find((p) => p.id === selectedPlan)
  const checkoutDiscountedPrice = checkoutPlan ? getDiscountedPrice(checkoutPlan) : 0

  return (
    <section className="px-4 py-4">
      {/* ── Free Launch Banner ── */}
      {isFreeLaunch && (
        <div className="mb-5 rounded-2xl overflow-hidden bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 shadow-lg shadow-green-500/20">
          <div className="px-5 py-4 text-white">
            <div className="flex items-center gap-2.5 mb-1.5">
              <Rocket className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold">Limited Time Offer</h3>
            </div>
            <p className="text-sm font-medium text-white/90">
              {paymentConfig.freeListingMessage || '🎉 Early Bird Offer: Post Premium Listings for FREE!'}
            </p>
            <p className="text-xs text-white/70 mt-1">No Credit Card Required ✨</p>
          </div>
          {/* Decorative bottom edge */}
          <div className="h-1 bg-gradient-to-r from-yellow-300 via-white to-yellow-300 opacity-60" />
        </div>
      )}

      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1">💎 Pricing Plans</h2>
        <p className="text-sm text-gray-500">Choose the right plan for your business</p>
      </div>

      {/* ── Coupon Section (only show when not in free launch) ── */}
      {!isFreeLaunch && (
        <div className="mb-6">
          <ApplyCoupon
            cartTotal={checkoutPlan?.priceValue || 499}
            onCouponApplied={() => toast.success('Great! Your coupon will be applied at checkout')}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const discountedPrice = getDiscountedPrice(plan)
          const planHasDiscount = hasActiveDiscount && plan.priceValue > 0 && discountedPrice < plan.priceValue
          const isFree = isFreeLaunch && plan.priceValue > 0

          return (
            <GlassCard key={plan.id} variant={plan.variant} className="!p-4 h-full flex flex-col relative">
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-white text-[10px] font-bold border-0 shadow-md whitespace-nowrap">
                    👑 Most Popular
                  </Badge>
                </div>
              )}

              {/* Free launch badge on paid plans */}
              {isFree && (
                <div className="absolute -top-3 right-2">
                  <Badge className="bg-green-500 text-white text-[10px] font-bold border-0 shadow-md whitespace-nowrap">
                    🎉 FREE
                  </Badge>
                </div>
              )}

              <div className="flex items-center gap-2 mb-3 mt-1">
                <plan.icon className={`size-5 ${plan.accent}`} />
                <h3 className={`font-bold text-base ${plan.accent}`}>{plan.name}</h3>
              </div>
              <div className="mb-2">
                {isFree ? (
                  // FREE LAUNCH: Show strikethrough original price + FREE
                  <div>
                    <span className="text-sm text-gray-400 line-through decoration-red-400 decoration-2">{plan.price}</span>
                    <span className="text-2xl font-bold text-green-600 ml-2">FREE</span>
                    {plan.period && <span className="text-sm text-green-600">{plan.period}</span>}
                  </div>
                ) : planHasDiscount ? (
                  <div>
                    <span className="text-sm text-gray-400 line-through">{plan.price}</span>
                    <span className="text-2xl font-bold text-green-600 ml-1">₹{discountedPrice}</span>
                    {plan.period && <span className="text-sm text-gray-500">{plan.period}</span>}
                  </div>
                ) : (
                  <div>
                    <span className="text-2xl font-bold text-gray-800">{plan.price}</span>
                    {plan.period && <span className="text-sm text-gray-500">{plan.period}</span>}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3">{plan.description}</p>
              <div className="space-y-1.5 flex-1 mb-4">
                {plan.features.map((feature) => (
                  <div key={feature.text} className="flex items-center gap-2">
                    {feature.included ? <Check className="size-3.5 text-green-500 flex-shrink-0" /> : <X className="size-3.5 text-gray-300 flex-shrink-0" />}
                    <span className={`text-xs ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>{feature.text}</span>
                  </div>
                ))}
              </div>
              <div>
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full text-sm font-semibold transition-all duration-200 active:scale-95 ${
                    isFree
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md shadow-green-500/30'
                      : plan.popular
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] hover:from-[#C5A233] hover:to-[#A8882A] text-white shadow-md'
                      : plan.id === 'pro'
                      ? 'bg-[#4169E1] hover:bg-[#3457B5] text-white'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                  }`}
                >
                  {plan.price === 'Free' ? 'Get Started' : isFree ? '🎉 Get it for FREE' : 'Subscribe'}
                </Button>
              </div>
            </GlassCard>
          )
        })}
      </div>

      {/* ── Checkout Modal (paid flow) ── */}
      {selectedPlan && checkoutPlan && !isFreeLaunch && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedPlan(null) }}
        >
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#D4AF37] to-[#4169E1] px-6 py-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="w-5 h-5" />
                <h2 className="text-lg font-bold">Checkout</h2>
              </div>
              <p className="text-sm text-white/80">{checkoutPlan.name} Plan</p>
            </div>
            <div className="bg-white p-6 space-y-4">
              <CouponDiscountSummary originalTotal={checkoutPlan.priceValue} />
              <ApplyCoupon cartTotal={checkoutPlan.priceValue} className="!border-gray-100 !bg-gray-50/50" />
              <Button
                onClick={handleCheckout}
                className={`w-full font-bold h-12 text-base shadow-lg transition-all duration-200 active:scale-[0.98] ${
                  checkoutDiscountedPrice === 0
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                    : 'bg-gradient-to-r from-[#D4AF37] to-[#4169E1] hover:opacity-90 text-white'
                }`}
              >
                {checkoutDiscountedPrice === 0 ? '🎉 Activate for FREE' : `Pay ₹${checkoutDiscountedPrice} Now`}
              </Button>
              <button onClick={() => setSelectedPlan(null)} className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors text-center">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Modal (free launch or ₹0 checkout) ── */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSuccessModal(false) }}
        >
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Confetti-style gradient header */}
            <div className="bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 px-6 py-8 text-center text-white relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-2 left-3 w-8 h-8 rounded-full bg-white/10" />
              <div className="absolute bottom-3 right-4 w-12 h-12 rounded-full bg-white/10" />
              <div className="absolute top-4 right-8 w-5 h-5 rounded-full bg-yellow-300/30" />
              <PartyPopper className="w-12 h-12 mx-auto mb-3 drop-shadow-lg" />
              <h2 className="text-xl font-bold">Congratulations!</h2>
              <p className="text-sm text-white/80 mt-1">Your listing is now Premium 🎉</p>
            </div>
            <div className="p-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span className="text-base font-bold text-gray-800">
                  {successPlanName} Plan Activated!
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Your listing has been boosted to <strong className="text-gray-700">{successPlanName}</strong> status.
                Enjoy premium visibility and all the features!
              </p>
              {isFreeLaunch && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                  <p className="text-xs text-green-700 font-medium">
                    🚀 Early Bird Offer — You got this for <strong>FREE</strong>! No payment was required.
                  </p>
                </div>
              )}
              <Button
                onClick={() => {
                  setShowSuccessModal(false)
                  navigateTo('dashboard')
                }}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold h-11 shadow-md shadow-green-500/20 transition-all duration-200 active:scale-95"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
