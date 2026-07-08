'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'

type PushPermissionStatus = 'default' | 'granted' | 'denied'

interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

interface UsePushNotificationsReturn {
  /** Whether push notifications are supported by the browser */
  isSupported: boolean
  /** Current notification permission status */
  permissionStatus: PushPermissionStatus
  /** Whether the user is currently subscribed to push notifications */
  isSubscribed: boolean
  /** Whether a subscription request is in progress */
  isLoading: boolean
  /** Request permission and subscribe to push notifications */
  requestPermissionAndSubscribe: () => Promise<boolean>
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>
  /** Error message if something went wrong */
  error: string | null
}

/**
 * Convert VAPID public key from base64 to Uint8Array
 * (Required by pushManager.subscribe)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Check browser support for PushManager (SSR-safe, synchronous)
 */
function getPushSupportSnapshot(): boolean {
  if (typeof window === 'undefined') return false
  return 'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
}

function getServerSnapshot(): boolean {
  return false
}

function subscribeToPushSupport() {
  // Push support doesn't change at runtime
  return () => {}
}

/**
 * usePushNotifications — Hook for managing Web Push Notification subscriptions
 *
 * - Checks browser support for PushManager (via useSyncExternalStore)
 * - Tracks permission status (default / granted / denied)
 * - Provides requestPermissionAndSubscribe() to request permission + register push subscription
 * - Sends subscription to backend API for storage
 * - Provides unsubscribe() to remove subscription
 *
 * IMPORTANT: Do NOT call requestPermissionAndSubscribe() on page load.
 * Only call it after user interaction (e.g., clicking a bell icon or "Enable Notifications" button).
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  // Read push support via useSyncExternalStore (SSR-safe, no setState in effects)
  const isSupported = useSyncExternalStore(subscribeToPushSupport, getPushSupportSnapshot, getServerSnapshot)

  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Initialize: check current permission and existing subscription
   * Called from the UI component only when it mounts and is supported
   * NOT called in a useEffect — the component calls this in its own useEffect
   */
  const initializePushState = useCallback(async () => {
    if (!isSupported) return

    // Check current permission
    if (Notification.permission === 'granted') {
      setPermissionStatus('granted')
    } else if (Notification.permission === 'denied') {
      setPermissionStatus('denied')
    } else {
      setPermissionStatus('default')
    }

    // Check if already subscribed
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch {
      // Service worker not ready yet — that's okay
    }
  }, [isSupported])

  // Auto-initialize on mount — checks current permission and existing subscription
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initializePushState()
  }, [initializePushState])

  /**
   * Send the push subscription to our backend for storage
   */
  const sendSubscriptionToServer = useCallback(async (
    subscription: PushSubscriptionData
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      })
      return res.ok
    } catch {
      return false
    }
  }, [])

  /**
   * Request notification permission and subscribe to push notifications
   * Call this ONLY after user interaction (button click, etc.)
   */
  const requestPermissionAndSubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser.')
      return false
    }

    if (isLoading) return false

    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Request notification permission
      const permission = await Notification.requestPermission()

      if (permission !== 'granted') {
        setPermissionStatus(permission === 'denied' ? 'denied' : 'default')
        setError(permission === 'denied'
          ? 'Notification permission was denied. Please enable it in your browser settings.'
          : 'Notification permission was not granted.')
        setIsLoading(false)
        return false
      }

      setPermissionStatus('granted')

      // Step 2: Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready

      // Step 3: Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        setError('Push notification configuration is missing. Please contact support.')
        setIsLoading(false)
        return false
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

      // Step 4: Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      })

      // Step 5: Send subscription to backend
      const subscriptionData: PushSubscriptionData = subscription.toJSON() as PushSubscriptionData

      if (!subscriptionData.endpoint || !subscriptionData.keys) {
        setError('Failed to create push subscription.')
        setIsLoading(false)
        return false
      }

      const sent = await sendSubscriptionToServer(subscriptionData)

      if (!sent) {
        setError('Failed to save subscription on server. Please try again.')
        // Unsubscribe locally since server didn't save it
        await subscription.unsubscribe()
        setIsLoading(false)
        return false
      }

      setIsSubscribed(true)
      setIsLoading(false)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setError(message)
      setIsLoading(false)
      return false
    }
  }, [isSupported, isLoading, sendSubscriptionToServer])

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe()

        // Notify server to remove subscription
        const subscriptionData = subscription.toJSON() as PushSubscriptionData
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscriptionData.endpoint }),
        })
      }

      setIsSubscribed(false)
      setIsLoading(false)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unsubscribe.'
      setError(message)
      setIsLoading(false)
      return false
    }
  }, [])

  return {
    isSupported,
    permissionStatus,
    isSubscribed,
    isLoading,
    requestPermissionAndSubscribe,
    unsubscribe,
    error,
  }
}
