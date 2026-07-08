'use client'

import { MessageCircle } from 'lucide-react'

export function WhatsAppFloatingButton() {
  const handleClick = () => {
    const text = encodeURIComponent('నమస్కారం! చౌటుప్పల్ యాప్ గురించి నాకు ఒక సహాయం కావాలి...')
    window.open(`https://wa.me/918790083706?text=${text}`, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className="fixed z-[55] right-4 bottom-24 md:bottom-8 flex items-center justify-center p-3 sm:p-4 rounded-full bg-[#25D366] text-white shadow-lg shadow-green-500/30 hover:scale-110 active:scale-95 transition-all duration-300 group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-sm" fill="currentColor" />
    </button>
  )
}
