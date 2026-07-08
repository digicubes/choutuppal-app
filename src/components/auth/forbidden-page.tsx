'use client'

import { motion } from 'framer-motion'
import { ShieldX, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/glass-card'
import { useAppStore } from '@/lib/store'

export function ForbiddenPage() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const navigateTo = useAppStore((s) => s.navigateTo)

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <GlassCard className="text-center max-w-md mx-auto !p-8">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <ShieldX className="size-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">403 Forbidden</h1>
          <p className="text-gray-500 mb-1">You don&apos;t have permission to access this page.</p>
          <p className="text-sm text-gray-400 mb-6">Admin access is required to view the Admin Panel.</p>
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => navigateTo('home')}
              className="bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white font-semibold"
            >
              <ArrowLeft className="size-4 mr-2" />
              Go to Home
            </Button>
          </motion.div>
        </GlassCard>
      </motion.div>
    </div>
  )
}
