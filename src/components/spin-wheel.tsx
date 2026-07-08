'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Award, Ticket, Copy, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { useCouponActions } from '@/hooks/use-coupon-store'
import { toast } from 'sonner'

interface SpinSegment {
  id?: string
  label: string
  value: number
  color: string
  type: 'coins' | 'coupon' | 'discount' | 'free_listing' | 'none'
  probability: number
  couponDiscount?: number
}

// Fallback segments if API fails
const FALLBACK_SEGMENTS: SpinSegment[] = [
  { label: '5 Coins', value: 5, color: '#D4AF37', type: 'coins', probability: 0.2 },
  { label: '10% Off', value: 0, color: '#E74C3C', type: 'coupon', couponDiscount: 10, probability: 0.1 },
  { label: 'Try Again', value: 0, color: '#9E9E9E', type: 'none', probability: 0.5 },
  { label: '50 Coins', value: 50, color: '#FF6B35', type: 'coins', probability: 0.1 },
  { label: '25% Off', value: 0, color: '#9B59B6', type: 'coupon', couponDiscount: 25, probability: 0.05 },
  { label: 'Jackpot', value: 500, color: '#8E24AA', type: 'coins', probability: 0.05 },
]

export default function SpinWheel() {
  const showSpinWheel = useAppStore((s) => s.showSpinWheel)
  const setShowSpinWheel = useAppStore((s) => s.setShowSpinWheel)
  const currentUser = useAppStore((s) => s.currentUser)
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)
  const { addCoupon } = useCouponActions()

  const [segments, setSegments] = useState<SpinSegment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<SpinSegment | null>(null)
  const [wonCouponCode, setWonCouponCode] = useState<string | null>(null)

  // Fetch prizes on mount
  useEffect(() => {
    setIsLoading(true)
    fetch('/api/admin/spin-prizes')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSegments(data.map(p => ({
            id: p.id,
            label: p.label,
            value: p.prizeValue,
            color: p.color || '#D4AF37',
            type: p.prizeType,
            probability: p.probability || 0.1,
            couponDiscount: p.prizeType === 'discount' ? p.prizeValue : undefined
          })))
        } else {
          setSegments(FALLBACK_SEGMENTS)
        }
      })
      .catch(() => setSegments(FALLBACK_SEGMENTS))
      .finally(() => setIsLoading(false))
  }, [])

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('Coupon code copied to clipboard!', { description: `Use ${code} at checkout` })
    }).catch(() => {
      toast.info(`Your coupon code: ${code}`)
    })
  }

  const handleSpin = async () => {
    if (isSpinning || segments.length === 0) return
    if (!currentUser) {
      toast.error('Please login to spin the wheel!')
      return
    }
    
    setIsSpinning(true)
    setResult(null)
    setWonCouponCode(null)

    const totalProb = segments.reduce((sum, s) => sum + s.probability, 0) || 1
    let random = Math.random() * totalProb
    let winningIndex = 0
    let currentProbSum = 0

    for (let i = 0; i < segments.length; i++) {
      currentProbSum += segments[i].probability
      if (random <= currentProbSum) {
        winningIndex = i
        break
      }
    }
    const winningSegment = segments[winningIndex]

    // Calculate rotation to make the winning segment land at 270 degrees (top pointer)
    let angleSum = 0
    for(let i = 0; i < winningIndex; i++){
       angleSum += (segments[i].probability / totalProb) * 360
    }
    const sliceAngle = (winningSegment.probability / totalProb) * 360
    const targetAngle = 270 - (angleSum + sliceAngle / 2)
    const fullSpins = 5 + Math.floor(Math.random() * 3)
    const totalRotation = fullSpins * 360 + targetAngle

    setRotation((prev) => prev + totalRotation)

    setTimeout(async () => {
      setIsSpinning(false)
      setResult(winningSegment)

      if (winningSegment.type === 'coins' && winningSegment.value > 0) {
        setCurrentUser({
          ...currentUser,
          coinsBalance: (currentUser.coinsBalance || 0) + winningSegment.value,
        })
        toast.success(`You won ${winningSegment.value} coins!`)
      } else if ((winningSegment.type === 'coupon' || winningSegment.type === 'discount' || winningSegment.type === 'free_listing') && winningSegment.value > 0) {
        const newCoupon = addCoupon({
          discountType: 'percentage',
          discountValue: winningSegment.value,
          minimumPurchase: 0,
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          maxUsage: 1,
          isActive: true,
          description: `Spin & Win: ${winningSegment.label}`,
        })
        setWonCouponCode(newCoupon.code)
        toast.success(`🎉 You won a discount coupon!`, {
          description: `Code: ${newCoupon.code} — copied to clipboard!`,
          duration: 5000,
        })
        try { await navigator.clipboard.writeText(newCoupon.code) } catch { /* non-critical */ }
      } else if (winningSegment.type === 'none') {
        toast.info('Better luck next time! Spin again tomorrow.')
      }

      try {
        await fetch('/api/spin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id }),
        })
      } catch { /* API not available */ }
    }, 4000)
  }

  // SVG parameters
  const size = 360
  const center = size / 2
  const radius = center - 10
  const totalProb = segments.reduce((sum, s) => sum + s.probability, 0) || 1

  return (
    <Dialog open={showSpinWheel} onOpenChange={setShowSpinWheel}>
      <DialogContent className="bg-gradient-to-br from-blue-600 to-purple-600 border border-purple-400/50 shadow-2xl shadow-purple-500/50 sm:rounded-2xl rounded-2xl max-w-sm overflow-hidden z-[60] p-6 mx-auto w-[95vw]">
        <DialogHeader className="text-center mb-2">
          <DialogTitle className="flex items-center justify-center gap-2 text-3xl font-extrabold text-white drop-shadow-md">
            <Sparkles className="size-7 text-[#FFD700]" />
            Spin & Win!
          </DialogTitle>
          <DialogDescription className="text-purple-100 font-medium text-base">
            Spin daily to win amazing rewards!
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex flex-col items-center py-2 min-h-[300px] justify-center">
          {isLoading || segments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <Loader2 className="size-12 animate-spin text-white opacity-80" />
              <p className="text-white/80 font-medium">Loading prizes...</p>
            </div>
          ) : (
            <>
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
                <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-[#FFD700] drop-shadow-xl" style={{ filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.5))" }} />
              </div>

              <div className="relative mt-4">
                <div
                  className="rounded-full overflow-hidden aspect-square shadow-[0_0_25px_rgba(0,0,0,0.4)] bg-white/10 border-2 border-white/20 w-full max-w-[340px]"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
                  }}
                >
                  <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="rounded-full overflow-hidden block">
                    {(() => {
                      let currentAngle = 0;
                      return segments.map((segment, index) => {
                        const sliceAngle = (segment.probability / totalProb) * 2 * Math.PI;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + sliceAngle;

                        const x1 = center + radius * Math.cos(startAngle);
                        const y1 = center + radius * Math.sin(startAngle);
                        const x2 = center + radius * Math.cos(endAngle);
                        const y2 = center + radius * Math.sin(endAngle);
                        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

                        // A line from center to start, arc to end, line back to center
                        const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                        const textAngle = startAngle + sliceAngle / 2;
                        const textAngleDeg = (textAngle * 180) / Math.PI;

                        currentAngle += sliceAngle;

                        return (
                          <g key={index}>
                            <path d={pathData} fill={segment.color} stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                            <g transform={`translate(${center}, ${center}) rotate(${textAngleDeg})`}>
                              <text
                                x={radius - 20}
                                y={5}
                                fill="#FFFFFF"
                                fontSize="14"
                                fontWeight="bold"
                                textAnchor="end"
                                style={{ filter: 'drop-shadow(0px 1px 3px rgba(0,0,0,0.8))' }}
                              >
                                {segment.label}
                              </text>
                            </g>
                          </g>
                        );
                      });
                    })()}
                    {/* Inner Center Circle */}
                    <circle cx={center} cy={center} r="28" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="4" />
                    <text
                      x={center}
                      y={center + 1}
                      fill="#D4AF37"
                      fontSize="14"
                      fontWeight="900"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      SPIN
                    </text>
                  </svg>
                </div>
              </div>

              <div className="mt-8 relative z-20 -top-6">
                <Button
                  onClick={handleSpin}
                  disabled={isSpinning || segments.length === 0}
                  className={`bg-gradient-to-r from-[#FFD700] to-[#F59E0B] hover:from-[#FDE047] hover:to-[#F59E0B] text-amber-950 font-extrabold text-2xl px-10 py-7 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.5)] disabled:opacity-60 transition-all ${isSpinning ? '' : 'animate-bounce'}`}
                >
                  {isSpinning ? 'SPINNING...' : 'SPIN NOW!'}
                </Button>
              </div>

              {result && !isSpinning && (
                <div className="mt-2 text-center w-full z-30">
                  {result.type === 'coins' && result.value > 0 ? (
                    <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white shadow-xl border-2 border-[#D4AF37]">
                      <Award className="size-6 text-[#D4AF37]" />
                      <span className="font-bold text-gray-900 text-lg">You won {result.value} coins!</span>
                    </div>
                  ) : (result.type === 'coupon' || result.type === 'discount' || result.type === 'free_listing') && wonCouponCode ? (
                    <div className="rounded-2xl border-2 border-[#E74C3C] bg-white shadow-xl p-5">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Ticket className="size-6 text-[#E74C3C]" />
                        <span className="font-extrabold text-gray-900 text-lg">You won {result.label}!</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <code className="px-4 py-2 rounded-xl bg-[#4169E1]/10 text-[#4169E1] font-mono font-bold text-base tracking-widest border border-[#4169E1]/20">
                          {wonCouponCode}
                        </code>
                        <button
                          onClick={() => handleCopyCoupon(wonCouponCode)}
                          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                          title="Copy code"
                        >
                          <Copy className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Valid for 7 days · Apply at checkout</p>
                      <Button
                        onClick={() => {
                          setShowSpinWheel(false)
                          toast.info('Apply your coupon on the Pricing Plans section!', { duration: 4000 })
                        }}
                        variant="default"
                        className="mt-3 w-full bg-[#4169E1] hover:bg-blue-700 text-white font-bold rounded-xl"
                      >
                        Apply on Checkout →
                      </Button>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/90 backdrop-blur-sm border-2 border-white shadow-xl">
                      <span className="font-bold text-gray-800 text-lg">{result.label || 'Better luck next time!'}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
