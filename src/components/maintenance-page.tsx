'use client'

import { useEffect, useState } from 'react'
import { Settings, RefreshCw, Shield, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * MaintenancePage — Full-screen "Site Under Maintenance" overlay.
 * Shown to all non-Super-Admin users when maintenanceMode is ON.
 *
 * Features:
 * - Animated gear/wrench illustration
 * - Auto-refresh timer (checks config every 30s)
 * - Royal Glassmorphism theme
 * - "Super Admin? Sign In" link for admin access
 */
export default function MaintenancePage() {
  const [countdown, setCountdown] = useState(30)
  const [isRetrying, setIsRetrying] = useState(false)

  // Auto-refresh countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Check if maintenance is still on by reading localStorage
          try {
            const stored = localStorage.getItem('manaAppConfig')
            if (stored) {
              const config = JSON.parse(stored)
              if (!config.maintenanceMode) {
                window.location.reload()
              }
            }
          } catch { /* ignore */ }
          return 30
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleManualRetry = () => {
    setIsRetrying(true)
    try {
      const stored = localStorage.getItem('manaAppConfig')
      if (stored) {
        const config = JSON.parse(stored)
        if (!config.maintenanceMode) {
          window.location.reload()
          return
        }
      }
    } catch { /* ignore */ }
    setTimeout(() => setIsRetrying(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#4169E1]/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-lg">
        {/* Icon */}
        <div className="mx-auto w-28 h-28 rounded-3xl bg-gradient-to-br from-[#4169E1]/20 to-[#D4AF37]/20 border border-white/10 flex items-center justify-center mb-8 shadow-2xl backdrop-blur-sm">
          <div className="relative">
            <Wrench className="w-14 h-14 text-[#D4AF37]" />
            <Settings className="w-8 h-8 text-[#4169E1] absolute -bottom-1 -right-1 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Under Maintenance
        </h1>

        {/* Subtitle */}
        <p className="text-gray-400 text-base sm:text-lg mb-2">
          We&apos;re making things better for you!
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Our team is working on updates. We&apos;ll be back shortly.
          Thank you for your patience.
        </p>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#4169E1] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-[#4169E1] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-[#4169E1] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>

        {/* Retry button */}
        <Button
          onClick={handleManualRetry}
          disabled={isRetrying}
          className="bg-gradient-to-r from-[#4169E1] to-[#D4AF37] hover:from-[#3b5fd4] hover:to-[#C9A533] text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Checking...' : 'Try Again'}
        </Button>

        {/* Auto-refresh note */}
        <p className="text-gray-600 text-xs mt-4">
          Auto-checking in {countdown}s
        </p>

        {/* Super Admin link */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
            <Shield className="w-3.5 h-3.5" />
            <span>Super Admin? Access the dashboard to disable maintenance mode.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
