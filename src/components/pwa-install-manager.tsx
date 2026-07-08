'use client'

import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export function PwaInstallManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    console.log('PWA Manager Mounted')

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(navigator as any).standalone
    setIsIOS(ios)

    // Check if dismissed
    const dismissed = localStorage.getItem('pwaDismissed') === 'true'
    setIsDismissed(dismissed)

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('Service Worker registered successfully'))
        .catch((err) => console.error('Service Worker registration failed', err))
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      console.log('beforeinstallprompt FIRED!')
      setDeferredPrompt(e)
      ;(window as any).deferredPrompt = e
      
      const dismissed = localStorage.getItem('pwaDismissed') === 'true'
      if (!dismissed) {
        setShowPopup(true)
      }
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setShowPopup(false)
    }

    const handleShowPopup = () => {
      setShowPopup(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('show-pwa-popup', handleShowPopup)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('show-pwa-popup', handleShowPopup)
    }
  }, [])

  const handleFloatingClick = () => {
    if (deferredPrompt) {
      setShowPopup(true)
    } else if (isIOS) {
      toast('దయచేసి మీ బ్రౌజర్ మెనూలో Add to Home Screen నొక్కండి', {
        position: 'bottom-center'
      })
    }
  }

  const handleInstallClick = async () => {
    const promptEvent = (window as any).deferredPrompt || deferredPrompt;
    if (!promptEvent) {
      toast('దయచేసి మీ బ్రౌజర్ షేర్ మెనూ ⎋ నుండి Add to Home Screen నొక్కండి లేదా యాప్ ఇప్పటికే ఇన్స్టాల్ అయి ఉండవచ్చు.')
      return
    }
    
    try {
      await promptEvent.prompt()
      const { outcome } = await promptEvent.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        ;(window as any).deferredPrompt = null
        setShowPopup(false)
      }
    } catch (err) {
      console.error('PWA Installation failed', err)
      toast.error('Installation failed or already installed.')
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('pwaDismissed', 'true')
    setIsDismissed(true)
    setShowPopup(false)
  }

  const shouldShowFloatingButton = !isDismissed && (deferredPrompt || isIOS)

  return (
    <>
      <AnimatePresence>
        {shouldShowFloatingButton && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={handleFloatingClick}
            className="fixed bottom-20 right-4 z-[9999] bg-gradient-to-r from-blue-600 to-yellow-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all"
            aria-label="Install App"
          >
            <Download className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPopup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPopup(false)}
              className="fixed inset-0 bg-black/40 z-[10000]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[10001] bg-white rounded-t-3xl p-6 shadow-2xl max-w-md mx-auto"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-2 mb-4 overflow-hidden">
                  <img src="/logo.png" alt="App Logo" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Install Choutuppal App</h2>
                <p className="text-sm text-gray-500 mb-8">
                  Get fast access to local businesses, real estate, and news right from your home screen.
                </p>
                
                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={handleInstallClick}
                    className="w-full bg-gradient-to-r from-[#4169E1] to-[#3155C1] text-white font-bold py-3.5 rounded-xl active:scale-95 transition-transform shadow-md"
                  >
                    Install Now
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="w-full bg-gray-100 text-gray-600 font-semibold py-3.5 rounded-xl hover:bg-gray-200 active:scale-95 transition-transform"
                  >
                    Not Now
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
