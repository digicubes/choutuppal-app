'use client'

import { useState, useEffect } from 'react'
import { BellRing, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushPermissionManager() {
  const { toast } = useToast()
  const [showCustomPrompt, setShowCustomPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Only show if supported, permission is default, and not dismissed
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      if (
        Notification.permission === 'default' && 
        localStorage.getItem('notificationPromptDismissed') !== 'true'
      ) {
        // Small delay to not aggressively pop up immediately on first paint
        const timer = setTimeout(() => setShowCustomPrompt(true), 2000)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const handleAllow = async () => {
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setIsLoading(true)
        const registration = await navigator.serviceWorker.register('/sw.js')
        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!publicVapidKey) throw new Error('VAPID public key is missing')
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        })

        const res = await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        })
        
        if (!res.ok) throw new Error('Failed to save subscription')
        
        console.log('Subscribed successfully', subscription)
        toast({ title: 'Success', description: 'Notifications enabled!' })
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
      toast({ title: 'Error', description: 'Failed to enable notifications.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
      setShowCustomPrompt(false)
      localStorage.setItem('notificationPromptDismissed', 'true')
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('notificationPromptDismissed', 'true')
    setShowCustomPrompt(false)
  }

  if (!showCustomPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[99999] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-5 overflow-hidden relative">
        {/* Accent Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(to right, #4169E1, #D4AF37)' }} />
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <BellRing className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-gray-900 leading-tight">చౌటుప్పల్ యాప్ నోటిఫికేషన్స్</h3>
            <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
              కొత్త వార్తలు మరియు అపడేట్స్ కోసం నోటిఫికేషన్స్ ఆన్ చేయండి.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button 
            onClick={handleDismiss}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition"
          >
            Not Now
          </button>
          <button 
            onClick={handleAllow}
            disabled={isLoading}
            className="px-5 py-2 text-sm font-medium text-white rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            style={{ background: 'linear-gradient(to right, #4169E1, #D4AF37)' }}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Allow'}
          </button>
        </div>
      </div>
    </div>
  )
}
