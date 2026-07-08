'use client'

import { useState } from 'react'
import {
  X, Mail, ArrowRight, Shield, Sparkles,
  Lock, User, ChevronRight, Eye, EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { useMounted } from '@/hooks/use-mounted'

/**
 * LoginModal — Email/Password + Google OAuth
 *
 * RULES ENFORCED:
 * 1. Full-screen overlay: fixed inset-0 bg-black/60 backdrop-blur-sm
 * 2. Card: bg-white rounded-xl shadow-2xl — NO transparency, NO GlassCard
 * 3. NO Framer Motion — all animations use CSS transitions
 * 4. Mounted guard — don't render until after hydration
 * 5. All inputs: bg-white border-gray-200 — solid, readable
 * 6. All text: text-gray-800 / text-gray-600 — dark, readable on white
 */

export function LoginModal() {
  const {
    showLoginModal, setShowLoginModal,
    login, signup,
  } = useAuth()

  const mounted = useMounted()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleClose = () => {
    setShowLoginModal(false)
    setEmail('')
    setPassword('')
    setFullName('')
    setPhone('')
    setError('')
    setSuccessMsg('')
    setLoading(false)
    setShowPassword(false)
  }

  const handleEmailLogin = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')
    const result = await login(email, password)
    if (!result.success) {
      setError(result.error || 'Login failed. Check your credentials.')
    }
    setLoading(false)
  }

  const handleSignup = async () => {
    if (!fullName) {
      setError('Please enter your full name')
      return
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    if (!phone || !/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')
    const result = await signup(fullName, phone, email, password)
    if (!result.success) {
      setError(result.error || 'Signup failed')
    } else {
      setSuccessMsg('Account created! Check your email to confirm, then sign in.')
      setIsSignup(false)
      setPassword('')
    }
    setLoading(false)
  }



  // Don't render until client-side mount to prevent hydration mismatch
  if (!mounted || !showLoginModal) {
    return null
  }

  return (
    /* ═══ FULL-SCREEN OVERLAY ═══ */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      {/* SOLID WHITE CARD */}
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header gradient ─── */}
        <div className="relative bg-gradient-to-r from-[#D4AF37] to-[#4169E1] px-6 py-6 text-white">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            aria-label="Close login modal"
          >
            <X className="size-4" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <Shield className="size-6" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {isSignup ? 'Join Choutuppal' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-white/80 mt-1">
            {isSignup
              ? 'Create your account to get started'
              : 'Sign in to access your dashboard'}
          </p>
        </div>

        {/* ─── Body — solid white, all text dark ─── */}
        <div className="bg-white p-6 space-y-4">
          {/* Error banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Success banner */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
              {successMsg}
            </div>
          )}



          {/* ─── Email/Password Login ─── */}
          {!isSignup && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-800">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white border-gray-200 h-12 text-gray-800 placeholder:text-gray-400"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && document.getElementById('password')?.focus()}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-800">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white border-gray-200 h-12 text-gray-800 placeholder:text-gray-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <Button
                onClick={handleEmailLogin}
                disabled={loading || !email.includes('@') || password.length < 6}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white h-12 font-semibold hover:from-[#C9A533] hover:to-[#A88518] transition-all"
              >
                {loading ? (
                  <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                ) : (
                  <>Sign In <ArrowRight className="size-4 ml-2" /></>
                )}
              </Button>
            </div>
          )}

          {/* ─── Signup ─── */}
          {isSignup && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-800">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 bg-white border-gray-200 h-12 text-gray-800 placeholder:text-gray-400"
                    autoFocus
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-800">Mobile Number</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">+91</span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="pl-12 bg-white border-gray-200 h-12 text-gray-800 placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signupEmail" className="text-sm font-medium text-gray-800">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="signupEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white border-gray-200 h-12 text-gray-800 placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signupPassword" className="text-sm font-medium text-gray-800">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="signupPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white border-gray-200 h-12 text-gray-800 placeholder:text-gray-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/20">
                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-[#D4AF37]" />
                  Get 25 welcome coins when you sign up!
                </p>
              </div>
              <Button
                onClick={handleSignup}
                disabled={loading || !fullName || !phone || phone.length < 10 || !email.includes('@') || password.length < 6}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white h-12 font-semibold hover:from-[#C9A533] hover:to-[#A88518] transition-all"
              >
                {loading ? (
                  <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                ) : (
                  <>Create Account <ChevronRight className="size-4 ml-1" /></>
                )}
              </Button>
            </div>
          )}

          {/* ─── Toggle signup/login ─── */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsSignup(!isSignup)
                setError('')
                setSuccessMsg('')
                setPassword('')
              }}
              className="text-sm text-[#4169E1] hover:underline font-medium"
            >
              {isSignup
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
