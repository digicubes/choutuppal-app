'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Store, Building, Image as ImageIcon, ShieldAlert, Loader2, PlaySquare } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { getAdminStats } from '@/app/actions/admin-actions'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

interface AdminOverviewProps {
  onNavigate?: (tab: string) => void;
}

export default function AdminOverview({ onNavigate }: AdminOverviewProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [counts, setCounts] = useState({
    users: 0,
    listings: 0,
    realEstate: 0,
    banners: 0,
    stories: 0
  })
  const [loading, setLoading] = useState(true)

  const isAuthorized = user?.role === 'admin' || user?.role === 'super_admin'

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || !isAuthorized) {
      setLoading(false)
      return
    }

    async function fetchCounts() {
      try {
        const stats = await getAdminStats()
        // Mocked stories count if not present in getAdminStats yet
        const storiesCount = (stats as any).stories || 0
        setCounts({
          users: stats.users || 0,
          listings: stats.listings || 0,
          realEstate: stats.realEstate || 0,
          banners: stats.banners || 0,
          stories: storiesCount,
        })
      } catch (error) {
        console.error('Error fetching admin counts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()
  }, [isLoading, isAuthenticated, isAuthorized])

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Auth is now handled by AdminContainer

  // Sample data for charts
  const categoryData = [
    { name: 'Business', count: counts.listings },
    { name: 'Real Estate', count: counts.realEstate },
    { name: 'Banners', count: counts.banners },
  ]

  const userGrowthData = [
    { month: 'Jan', users: Math.floor(counts.users * 0.5) },
    { month: 'Feb', users: Math.floor(counts.users * 0.7) },
    { month: 'Mar', users: Math.floor(counts.users * 0.85) },
    { month: 'Apr', users: counts.users },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-2">Welcome back, {user?.fullName || 'Admin'}. Here's what's happening.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Users Card */}
          <div 
            onClick={() => onNavigate?.('users')}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{counts.users.toLocaleString()}</h3>
            </div>
          </div>

          {/* Listings Card */}
          <div 
            onClick={() => onNavigate?.('listings')}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Listings</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{(counts.listings + counts.realEstate).toLocaleString()}</h3>
            </div>
          </div>

          {/* Banners Card */}
          <div 
            onClick={() => onNavigate?.('banners')}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <ImageIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Banners</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{counts.banners.toLocaleString()}</h3>
            </div>
          </div>

          {/* Stories Card */}
          <div 
            onClick={() => onNavigate?.('stories')}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <PlaySquare className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Stories</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{counts.stories.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {/* Infographics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">User Growth Overview</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Content Distribution</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
