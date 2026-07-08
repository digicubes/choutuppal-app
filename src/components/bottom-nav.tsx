'use client'

import { Home, Compass, Newspaper, Users, User } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { ViewType } from '@/lib/store'

const NAV_ITEMS: Array<{
  view: ViewType
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>
}> = [
  { view: 'home', label: 'Home', icon: Home },
  { view: 'explore', label: 'Explore', icon: Compass },
  { view: 'news', label: 'News', icon: Newspaper },
  { view: 'community', label: 'Community', icon: Users },
  { view: 'dashboard', label: 'You', icon: User },
]

export function BottomNav() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const currentView = useAppStore((s) => s.currentView)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const showBottomNav = useAppStore((s) => s.showBottomNav)

  if (!showBottomNav) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-100">
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.view
          const Icon = item.icon

          return (
            <button
              key={item.view}
              onClick={() => navigateTo(item.view)}
              className="flex flex-col items-center justify-center py-1 px-4 min-h-[44px] min-w-[56px] relative active:scale-90 transition-transform"
            >
              {isActive && (
                <div className="absolute top-0.5 w-1 h-1 rounded-full bg-[#D4AF37] transition-all duration-200" />
              )}
              <Icon
                className={`size-[22px] transition-colors ${
                  isActive ? 'text-[#D4AF37]' : 'text-gray-400'
                }`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] mt-0.5 font-medium transition-colors ${
                  isActive ? 'text-[#D4AF37]' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
      {/* iOS safe area */}
      <div className="h-[env(safe-area-inset-bottom,0px)] bg-white" />
    </nav>
  )
}
