'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AuthUser {
  id: string
  fullName: string
  username?: string | null
  email?: string | null
  phone?: string | null
  role: 'user' | 'business' | 'admin' | 'super_admin' | 'city_admin' | 'agent'
  coinsBalance: number
  subscriptionTier: string
  avatarUrl?: string | null
  bio?: string | null
  managedCityId?: string | null
  agentCityId?: string | null
  isAgentApproved?: boolean
  totalEarnings?: number
  pendingPayout?: number
  upiId?: string | null
  isPublic?: boolean
  whatsappNumber?: string | null
  coverImage?: string | null
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (fullName: string, phone: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  showLoginModal: boolean
  setShowLoginModal: (show: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Fetch or create a profile row in the `profiles` table.
 * Falls back to sensible defaults if the row doesn't exist yet
 * (e.g., first Google OAuth login).
 */
async function fetchProfile(supabaseUser: SupabaseUser): Promise<AuthUser> {
  const { data: userRecord, error } = await supabase
    .from('User')
    .select('*')
    .eq('email', supabaseUser.email)
    .single()

  console.log("DB Fetch Error:", error);
  console.log("User Record Data:", userRecord);

  if (userRecord) {
    console.log("User Role from DB:", userRecord.role);
    const roleMap: Record<string, AuthUser['role']> = {
      'SUPER_ADMIN': 'super_admin',
      'super_admin': 'super_admin',
      'CITY_ADMIN': 'city_admin',
      'city_admin': 'city_admin',
      'AGENT': 'agent',
      'agent': 'agent',
      'USER': 'user',
      'user': 'user'
    }
    
    return {
      id: userRecord.id,
      fullName: userRecord.fullName || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
      email: userRecord.email || supabaseUser.email,
      phone: userRecord.phone || supabaseUser.phone || null,
      role: roleMap[userRecord.role as string] || userRecord.role || 'user',
      coinsBalance: userRecord.coinsBalance ?? 0,
      subscriptionTier: userRecord.subscriptionTier || 'free',
      avatarUrl: userRecord.avatarUrl || supabaseUser.user_metadata?.avatar_url || null,
      managedCityId: userRecord.managedCityId || null,
      agentCityId: userRecord.agentCityId || null,
      isAgentApproved: userRecord.isAgentApproved ?? false,
      totalEarnings: userRecord.totalEarnings || 0,
      pendingPayout: userRecord.pendingPayout || 0,
      upiId: userRecord.upiId,
      isPublic: userRecord.isPublic,
      whatsappNumber: userRecord.whatsappNumber,
      coverImage: userRecord.coverImage,
      username: userRecord.username
    }
  }

  // Fallback if trigger hasn't fired yet
  return {
    id: supabaseUser.id,
    fullName: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
    email: supabaseUser.email,
    phone: supabaseUser.phone || null,
    role: 'user',
    coinsBalance: 10,
    subscriptionTier: 'free',
    isPublic: true,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // CRITICAL: Use individual selector, NOT useAppStore() — subscribing to the
  // entire store would re-render AuthProvider (and the ENTIRE app tree) on every
  // state change, causing maximum update depth crashes.
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)

  const syncToStore = useCallback((authUser: AuthUser | null) => {
    if (authUser) {
      setCurrentUser({
        id: authUser.id,
        fullName: authUser.fullName,
        role: authUser.role,
        coinsBalance: authUser.coinsBalance,
        subscriptionTier: authUser.subscriptionTier,
        managedCityId: authUser.managedCityId || null,
        agentCityId: authUser.agentCityId || null,
        isAgentApproved: authUser.isAgentApproved,
        totalEarnings: authUser.totalEarnings,
        pendingPayout: authUser.pendingPayout,
        upiId: authUser.upiId || null,
      })
    } else {
      setCurrentUser(null)
    }
  }, [setCurrentUser])

  // Listen for Supabase auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const profile = await fetchProfile(session.user)
          setUser(profile)
          syncToStore(profile)
        } catch (err) {
          console.error('Failed to fetch profile:', err)
        }
      }
      setIsLoading(false)
    })

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const profile = await fetchProfile(session.user)
            setUser(profile)
            syncToStore(profile)
            setShowLoginModal(false)
          } catch (err) {
            console.error('Failed to fetch profile on sign in:', err)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          syncToStore(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [syncToStore])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  }, [])

  const signup = useCallback(async (fullName: string, phone: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    let finalFullName = fullName?.trim()
    if (!finalFullName) {
      if (phone && phone.length >= 4) {
        finalFullName = `Guest-${phone.slice(-4)}`
      } else {
        finalFullName = `User-${Math.floor(1000 + Math.random() * 9000)}`
      }
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: finalFullName, phone: phone },
      },
    })
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  }, [])



  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    syncToStore(null)
  }, [syncToStore])

  const value: AuthContextType = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    showLoginModal,
    setShowLoginModal,
  }), [user, isLoading, login, signup, logout, showLoginModal])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
