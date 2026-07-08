'use client'

import { motion } from 'framer-motion'
import { Coins } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export function CoinBadge() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const currentUser = useAppStore((s) => s.currentUser)
  const setShowSpinWheel = useAppStore((s) => s.setShowSpinWheel)
  const coins = currentUser?.coinsBalance ?? 0

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => setShowSpinWheel(true)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/30 hover:from-[#D4AF37]/20 hover:to-[#D4AF37]/10 transition-all cursor-pointer"
    >
      <Coins className="size-4 text-[#D4AF37]" />
      <span className="text-sm font-bold text-[#D4AF37]">{coins}</span>
    </motion.button>
  )
}
