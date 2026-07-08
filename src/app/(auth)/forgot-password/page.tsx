'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      if (error) throw error
      
      setSent(true)
      toast({ title: 'Email sent', description: 'Check your inbox for the password reset link.' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'An error occurred', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <Link href="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to login
        </Link>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-500 mt-2">Enter your email and we'll send you a reset link</p>
        </div>

        {sent ? (
          <div className="text-center bg-green-50 text-green-700 p-4 rounded-xl border border-green-100">
            <p className="font-medium">Success!</p>
            <p className="text-sm mt-1">We've sent a password reset link to <strong>{email}</strong>.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="you@example.com"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
