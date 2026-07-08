'use client'

import React from 'react'
import useSWR from 'swr'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, MousePointerClick, Store, BarChart2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function UserAnalytics() {
  const { user } = useAuth()

  const fetcher = async (url: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    const headers: any = {}
    if (session?.access_token) {
      headers['Authorization'] = 'Bearer ' + session.access_token
    }
    const res = await fetch(url, { headers, credentials: 'include' })
    return res.json()
  }

  const { data, error, isLoading } = useSWR(
    user ? `/api/user/analytics?userId=${user.id}` : null,
    fetcher,
    { revalidateOnMount: true, revalidateIfStale: true, dedupingInterval: 30000 }
  )

  if (!user) return null

  if (isLoading) {
    return (
      <div className="space-y-4 pb-24 w-full max-w-md mx-auto md:max-w-none pt-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (error || !data) {
    return <div className="text-center py-10 text-red-500">Failed to load analytics</div>
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 w-full max-w-md mx-auto md:max-w-none pt-2 md:pt-0">
      <div className="flex items-center gap-2 mb-2">
        <BarChart2 className="w-6 h-6 text-[#4169E1]" />
        <h2 className="text-2xl font-black text-gray-900">Performance Analytics</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full mb-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
          <Eye className="w-6 h-6 text-[#4169E1] mb-2" />
          <p className="text-3xl font-black text-gray-900">{data.totalViews}</p>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Total Views</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
          <MousePointerClick className="w-6 h-6 text-green-500 mb-2" />
          <p className="text-3xl font-black text-gray-900">{data.totalInteractions}</p>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Interactions</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center col-span-2 md:col-span-1">
          <Store className="w-6 h-6 text-[#D4AF37] mb-2" />
          <p className="text-3xl font-black text-gray-900">{data.activeListings}</p>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Active Listings</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Views by Category</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="views" fill="#4169E1" radius={[6, 6, 6, 6]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
