'use client'

import { useState } from 'react'
import {
  MapPin, Home, Compass, Newspaper, Users,
  LayoutDashboard, Shield, LogOut, User,
  Bell, Menu, X, FileText, Loader2, Download,
  Crown,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { ViewType } from '@/lib/store'
import NotificationBell from './notification-bell'
import { useAuth } from '@/lib/auth-context'

import { useAppConfig } from '@/hooks/use-app-config'
import { usePathname, useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

const NAV_LINKS: Array<{
  view: ViewType
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>
  adminOnly?: boolean
  superAdminOnly?: boolean
  requiresAuth?: boolean
}> = [
  { view: 'home', label: 'Home', icon: Home },
  { view: 'explore', label: 'Explore', icon: Compass },
  { view: 'news', label: 'News', icon: Newspaper },
  { view: 'community', label: 'Community', icon: Users },
  { view: 'blog', label: 'Blog', icon: FileText },
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },

]

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  // CRITICAL: Use individual selectors, NOT useAppStore() — prevents re-render
  // on every unrelated store change (spin wheel, search, notifications, etc.)
  const currentView = useAppStore((s) => s.currentView)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const currentCity = useAppStore((s) => s.currentCity)
  const locationLoading = useAppStore((s) => s.locationLoading)
  const themePrimary = useAppStore((s) => s.themePrimary)
  const themeSecondary = useAppStore((s) => s.themeSecondary)
  const siteSettings = useAppStore((s) => s.siteSettings)
  const { isAuthenticated, setShowLoginModal, logout, user } = useAuth()

  const { config } = useAppConfig()
  const { toast } = useToast()
  


  const brandName = currentCity.brandName || 'Choutuppal'
  const appLogoUrl = siteSettings?.appLogoUrl || siteSettings?.logoUrl || '/brand-logo.png'
  const logoUrl = currentCity.logoUrl || null
  const primary = themePrimary || '#D4AF37'
  const secondary = themeSecondary || '#4169E1'



  const handleNavClick = (view: ViewType, requiresAuth?: boolean) => {
    if (requiresAuth && !isAuthenticated) {
      setShowLoginModal(true)
      setIsDrawerOpen(false)
      return
    }
    navigateTo(view)
    setIsDrawerOpen(false)
    if (pathname !== '/') {
      router.push('/')
    }
  }

  const handleLogoClick = () => {
    navigateTo('home')
    if (pathname !== '/') {
      router.push('/')
    }
  }

  const handlePwaInstall = () => {
    window.dispatchEvent(new Event('show-pwa-popup'))
  }



  // Logo rendering removed in favor of static image
  if (pathname?.startsWith('/admin')) return null;

  return (
    <header
      className={`sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm ${className || ''}`}
    >
      {/* ═══ DESKTOP HEADER ═══ */}
      <div className="hidden md:flex items-center justify-between h-14 px-6 max-w-7xl mx-auto">
        {/* Left: Logo + City */}
        <div className="flex items-center gap-4">
          <button onClick={handleLogoClick} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={appLogoUrl} alt="Choutuppal App" className="h-10 w-auto object-contain" />
          </button>
        </div>

        {/* Center: Nav Links */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((item) => {

            // Feature toggle filtering for desktop nav
            if (item.view === 'blog' && !config.enableBlog) return null
            if (item.view === 'news' && !config.enableBlog) return null
            if (item.view === 'explore' && !config.enableListings && !config.enableRealEstate) return null
            const isActive = currentView === item.view
            return (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view, item.requiresAuth)}
                className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive ? '' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
                style={isActive ? { color: primary } : undefined}
              >
                {item.label}
                {isActive && (
                  <div
                    className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                    style={{ backgroundColor: primary }}
                  />
                )}
              </button>
            )
          })}
        </nav>

        {/* Right: Notifications + Auth */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePwaInstall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-sm hover:shadow-md transition-all whitespace-nowrap"
            style={{ background: `linear-gradient(to right, ${primary}, ${secondary})` }}
          >
            <Download className="w-3.5 h-3.5" />
            Download App ⬇️
          </button>
          <NotificationBell />
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavClick('dashboard', true)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
                style={{ background: `linear-gradient(135deg, ${secondary}, ${primary})` }}
                title={user?.fullName || 'Dashboard'}
              >
                {user?.fullName?.charAt(0) || 'U'}
              </button>
              <button onClick={logout} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Sign out">
                <LogOut className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
              style={{ background: `linear-gradient(to right, ${primary}, ${secondary})` }}
            >
              <User className="size-3.5" />
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* ═══ MOBILE HEADER ═══ */}
      <div className="flex md:hidden items-center justify-between h-12 px-3">
        <div className="flex items-center gap-2">
          <button onClick={handleLogoClick} className="flex items-center gap-1.5">
            <img src={appLogoUrl} alt="Choutuppal App" className="h-10 w-auto object-contain" />
          </button>
        </div>

        <div className="flex items-center gap-0">
          <button
            onClick={handlePwaInstall}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-white text-[11px] font-bold shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap mr-1"
            style={{ background: `linear-gradient(to right, ${primary}, ${secondary})` }}
          >
            <Download className="w-3.5 h-3.5" />
            Download ⬇️
          </button>
          
          <div className="min-w-[44px] min-h-[44px] flex items-center justify-center relative">
            <NotificationBell />
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      {/* ═══ HAMBURGER DRAWER ═══ */}
      {isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 md:hidden transition-opacity duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div
            className="fixed top-0 right-0 bottom-0 z-[70] w-72 bg-white shadow-2xl md:hidden flex flex-col"
          >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <img src={appLogoUrl} alt="Choutuppal App" className="h-10 w-auto object-contain" />
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* User section */}
              <div className="px-4 py-3 border-b border-gray-100">
                {isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${secondary}, ${primary})` }}
                    >
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{user?.fullName || 'User'}</p>
                      <p className="text-xs text-gray-500">Member</p>
                    </div>
                    <button
                      onClick={() => { logout(); setIsDrawerOpen(false) }}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Sign out"
                    >
                      <LogOut className="size-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setShowLoginModal(true); setIsDrawerOpen(false) }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm shadow-sm active:opacity-90"
                    style={{ background: `linear-gradient(to right, ${primary}, ${secondary})` }}
                  >
                    <User className="size-4" />
                    Sign In
                  </button>
                )}
              </div>

              {/* Navigation links */}
              <nav className="flex-1 py-2 overflow-y-auto">
                {NAV_LINKS.map((item) => {

                  // Feature toggle filtering for drawer nav
                  if (item.view === 'blog' && !config.enableBlog) return null
                  if (item.view === 'news' && !config.enableBlog) return null
                  if (item.view === 'explore' && !config.enableListings && !config.enableRealEstate) return null
                  const isActive = currentView === item.view
                  const Icon = item.icon

                  return (
                    <button
                      key={item.view}
                      onClick={() => handleNavClick(item.view, item.requiresAuth)}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${
                        isActive ? '' : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                      }`}
                      style={isActive ? {
                        backgroundColor: `${primary}10`,
                        color: primary,
                        borderRight: `3px solid ${primary}`,
                      } : undefined}
                    >
                      <Icon className="w-5 h-5" style={isActive ? { color: primary } : undefined} />
                      <span className="text-sm font-medium" style={isActive ? { color: primary } : undefined}>
                        {item.label}
                      </span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primary }} />
                      )}
                    </button>
                  )
                })}

                </nav>

              {/* Drawer footer */}
              <div className="px-5 py-4 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 text-center">{brandName} 2.0 • Made with ❤️ in Telangana</p>
              </div>
          </div>
        </>
      )}
    </header>
  )
}
