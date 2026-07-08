'use client'

import { useEffect, type ReactNode } from 'react'
import { useAppStore } from '@/lib/store'
import { Header } from '@/components/header'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import dynamic from 'next/dynamic'
const SpinWheel = dynamic(() => import('@/components/spin-wheel'), { ssr: false })
import { LeadCaptureForm } from '@/components/lead-capture-form'
import { VoiceSearchModal } from '@/components/voice-search-modal'


/**
 * AppShell — DEPRECATED: This component is NOT used.
 *
 * The layout is now handled by src/app/layout.tsx which renders:
 * - Header, MobileBottomNav, FloatingOverlays, LoginModal directly
 *
 * This file is kept for reference only. DO NOT import this component.
 * If you need to modify the app shell, edit src/app/layout.tsx instead.
 */

export function AppShell({ children }: { children: ReactNode }) {
  const currentUser = useAppStore((s) => s.currentUser)
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)

  useEffect(() => {
    if (!currentUser) {
      setCurrentUser({
        id: 'demo-user-1',
        fullName: 'Guest User',
        role: 'user',
        coinsBalance: 50,
        subscriptionTier: 'free',
      })
    }
  }, [currentUser, setCurrentUser])

  return (
    <div className="h-[100dvh] w-screen flex flex-col overflow-hidden overscroll-none bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* ── Header — flex-none, pinned to top ── */}
      <div className="flex-none">
        <Header />
      </div>

      {/* ── Main scrollable area — flex-1, only region that scrolls ── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain -webkit-overflow-scrolling-touch">
        {children}
      </main>

      {/* ── Mobile Bottom Nav OR Sticky CTA — flex-none, pinned to bottom ── */}
      <div className="flex-none md:hidden">
        <MobileBottomNav />
      </div>

      {/* ── Floating overlays (position:fixed, not part of flex layout) ── */}
      <SpinWheel />
      <LeadCaptureForm />
      <VoiceSearchModal />
    </div>
  )
}
