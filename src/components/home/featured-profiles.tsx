'use client'

import { Crown, User as UserIcon, ChevronRight, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAppStore } from '@/lib/store'

export function FeaturedProfiles() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigateTo = useAppStore(s => s.navigateTo)

  useEffect(() => {
    fetch('/api/featured-profiles')
      .then(res => res.json())
      .then(data => {
        if (data.profiles && Array.isArray(data.profiles)) {
          setProfiles(data.profiles)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch featured profiles', err)
        setLoading(false)
      })
  }, [])

  if (loading || profiles.length === 0) {
    return null // Completely hidden if no profiles exist
  }

  return (
    <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-yellow-500 rounded-3xl p-6 my-8">
      {/* ── Static heading ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Crown className="w-6 h-6 text-yellow-400" />
          <h2 className="text-xl font-bold text-white">Featured Profiles</h2>
        </div>
      </div>

      {/* ── Grid of Profile Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {profiles.map((user) => {
          const isLeader = user.role === 'city_admin' || user.role === 'super_admin' || user.role === 'agent'
          const name = user.fullName || 'User'
          const title = user.profile?.bio || (isLeader ? 'Leader' : 'Member')
          const avatarUrl = user.avatarUrl || '/og-default.png'
          const coverUrl = user.coverImage || user.profile?.coverImageUrl || '/og-default.png'
          
          return (
            <Link
              key={user.id}
              href={`/profile/${user.id}`}
              className="bg-white/20 backdrop-blur-lg border border-white/30 shadow-xl rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl group relative"
            >
              {/* Featured Badge */}
              <div className="absolute top-2 right-2 bg-black/30 text-yellow-400 text-xs font-bold px-2 py-1 rounded-full backdrop-blur-md z-10">
                Featured
              </div>
              
              {/* Cover Photo */}
              <div className="h-24 w-full">
                <img 
                  src={coverUrl} 
                  alt="Cover" 
                  className="w-full h-full object-cover" 
                />
              </div>

              {/* Profile Photo */}
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white/80 shadow-lg -mt-10 mx-auto overflow-hidden bg-gray-100 z-10">
                <img 
                  src={avatarUrl} 
                  alt={name} 
                  className="w-full h-full object-cover" 
                />
              </div>

              {/* Details */}
              <div className="mt-2 pb-4 px-4 text-center">
                <h3 className="text-white font-bold text-lg truncate w-full">{name}</h3>
                <p className="text-white/80 text-sm truncate w-full mt-1">{title}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── View All Button ── */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => navigateTo('community')}
          className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-6 py-2 text-white font-semibold hover:bg-white/30 transition-all flex items-center gap-2 cursor-pointer"
        >
          View All Profiles
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
