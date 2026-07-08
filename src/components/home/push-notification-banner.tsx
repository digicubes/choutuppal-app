'use client'

import { useState } from 'react'
import { Bell, X, Loader2 } from 'lucide-react'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { Button } from '@/components/ui/button'
import { useMounted } from '@/hooks/use-mounted'

/**
 * PushNotificationBanner — Subtle banner on home page prompting users to enable notifications
 *
 * Only shows when:
 * - Browser supports push notifications
 * - User hasn't subscribed yet
 * - Permission hasn't been denied
 *
 * Dismissible — once dismissed, stays hidden for the session (stored in sessionStorage)
 *
 * HYDRATION SAFE: Uses useMounted() guard to prevent
 * server/client DOM mismatch. sessionStorage check uses useState lazy
 * initializer (not useEffect) to avoid cascading render lint warnings.
 */
export function PushNotificationBanner() {
  const {
    isSupported,
    permissionStatus,
    isSubscribed,
    isLoading,
    requestPermissionAndSubscribe,
    error,
  } = usePushNotifications()

  const mounted = useMounted()
  const [dismissed, setDismissed] = useState(false)

  // Check sessionStorage via lazy initializer — runs once on mount.
  // On the server, typeof window is undefined so this returns false.
  // Hydration is safe because this component returns null until mounted.
  const [sessionDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return sessionStorage.getItem('push-banner-dismissed') === 'true'
    } catch {
      return false
    }
  })

  // Don't render until client-side mount
  if (!mounted) return null

  // Don't render if push is not supported, already subscribed, or denied
  if (!isSupported || isSubscribed || permissionStatus === 'denied') return null
  if (sessionDismissed || dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem('push-banner-dismissed', 'true')
    } catch {
      // ignore
    }
  }

  return (
    <div className="w-full">
        <div className="mx-4 my-2 rounded-xl bg-gradient-to-r from-[#4169E1]/10 via-[#D4AF37]/5 to-[#4169E1]/10 border border-[#4169E1]/20 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Icon */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4169E1] to-[#D4AF37] flex items-center justify-center flex-shrink-0">
              <Bell className="size-4 text-white" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">
                Enable Notifications
              </p>
              <p className="text-xs text-gray-500 line-clamp-1">
                Get latest updates, offers & local news
              </p>
            </div>

            {/* Action */}
            <Button
              onClick={async () => {
                const success = await requestPermissionAndSubscribe()
                if (success) handleDismiss()
              }}
              disabled={isLoading}
              size="sm"
              className="text-white text-xs font-semibold px-3 h-8 flex-shrink-0 bg-gradient-to-r from-[#4169E1] to-[#D4AF37] hover:opacity-90"
            >
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                'Allow'
              )}
            </Button>

            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-gray-200/50 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="px-4 pb-2">
              <p className="text-xs text-red-500">{error}</p>
            </div>
          )}
        </div>
    </div>
  )
}
