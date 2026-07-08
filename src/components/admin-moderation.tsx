'use client'

import { useState, useEffect } from 'react'
import { Trash2, MessageCircle, Star, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface CommunityPost {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    fullName: string
    avatarUrl: string | null
  }
}

interface Review {
  id: string
  comment: string | null
  rating: number
  createdAt: string
  user: {
    id: string
    fullName: string
    avatarUrl: string | null
  }
  listing: {
    id: string
    name: string
  }
}

export default function AdminModeration() {
  const [activeTab, setActiveTab] = useState<'posts' | 'reviews'>('posts')
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [postsRes, reviewsRes] = await Promise.all([
        fetch('/api/admin/community'),
        fetch('/api/admin/reviews')
      ])
      
      if (postsRes.ok) {
        const postsData = await postsRes.json()
        setPosts(Array.isArray(postsData) ? postsData : [])
      }
      
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json()
        setReviews(Array.isArray(reviewsData) ? reviewsData : [])
      }
    } catch (error) {
      toast.error('Failed to fetch moderation data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this community post?')) return
    
    try {
      const res = await fetch(`/api/admin/community/${id}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id))
        toast.success('Post deleted successfully')
      } else {
        toast.error('Failed to delete post')
      }
    } catch (error) {
      toast.error('Error deleting post')
    }
  }

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return
    
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id))
        toast.success('Review deleted successfully')
      } else {
        toast.error('Failed to delete review')
      }
    } catch (error) {
      toast.error('Error deleting review')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Moderation</h2>
          <p className="text-gray-500">Manage community posts and listing reviews.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'posts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Community Posts ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'reviews' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Listing Reviews ({reviews.length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {activeTab === 'posts' && (
          <div className="divide-y divide-gray-100">
            {posts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No community posts found.</div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      {post.author.avatarUrl ? (
                        <img src={post.author.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <span className="text-blue-600 font-bold">{post.author.fullName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{post.author.fullName}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{format(new Date(post.createdAt), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap text-sm">{post.content}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 self-start sm:self-center border border-transparent hover:border-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="divide-y divide-gray-100">
            {reviews.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No listing reviews found.</div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      {review.user.avatarUrl ? (
                        <img src={review.user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <span className="text-green-600 font-bold">{review.user.fullName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{review.user.fullName}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{format(new Date(review.createdAt), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                      <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-flex mb-2">
                        Listing: {review.listing.name}
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">"{review.comment}"</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 self-start sm:self-center border border-transparent hover:border-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
