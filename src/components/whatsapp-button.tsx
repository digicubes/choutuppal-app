'use client'

import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'

interface WhatsAppButtonProps {
  whatsappNumber: string
  businessName: string
  message?: string
  className?: string
}

export function WhatsAppButton({
  whatsappNumber,
  businessName,
  message,
  className = '',
}: WhatsAppButtonProps) {
  const defaultMsg = `Hi! I'm interested in ${businessName}. Can you help me?`
  const waMessage = message || defaultMsg
  const waUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(waMessage)}`

  return (
    <motion.a
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white font-medium text-sm shadow-md hover:bg-[#20BD5A] transition-colors ${className}`}
    >
      <MessageCircle className="size-4" />
      WhatsApp
    </motion.a>
  )
}
