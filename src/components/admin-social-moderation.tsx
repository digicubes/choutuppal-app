'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, Trash2, Pin, Crown, Users, AlertTriangle,
  Check, X, Search, Loader2, ExternalLink, MessageCircle,
  Heart, Eye, Clock, Filter, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GlassCard } from '@/components/glass-card'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { format } from 'date-fns'

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface VerificationRequest {
  id: string
  userId: string
  category: string
  idProofUrl: string | null
  reason: string
  status: string
  adminNote: string | null
  createdAt: string
  user: {
    id: string
    fullName: string
    avatarUrl: string | null
    phone: string
    profile: {
      id: string
      bio: string
      avatarUrl: string | null
      isPublicFigure: boolean
      isVerified: boolean
      followersCount: number
    } | null
  }
}

interface PostItem {
  id: string
  authorId: string
  content: string
  mediaUrls: string | null
  likesCount: number
  commentsCount: number
  isPinned: boolean
  isDeleted: boolean
  createdAt: string
  author: {
    id: string
    fullName: string
    avatarUrl: string | null
    profile: {
      isPublicFigure: boolean
      isVerified: boolean
      publicFigureCategory: string | null
    } | null
  }
  _count: {
    comments: number
    likes: number
  }
}

interface PublicFigure {
  id: string
  userId: string
  bio: string
  avatarUrl: string | null
  isPublicFigure: boolean
  publicFigureCategory: string | null
  isVerified: boolean
  followersCount: number
  user: {
    id: string
    fullName: string
    avatarUrl: string | null
    role: string
  }
}

// ─── Category Display Names ────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  POLITICIAN: 'Politician',
  INFLUENCER: 'Influencer',
  CELEBRITY: 'Celebrity',
  GOVT_OFFICIAL: 'Government Official',
}

const CATEGORY_COLORS: Record<string, string> = {
  POLITICIAN: 'bg-orange-100 text-orange-700 border-orange-200',
  INFLUENCER: 'bg-pink-100 text-pink-700 border-pink-200',
  CELEBRITY: 'bg-purple-100 text-purple-700 border-purple-200',
  GOVT_OFFICIAL: 'bg-blue-100 text-blue-700 border-blue-200',
}

// ─── Animation Variants ────────────────────────────────────────────────────────

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
}

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
}

// ─── VerificationRequestsTab ────────────────────────────────────────────────────

