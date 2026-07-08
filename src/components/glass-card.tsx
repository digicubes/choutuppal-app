'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: ReactNode
  variant?: 'default' | 'gold' | 'premium'
  className?: string
  onClick?: () => void
}

/**
 * GlassCard — Desktop: Royal Glassmorphism, Mobile: Solid white cards.
 *
 * Mobile: bg-white rounded-xl shadow-sm p-4 border border-gray-100
 * Desktop: bg-white/40 backdrop-blur-2xl border-white/30 shadow-2xl
 *
 * NO heavy glassmorphism on mobile — it makes things laggy and messy.
 */
export function GlassCard({ children, variant = 'default', className, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        // Mobile-first: solid white cards
        'bg-white rounded-xl p-4 border border-gray-100 shadow-sm',
        // Desktop: upgrade to glassmorphism
        'md:bg-white/40 md:backdrop-blur-2xl md:rounded-2xl md:p-6 md:shadow-2xl',
        variant === 'default' && 'md:border-white/30',
        variant === 'gold' && 'md:border-[#D4AF37]/40 md:shadow-[0_0_20px_rgba(212,175,55,0.1)] border-l-4 border-l-[#D4AF37]',
        variant === 'premium' && 'md:border-2 md:border-transparent md:bg-clip-padding md:bg-white/40',
        onClick && 'cursor-pointer hover:bg-gray-50 md:hover:bg-white/50 active:scale-[0.98] transition-transform',
        className
      )}
      style={
        variant === 'premium'
          ? {
              backgroundImage:
                'linear-gradient(white, white), linear-gradient(135deg, #D4AF37, #4169E1, #D4AF37)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
            }
          : undefined
      }
    >
      {children}
    </div>
  )
}
