'use client'

import { Sparkles, RotateCw, Gift } from 'lucide-react'
import { GlassCard } from '@/components/glass-card'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'

export function DailySpinSection() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const setShowSpinWheel = useAppStore((s) => s.setShowSpinWheel)
  const currentUser = useAppStore((s) => s.currentUser)

  return (
    <section className="px-4 py-4">
      <GlassCard variant="gold" className="!p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="animate-[spin_4s_linear_infinite]">
                <Sparkles className="size-5 text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-[#D4AF37] to-[#B8962E] bg-clip-text text-transparent">
                Spin & Win!
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-1">
              Spin the wheel daily to earn coins and rewards!
            </p>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Gift className="size-3.5 text-[#D4AF37]" />
                <span>Daily 1 Free Spin</span>
              </div>
              {currentUser && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-500">Balance:</span>
                  <span className="font-bold text-[#D4AF37]">{currentUser.coinsBalance} coins</span>
                </div>
              )}
            </div>
          </div>

          <div className="active:scale-95 transition-transform">
            <Button
              onClick={() => setShowSpinWheel(true)}
              className="bg-gradient-to-r from-[#D4AF37] to-[#B8962E] hover:from-[#C5A233] hover:to-[#A8882A] text-white font-bold px-5 shadow-lg shadow-[#D4AF37]/20"
            >
              <RotateCw className="size-4 mr-1.5" />
              SPIN
            </Button>
          </div>
        </div>

        {/* Decorative wheel preview */}
        <div className="mt-3 flex items-center gap-2">
          {['5', '10', '2', '50', '1', '20'].map((coins, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#4169E1]/10 border border-[#D4AF37]/30 flex items-center justify-center transition-all duration-200"
            >
              <span className="text-[10px] font-bold text-[#D4AF37]">{coins}</span>
            </div>
          ))}
          <span className="text-[11px] text-gray-400 ml-1">+ more prizes!</span>
        </div>
      </GlassCard>
    </section>
  )
}