function VerificationRequestsTab() {
  const currentUser = useAppStore((s) => s.currentUser)
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [adminNote, setAdminNote] = useState<Record<string, string>>({})
  const [confirmDialog, setConfirmDialog] = useState<{
    id: string
    action: 'approved' | 'rejected'
  } | null>(null)

  const fetchRequests = useCallback(() => {
    setLoading(true)
    fetch('/api/social/verification?status=pending')
      .then((res) => res.json())
      .then((data) => {
        setRequests(Array.isArray(data.requests) ? data.requests : [])
      })
      .catch(() => {
        toast.error('Failed to load verification requests')
        setRequests([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    if (!currentUser) return
    setProcessingId(id)
    try {
      const body: Record<string, unknown> = { status: action }
      if (adminNote[id]) {
        body.adminNote = adminNote[id]
      }
      const res = await fetch(`/api/social/verification/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to process request')
      }
      toast.success(
        action === 'approved'
          ? 'Verification approved successfully'
          : 'Verification rejected',
        { description: action === 'approved' ? 'User is now a verified public figure' : 'The user has been notified' }
      )
      setRequests((prev) => prev.filter((r) => r.id !== id))
      setAdminNote((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process request')
    } finally {
      setProcessingId(null)
      setConfirmDialog(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <span className="ml-3 text-gray-500">Loading verification requests...</span>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <motion.div {...fadeInUp} className="text-center py-16">
        <ShieldCheck className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">No Pending Requests</h3>
        <p className="text-gray-500 mt-1">All verification requests have been processed</p>
      </motion.div>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
      {requests.map((req) => (
        <motion.div key={req.id} variants={fadeInUp} layout>
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* User Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#4169E1] flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {req.user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{req.user.fullName}</h4>
                    <p className="text-sm text-gray-500">{req.user.phone}</p>
                  </div>
                </div>

                {/* Category Badge */}
                <div className="md:ml-auto shrink-0">
                  <Badge className={`${CATEGORY_COLORS[req.category] || 'bg-gray-100 text-gray-700'} border text-xs font-medium`}>
                    {CATEGORY_LABELS[req.category] || req.category}
                  </Badge>
                </div>
              </div>

              {/* Reason */}
              <div className="mt-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</label>
                <p className="mt-1 text-sm text-gray-700 leading-relaxed">{req.reason}</p>
              </div>

              {/* ID Proof */}
              {req.idProofUrl && (
                <div className="mt-3">
                  <a
                    href={req.idProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[#4169E1] hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View ID Proof
                  </a>
                </div>
              )}

              {/* Submitted Date */}
              <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="h-3.5 w-3.5" />
                Submitted {format(new Date(req.createdAt), 'MMM d, yyyy · h:mm a')}
              </div>

              {/* Admin Note Input */}
              <div className="mt-4">
                <Textarea
                  placeholder="Add an admin note (optional)..."
                  value={adminNote[req.id] || ''}
                  onChange={(e) => setAdminNote((prev) => ({ ...prev, [req.id]: e.target.value }))}
                  className="text-sm resize-none h-16 bg-white/50 border-gray-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => setConfirmDialog({ id: req.id, action: 'approved' })}
                  disabled={processingId === req.id}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {processingId === req.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Approve
                </Button>
                <Button
                  onClick={() => setConfirmDialog({ id: req.id, action: 'rejected' })}
                  disabled={processingId === req.id}
                  variant="destructive"
                  className="flex-1 gap-2"
                >
                  {processingId === req.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Reject
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmDialog?.action === 'approved' ? (
                <><ShieldCheck className="h-5 w-5 text-emerald-600" /> Confirm Approval</>
              ) : (
                <><AlertTriangle className="h-5 w-5 text-red-500" /> Confirm Rejection</>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.action === 'approved'
                ? 'This will verify the user as a public figure. They will receive a verified badge.'
                : 'This will reject the verification request. The user may reapply later.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setConfirmDialog(null)} className="sm:flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirmDialog) handleAction(confirmDialog.id, confirmDialog.action)
              }}
              className={`sm:flex-1 ${
                confirmDialog?.action === 'approved'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {confirmDialog?.action === 'approved' ? 'Yes, Approve' : 'Yes, Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ─── PostModerationTab ─────────────────────────────────────────────────────────

function PostModerationTab() {
  const currentUser = useAppStore((s) => s.currentUser)
  const [posts, setPosts] = useState<PostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pinned' | 'deleted'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)

  const fetchPosts = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '50',
      includeDeleted: 'true',
    })
    fetch(`/api/social/posts?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(Array.isArray(data.posts) ? data.posts : [])
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1)
        }
      })
      .catch(() => {
        toast.error('Failed to load posts')
        setPosts([])
      })
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  // Client-side filtering
  const filteredPosts = posts.filter((post) => {
    if (filter === 'pinned' && !post.isPinned) return false
    if (filter === 'deleted' && !post.isDeleted) return false
    if (filter === 'all' && post.isDeleted) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        post.content.toLowerCase().includes(q) ||
        post.author.fullName.toLowerCase().includes(q)
      )
    }
    return true
  })

  const handleDelete = async (postId: string) => {
    if (!currentUser) return
    setActionLoading(postId)
    try {
      const res = await fetch(`/api/social/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete post')
      }
      toast.success('Post deleted successfully')
      fetchPosts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete post')
    } finally {
      setActionLoading(null)
      setDeleteDialog(null)
    }
  }

  const handlePinToggle = async (postId: string, currentlyPinned: boolean) => {
    if (!currentUser) return
    setActionLoading(postId)
    try {
      const res = await fetch(`/api/social/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPinned: !currentlyPinned,
          userId: currentUser.id,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update post')
      }
      toast.success(currentlyPinned ? 'Post unpinned' : 'Post pinned to top')
      fetchPosts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update post')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#4169E1]" />
        <span className="ml-3 text-gray-500">Loading posts...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by content or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/50 border-gray-200 focus:border-[#4169E1] focus:ring-[#4169E1]/20"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pinned', 'deleted'] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className={`capitalize ${
                filter === f
                  ? 'bg-[#4169E1] hover:bg-[#4169E1]/90 text-white'
                  : 'hover:bg-white/50'
              }`}
            >
              {f === 'pinned' && <Pin className="h-3.5 w-3.5 mr-1" />}
              {f === 'deleted' && <Trash2 className="h-3.5 w-3.5 mr-1" />}
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <motion.div {...fadeInUp} className="text-center py-16">
          <MessageCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No Posts Found</h3>
          <p className="text-gray-500 mt-1">
            {filter !== 'all' || searchQuery
              ? 'Try adjusting your filters or search'
              : 'No posts have been created yet'}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
          {filteredPosts.map((post) => (
            <motion.div key={post.id} variants={fadeInUp} layout>
              <GlassCard className={`p-0 overflow-hidden ${post.isDeleted ? 'opacity-60' : ''}`}>
                <div className="p-4 md:p-5">
                  <div className="flex items-start gap-3">
                    {/* Author Avatar */}
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#4169E1] to-[#D4AF37] flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {post.author.fullName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Author Name + Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{post.author.fullName}</span>
                        {post.author.profile?.isVerified && (
                          <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
                        )}
                        {post.isPinned && (
                          <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 text-[10px] px-1.5 py-0">
                            <Pin className="h-2.5 w-2.5 mr-0.5" /> Pinned
                          </Badge>
                        )}
                        {post.isDeleted && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Deleted
                          </Badge>
                        )}
                      </div>

                      {/* Post Content */}
                      <p className="mt-1.5 text-sm text-gray-700 leading-relaxed line-clamp-3">
                        {post.content}
                      </p>

                      {/* Stats Row */}
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" /> {post.likesCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" /> {post.commentsCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {format(new Date(post.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {!post.isDeleted && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePinToggle(post.id, post.isPinned)}
                          disabled={actionLoading === post.id}
                          className={`h-8 w-8 p-0 ${
                            post.isPinned
                              ? 'text-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10'
                              : 'text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10'
                          }`}
                          title={post.isPinned ? 'Unpin' : 'Pin'}
                        >
                          {actionLoading === post.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Pin className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteDialog(post.id)}
                          disabled={actionLoading === post.id}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Delete Post
            </DialogTitle>
            <DialogDescription>
              This will soft-delete the post. The post will be hidden from the community feed but can be restored from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog(null)} className="sm:flex-1">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => { if (deleteDialog) handleDelete(deleteDialog) }}
              className="sm:flex-1"
            >
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── LeaderManagementTab ────────────────────────────────────────────────────────

function LeaderManagementTab() {
  const currentUser = useAppStore((s) => s.currentUser)
  const [leaders, setLeaders] = useState<PublicFigure[]>([])
  const [loading, setLoading] = useState(true)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [revokeDialog, setRevokeDialog] = useState<PublicFigure | null>(null)

  const fetchLeaders = useCallback(() => {
    setLoading(true)
    fetch('/api/social/profiles?publicFigures=true')
      .then((res) => res.json())
      .then((data) => {
        setLeaders(Array.isArray(data.profiles) ? data.profiles : [])
      })
      .catch(() => {
        toast.error('Failed to load public figures')
        setLeaders([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchLeaders() }, [fetchLeaders])

  const handleRevokeVerification = async (leader: PublicFigure) => {
    if (!currentUser) return
    setRevokingId(leader.userId)
    try {
      const res = await fetch('/api/social/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: leader.userId,
          isPublicFigure: false,
          isVerified: false,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to revoke verification')
      }
      toast.success('Verification revoked', {
        description: `${leader.user.fullName} is no longer a verified public figure`,
      })
      setLeaders((prev) => prev.filter((l) => l.userId !== leader.userId))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke verification')
    } finally {
      setRevokingId(null)
      setRevokeDialog(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <span className="ml-3 text-gray-500">Loading public figures...</span>
      </div>
    )
  }

  if (leaders.length === 0) {
    return (
      <motion.div {...fadeInUp} className="text-center py-16">
        <Crown className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">No Public Figures</h3>
        <p className="text-gray-500 mt-1">No verified public figures found</p>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {leaders.map((leader) => (
          <motion.div key={leader.id} variants={fadeInUp} layout>
            <GlassCard variant="gold" className="relative overflow-hidden">
              {/* Gold ring avatar */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#D4AF37]/60 p-[3px]">
                    <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                      {leader.avatarUrl || leader.user.avatarUrl ? (
                        <img
                          src={leader.avatarUrl || leader.user.avatarUrl || ''}
                          alt={leader.user.fullName}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-[#D4AF37]">
                          {leader.user.fullName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Verified shield */}
                  <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-lg">
                    <ShieldCheck className="h-4 w-4 text-white" />
                  </div>
                </div>

                <h4 className="font-bold text-gray-900 flex items-center gap-1.5 justify-center">
                  {leader.user.fullName}
                </h4>

                {/* Category */}
                {leader.publicFigureCategory && (
                  <Badge className={`mt-1.5 ${CATEGORY_COLORS[leader.publicFigureCategory] || 'bg-gray-100 text-gray-700'} border text-[10px]`}>
                    {CATEGORY_LABELS[leader.publicFigureCategory] || leader.publicFigureCategory}
                  </Badge>
                )}

                {/* Followers */}
                <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                  <Users className="h-3.5 w-3.5" />
                  <span>{leader.followersCount.toLocaleString()} followers</span>
                </div>

                {/* Bio */}
                {leader.bio && (
                  <p className="mt-2 text-xs text-gray-500 line-clamp-2">{leader.bio}</p>
                )}

                {/* Revoke Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRevokeDialog(leader)}
                  disabled={revokingId === leader.userId}
                  className="mt-4 w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 gap-1.5"
                >
                  {revokingId === leader.userId ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  Revoke Verification
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={!!revokeDialog} onOpenChange={(open) => !open && setRevokeDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Revoke Verification
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke verification for <strong>{revokeDialog?.user.fullName}</strong>?
              This will remove their verified badge and public figure status. They can reapply for verification later.
            </DialogDescription>
          </DialogHeader>
          {revokeDialog && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#D4AF37]/60 p-[2px]">
                <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                  <span className="text-sm font-bold text-[#D4AF37]">
                    {revokeDialog.user.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <p className="font-semibold text-sm">{revokeDialog.user.fullName}</p>
                <p className="text-xs text-gray-500">
                  {revokeDialog.publicFigureCategory
                    ? CATEGORY_LABELS[revokeDialog.publicFigureCategory] || revokeDialog.publicFigureCategory
                    : 'Public Figure'}
                  {' · '}
                  {revokeDialog.followersCount.toLocaleString()} followers
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setRevokeDialog(null)} className="sm:flex-1">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => { if (revokeDialog) handleRevokeVerification(revokeDialog) }}
              className="sm:flex-1"
            >
              Yes, Revoke Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────

type ModerationTab = 'verification' | 'posts' | 'leaders'

interface PendingCount {
  verification: number
}

export function AdminSocialModeration() {
  const [activeTab, setActiveTab] = useState<ModerationTab>('verification')
  const [pendingCount, setPendingCount] = useState<PendingCount>({ verification: 0 })

  // Fetch pending verification count for badge
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/social/verification?status=pending')
        if (res.ok) {
          const data = await res.json()
          const count = Array.isArray(data.requests) ? data.requests.length : 0
          setPendingCount({ verification: count })
        }
      } catch {
        // Non-critical
      }
    }
    fetchCount()
    // Refresh every 30 seconds
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const tabs: Array<{
    id: ModerationTab
    label: string
    icon: React.ReactNode
    badge?: number
  }> = [
    {
      id: 'verification',
      label: 'Verification Requests',
      icon: <ShieldCheck className="h-4 w-4" />,
      badge: pendingCount.verification > 0 ? pendingCount.verification : undefined,
    },
    {
      id: 'posts',
      label: 'Post Moderation',
      icon: <MessageCircle className="h-4 w-4" />,
    },
    {
      id: 'leaders',
      label: 'Leader Management',
      icon: <Crown className="h-4 w-4" />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-200 relative
              ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#4169E1] to-[#4169E1]/90 text-white shadow-lg shadow-[#4169E1]/25'
                  : 'bg-white/50 text-gray-600 hover:bg-white/80 hover:text-gray-900 border border-gray-200/60'
              }
            `}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">
              {tab.label === 'Verification Requests' ? 'Verify' : tab.label === 'Post Moderation' ? 'Posts' : 'Leaders'}
            </span>
            {tab.badge && (
              <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'verification' && <VerificationRequestsTab />}
          {activeTab === 'posts' && <PostModerationTab />}
          {activeTab === 'leaders' && <LeaderManagementTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
