'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Share2, MessageCircle, UserPlus, UserMinus, Calendar, Star, Store, Users, MapPin } from 'lucide-react'
import { GlassCard } from '@/components/glass-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ListingCard from '@/components/listing-card'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'

interface UserProfileViewProps {
  user: any
  initialIsFollowing: boolean
}

export function UserProfileView({ user, initialIsFollowing }: UserProfileViewProps) {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'listings' | 'stories' | 'posts'>('listings')
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isFollowLoading, setIsFollowLoading] = useState(false)

  const roleLabel = user.role === 'city_admin' ? 'City Admin' : user.role === 'agent' ? 'Agent' : 'Business Owner'
  const joinedDate = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(user.createdAt))

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: user.fullName,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard')
      }
    } catch (err) {
      console.error('Error sharing:', err)
    }
  }

  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast.error('Please login to follow users')
      return
    }
    
    setIsFollowLoading(true)
    try {
      if (isFollowing) {
        // Unfollow
        const res = await fetch(`/api/users/${user.id}/follow?followerId=${currentUser.id}`, { method: 'DELETE' })
        if (res.ok) setIsFollowing(false)
      } else {
        // Follow
        const res = await fetch(`/api/users/${user.id}/follow`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followerId: currentUser.id })
        })
        if (res.ok) setIsFollowing(true)
      }
      router.refresh()
    } catch (err) {
      toast.error('Failed to update follow status')
    } finally {
      setIsFollowLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 pb-20">
      {/* Cover & Avatar Container */}
      <div className="relative h-40 md:h-56 w-full bg-gradient-to-r from-gray-200 to-gray-300">
        {user.coverImage ? (
          <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-[#4169E1] to-[#D4AF37]" />
        )}
        
        {/* Profile Photo Overlapping */}
        {user.avatarUrl ? (
          <img 
            src={user.avatarUrl} 
            alt={user.fullName} 
            className="absolute -bottom-12 left-4 w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white object-cover shadow-lg bg-white z-10" 
          />
        ) : (
          <div className="absolute -bottom-12 left-4 w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold z-10">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 space-y-6">
        {/* Profile Card Info */}
        <GlassCard className="p-6 bg-white shadow-xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="flex-1 text-center sm:text-left w-full">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{user.fullName}</h1>
              {user.username && <p className="text-gray-500 font-medium">@{user.username}</p>}
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <Badge className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white font-medium px-3 py-1 text-sm">
                  {roleLabel}
                </Badge>
                <div className="flex items-center text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                  <Calendar className="size-4 mr-1.5" />
                  Joined {joinedDate}
                </div>
              </div>

              {user.bio && (
                <p className="mt-5 text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100 text-left leading-relaxed">
                  {user.bio}
                </p>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-6">
                {currentUser?.id !== user.id && (
                  <Button 
                    onClick={handleFollowToggle} 
                    disabled={isFollowLoading}
                    className={`gap-2 ${isFollowing ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-gradient-to-r from-[#4169E1] to-[#3a5dca] text-white'}`}
                  >
                    {isFollowing ? (
                      <><UserMinus className="size-4" /> Unfollow</>
                    ) : (
                      <><UserPlus className="size-4" /> Follow</>
                    )}
                  </Button>
                )}
                
                {user.whatsappNumber && (
                  <a 
                    href={`https://wa.me/91${user.whatsappNumber}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="gap-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10">
                      <MessageCircle className="size-4" /> WhatsApp
                    </Button>
                  </a>
                )}
                
                <Button variant="outline" onClick={handleShare} className="gap-2">
                  <Share2 className="size-4" /> Share Profile
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Tabs Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
          <div className="flex overflow-x-auto border-b border-gray-100 hide-scrollbar">
            <button
              onClick={() => setActiveTab('listings')}
              className={`flex-1 min-w-[120px] py-4 px-6 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-2 ${
                activeTab === 'listings' ? 'border-[#4169E1] text-[#4169E1] bg-[#4169E1]/5' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Store className="size-4" />
              Listings ({user.listings?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('stories')}
              className={`flex-1 min-w-[120px] py-4 px-6 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-2 ${
                activeTab === 'stories' ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Star className="size-4" />
              Stories ({user.stories?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 min-w-[120px] py-4 px-6 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-2 ${
                activeTab === 'posts' ? 'border-[#4169E1] text-[#4169E1] bg-[#4169E1]/5' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users className="size-4" />
              Posts ({user.posts?.length || 0})
            </button>
          </div>

          <div className="p-6 min-h-[300px]">
            {activeTab === 'listings' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {user.listings?.length > 0 ? (
                  user.listings.map((listing: any) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-gray-500 flex flex-col items-center">
                    <Store className="size-12 mb-3 text-gray-300" />
                    <p>No active listings found.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stories' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {user.stories?.length > 0 ? (
                  user.stories.map((story: any) => (
                    <div key={story.id} className="relative aspect-[9/16] rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-black group">
                      <img src={story.mediaUrl} alt={story.title || 'Story'} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                        <p className="text-white text-sm font-semibold line-clamp-2">{story.title || 'Update'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-gray-500 flex flex-col items-center">
                    <Star className="size-12 mb-3 text-gray-300" />
                    <p>No active stories found.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'posts' && (
              <div className="space-y-4 max-w-2xl mx-auto">
                {user.posts?.length > 0 ? (
                  user.posts.map((post: any) => (
                    <div key={post.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                      <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                      {post.mediaUrls && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-gray-100">
                          {(() => {
                            try {
                              const urls = JSON.parse(post.mediaUrls)
                              if (urls.length > 0) return <img src={urls[0]} alt="Post media" className="w-full h-auto max-h-64 object-cover" />
                            } catch {}
                            return null
                          })()}
                        </div>
                      )}
                      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4 text-sm text-gray-500">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        <span>{post.likesCount} Likes</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-gray-500 flex flex-col items-center">
                    <Users className="size-12 mb-3 text-gray-300" />
                    <p>No community posts yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
