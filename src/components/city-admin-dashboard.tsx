'use client'
import { supabase } from '@/lib/supabase'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crown, TrendingUp, Users, Store, IndianRupee, Wallet,
  CheckCircle, AlertCircle, Clock, ArrowUpRight, Eye,
  Plus, Pencil, Trash2, Megaphone, Image as ImageIcon,
  ChevronRight, Loader2, XCircle, Ban, FileText,
  Newspaper, LayoutGrid, ShieldCheck, BadgeDollarSign,
  Banknote, CircleDot, MessageSquare, ExternalLink,
  UserCheck, UserX, BarChart3, PiggyBank, HandCoins,
  Receipt, CalendarDays, ArrowDownToLine, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GlassCard } from '@/components/glass-card'
import { useAppStore } from '@/lib/store'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────
interface TransactionItem {
  id: string
  userId: string
  agentId: string | null
  cityAdminId: string
  cityId: string
  type: string
  amount: number
  agentCommission: number
  cityAdminShare: number
  superAdminShare: number
  status: string
  description: string | null
  createdAt: string
  user: { id: string; fullName: string; phone: string }
  agent: { id: string; fullName: string; phone: string } | null
  city: { id: string; name: string; slug: string }
}

interface AgentItem {
  id: string
  fullName: string
  phone: string
  email: string | null
  agentCityId: string | null
  isAgentApproved: boolean
  totalEarnings: number
  pendingPayout: number
  upiId: string | null
  agentCity: { id: string; name: string } | null
}

interface PendingAgentRequest {
  id: string
  userId: string
  cityName: string
  reason: string | null
  type: string
  status: string
  agentCityId: string | null
  createdAt: string
  user: { id: string; fullName: string; phone: string }
}

interface PayoutItem {
  id: string
  userId: string
  amount: number
  status: string
  upiId: string | null
  bankDetails: string | null
  note: string | null
  createdAt: string
  user: {
    id: string
    fullName: string
    phone: string
    upiId: string | null
    totalEarnings: number
    pendingPayout: number
  }
}

interface CityListing {
  id: string
  slug: string
  name: string
  category: string
  images: string | null
  isApproved: boolean
  isPremium: boolean
  isFeatured: boolean
  viewsCount: number
  createdAt: string
  user: { id: string; fullName: string; phone: string }
  city: { id: string; name: string; slug: string }
  _count: { reviews: number; leads: number }
}

interface NewsItem {
  id: string
  title: string
  content: string | null
  imageUrl: string | null
  source: string | null
  isPublished: boolean
  createdAt: string
  cityId: string
  city: { id: string; name: string; slug: string }
}

interface BannerItem {
  id: string
  title: string
  imageUrl: string | null
  shopName: string
  offerText?: string | null
  linkUrl?: string | null
  phoneNumber?: string | null
  cityId?: string | null
  isActive: boolean
  createdAt: string
}

// ─── Royal Glassmorphism Card Wrapper ─────────────────────────────
function RoyalCard({ children, className = '', variant = 'default' }: {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'gold' | 'blue'
}) {
  const variantClass = variant === 'gold'
    ? 'border-l-4 border-l-[#D4AF37]'
    : variant === 'blue'
      ? 'border-l-4 border-l-[#4169E1]'
      : ''
  return (
    <div className={`bg-white/40 backdrop-blur-xl border border-white/30 shadow-2xl rounded-2xl p-4 md:p-6 ${variantClass} ${className}`}>
      {children}
    </div>
  )
}

// ─── Tab config ───────────────────────────────────────────────────
const TAB_ITEMS = [
  { key: 'revenue', label: 'Revenue', icon: TrendingUp },
  { key: 'agents', label: 'My Agents', icon: Users },
  { key: 'content', label: 'Manage Content', icon: LayoutGrid },
  { key: 'payouts', label: 'Payout History', icon: Wallet },
]

// ─── Component ────────────────────────────────────────────────────
export function CityAdminDashboard() {
  const { user } = useAuth()
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const themePrimary = useAppStore((s) => s.themePrimary)
  const themeSecondary = useAppStore((s) => s.themeSecondary)
  const managedCityId = user?.managedCityId

  // ─── Active tab ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('revenue')

  // ─── Revenue Tab State ──────────────────────────────────────────
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalListings, setTotalListings] = useState(0)
  const [activeSubscriptions, setActiveSubscriptions] = useState(0)
  const [showPayoutDialog, setShowPayoutDialog] = useState(false)
  const [payoutForm, setPayoutForm] = useState({ upiId: '', amount: '' })
  const [submittingPayout, setSubmittingPayout] = useState(false)

  // ─── Agents Tab State ───────────────────────────────────────────
  const [agents, setAgents] = useState<AgentItem[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<AgentItem | null>(null)
  const [showAgentDialog, setShowAgentDialog] = useState(false)
  const [pendingAgentRequests, setPendingAgentRequests] = useState<PendingAgentRequest[]>([])
  const [pendingAgentsLoading, setPendingAgentsLoading] = useState(false)
  const [processingAgentId, setProcessingAgentId] = useState<string | null>(null)

  // ─── Content Tab State ──────────────────────────────────────────
  const [contentSubTab, setContentSubTab] = useState('listings')
  // Listings
  const [cityListings, setCityListings] = useState<CityListing[]>([])
  const [listingsLoading, setListingsLoading] = useState(false)
  const [listingFilter, setListingFilter] = useState('all')
  // News
  const [newsArticles, setNewsArticles] = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null)
  const [newsForm, setNewsForm] = useState({ title: '', content: '', imageUrl: '', source: '', isPublished: true })
  const [savingNews, setSavingNews] = useState(false)
  const [showNewsForm, setShowNewsForm] = useState(false)
  const [deleteNewsDialog, setDeleteNewsDialog] = useState<string | null>(null)
  // Banners
  const [banners, setBanners] = useState<BannerItem[]>([])
  const [bannersLoading, setBannersLoading] = useState(false)
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null)
  const [bannerForm, setBannerForm] = useState({ title: '', imageUrl: '', shopName: '', offerText: '', linkUrl: '', phoneNumber: '', isActive: true })
  const [savingBanner, setSavingBanner] = useState(false)
  const [showBannerForm, setShowBannerForm] = useState(false)
  const [deleteBannerDialog, setDeleteBannerDialog] = useState<string | null>(null)

  // ─── Payout History Tab State ───────────────────────────────────
  const [payoutHistory, setPayoutHistory] = useState<PayoutItem[]>([])
  const [payoutHistoryLoading, setPayoutHistoryLoading] = useState(false)

  // ─── Platform settings ─────────────────────────────────────────
  const platformSettings = useAppStore((s) => s.platformSettings)

  // ─── Commission calculation ─────────────────────────────────────
  const commissionSharePercent = parseFloat(platformSettings.city_admin_commission_share || '30')
  const agentCommissionPercent = parseFloat(platformSettings.agent_commission_share || '20')

  // ─── Derived revenue values ─────────────────────────────────────
  const totalCityRevenue = useMemo(() =>
    transactions.reduce((sum, tx) => sum + tx.amount, 0),
    [transactions]
  )
  const totalCommissionEarned = useMemo(() =>
    transactions.reduce((sum, tx) => sum + tx.cityAdminShare, 0),
    [transactions]
  )
  const totalAgentCommission = useMemo(() =>
    transactions.reduce((sum, tx) => sum + tx.agentCommission, 0),
    [transactions]
  )

  // ─── Monthly Revenue Chart Data ─────────────────────────────────
  const revenueChartData = useMemo(() => {
    const monthMap: Record<string, { revenue: number; commission: number }> = {}
    transactions.forEach((tx) => {
      const d = new Date(tx.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!monthMap[key]) monthMap[key] = { revenue: 0, commission: 0 }
      monthMap[key].revenue += tx.amount
      monthMap[key].commission += tx.cityAdminShare
    })
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        Revenue: data.revenue,
        Commission: data.commission,
      }))
  }, [transactions])

  // ─── Fetch Transactions (Revenue tab) ───────────────────────────
  const fetchTransactions = useCallback(() => {
    if (!user?.id) return
    setTransactionsLoading(true)
    fetch(`/api/transactions?cityAdminId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        const txList = Array.isArray(data) ? data : []
        setTransactions(txList)
        const total = txList.reduce((sum: number, tx: TransactionItem) => sum + tx.cityAdminShare, 0)
        setTotalRevenue(total)
      })
      .catch(() => toast.error('Failed to load revenue data'))
      .finally(() => setTransactionsLoading(false))
  }, [user?.id])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  // ─── Fetch city stats ──────────────────────────────────────────
  useEffect(() => {
    if (!managedCityId) return
    fetch(`/api/listings?cityId=${managedCityId}&limit=1`)
      .then((res) => res.json())
      .then((data) => setTotalListings(data.pagination?.total || data.listings?.length || 0))
      .catch(() => {})
    fetch(`/api/subscriptions?cityId=${managedCityId}&status=active`)
      .then((res) => res.json())
      .then((data) => setActiveSubscriptions(Array.isArray(data) ? data.length : data.subscriptions?.length || 0))
      .catch(() => {})
  }, [managedCityId])

  // ─── Fetch Agents ───────────────────────────────────────────────
  const fetchAgents = useCallback(() => {
    setAgentsLoading(true)
    fetch('/api/admin/users?role=agent')
      .then((res) => res.json())
      .then((data) => {
        const allAgents: AgentItem[] = Array.isArray(data) ? data : []
        const cityAgents = managedCityId
          ? allAgents.filter((a) => a.agentCityId === managedCityId)
          : allAgents
        setAgents(cityAgents)
      })
      .catch(() => toast.error('Failed to load agents'))
      .finally(() => setAgentsLoading(false))
  }, [managedCityId])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  // ─── Fetch Pending Agent Requests ───────────────────────────────
  const fetchPendingAgentRequests = useCallback(() => {
    if (!managedCityId) return
    setPendingAgentsLoading(true)
    fetch('/api/admin-requests?type=agent&status=pending')
      .then((res) => res.json())
      .then((data) => {
        const allRequests: PendingAgentRequest[] = Array.isArray(data) ? data : []
        // Filter by managed city
        const cityRequests = allRequests.filter((r) => r.agentCityId === managedCityId)
        setPendingAgentRequests(cityRequests)
      })
      .catch(() => {/* silently fail */})
      .finally(() => setPendingAgentsLoading(false))
  }, [managedCityId])

  useEffect(() => { if (activeTab === 'agents') fetchPendingAgentRequests() }, [activeTab, fetchPendingAgentRequests])

  // ─── Fetch City Listings ────────────────────────────────────────
  const fetchCityListings = useCallback(() => {
    if (!managedCityId) return
    setListingsLoading(true)
    const params = new URLSearchParams({ limit: '50' })
    if (listingFilter !== 'all') params.set('status', listingFilter)
    fetch(`/api/admin/listings?${params}`)
      .then((res) => res.json())
      .then((data) => {
        const all: CityListing[] = data.listings || []
        const cityOnly = all.filter((l) => l.city?.id === managedCityId)
        setCityListings(cityOnly)
      })
      .catch(() => toast.error('Failed to load listings'))
      .finally(() => setListingsLoading(false))
  }, [managedCityId, listingFilter])

  useEffect(() => { fetchCityListings() }, [fetchCityListings])

  // ─── Fetch News ─────────────────────────────────────────────────
  const fetchNews = useCallback(() => {
    if (!managedCityId) return
    setNewsLoading(true)
    fetch('/api/admin/news?all=true')
      .then((res) => res.json())
      .then((data) => {
        const all: NewsItem[] = Array.isArray(data) ? data : []
        setNewsArticles(all.filter((n) => n.cityId === managedCityId))
      })
      .catch(() => toast.error('Failed to load news'))
      .finally(() => setNewsLoading(false))
  }, [managedCityId])

  useEffect(() => { if (contentSubTab === 'news') fetchNews() }, [contentSubTab, fetchNews])

  // ─── Fetch Banners ──────────────────────────────────────────────
  const fetchBanners = useCallback(() => {
    if (!managedCityId) return
    setBannersLoading(true)
    fetch(`/api/banners?all=true&cityId=${managedCityId}`)
      .then((res) => res.json())
      .then((data) => setBanners(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load banners'))
      .finally(() => setBannersLoading(false))
  }, [managedCityId])

  useEffect(() => { if (contentSubTab === 'banners') fetchBanners() }, [contentSubTab, fetchBanners])

  // ─── Fetch Payout History ───────────────────────────────────────
  const fetchPayoutHistory = useCallback(() => {
    if (!user?.id) return
    setPayoutHistoryLoading(true)
    fetch(`/api/payouts?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => setPayoutHistory(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load payout history'))
      .finally(() => setPayoutHistoryLoading(false))
  }, [user?.id])

  useEffect(() => { if (activeTab === 'payouts') fetchPayoutHistory() }, [activeTab, fetchPayoutHistory])

  // ─── Handlers ───────────────────────────────────────────────────

  // Request Payout
  const handleRequestPayout = async () => {
    if (!user?.id || !payoutForm.upiId || !payoutForm.amount) {
      toast.error('UPI ID and amount are required')
      return
    }
    setSubmittingPayout(true)
    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: parseFloat(payoutForm.amount),
          upiId: payoutForm.upiId,
        }),
      })
      if (res.ok) {
        toast.success('Payout request submitted!')
        setShowPayoutDialog(false)
        setPayoutForm({ upiId: '', amount: '' })
        fetchPayoutHistory()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to request payout')
      }
    } catch {
      toast.error('Failed to request payout')
    } finally {
      setSubmittingPayout(false)
    }
  }

  // Handle Agent Request (approve/reject)
  const handleAgentRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessingAgentId(requestId)
    try {
      const res = await fetch('/api/admin-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      })
      if (res.ok) {
        toast.success(`Agent ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
        fetchPendingAgentRequests()
        fetchAgents()
      } else {
        toast.error('Failed to process agent request')
      }
    } catch {
      toast.error('Failed to process agent request')
    } finally {
      setProcessingAgentId(null)
    }
  }

  // Listing approve/reject
  const handleListingAction = async (listingId: string, action: string) => {
    try {
      const res = await fetch('/api/admin/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, action }),
      })
      if (res.ok) {
        toast.success(`Listing ${action} successful`)
        fetchCityListings()
      } else {
        toast.error('Action failed')
      }
    } catch {
      toast.error('Action failed')
    }
  }

  // News CRUD
  const handleSaveNews = async () => {
    if (!newsForm.title || !managedCityId) {
      toast.error('Title is required')
      return
    }
    setSavingNews(true)
    try {
      const payload = {
        ...(editingNews ? { id: editingNews.id } : {}),
        title: newsForm.title,
        cityId: managedCityId,
        content: newsForm.content || null,
        imageUrl: newsForm.imageUrl || null,
        source: newsForm.source || null,
        isPublished: newsForm.isPublished,
      }
      const res = await fetch('/api/admin/news', {
        method: editingNews ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast.success(editingNews ? 'News updated!' : 'News created!')
        setShowNewsForm(false)
        setEditingNews(null)
        setNewsForm({ title: '', content: '', imageUrl: '', source: '', isPublished: true })
        fetchNews()
      } else {
        toast.error('Failed to save news')
      }
    } catch {
      toast.error('Failed to save news')
    } finally {
      setSavingNews(false)
    }
  }

  const handleDeleteNews = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/news?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('News deleted')
        fetchNews()
      } else {
        toast.error('Failed to delete news')
      }
    } catch {
      toast.error('Failed to delete news')
    }
    setDeleteNewsDialog(null)
  }

  // Banner CRUD
  const handleSaveBanner = async () => {
    if (!bannerForm.title) {
      toast.error('Title is required')
      return
    }
    if (!bannerForm.phoneNumber) {
      toast.error('Business Owner Phone Number is required')
      return
    }
    setSavingBanner(true)
    try {
      const payload = {
        ...(editingBanner ? { id: editingBanner.id } : {}),
        title: bannerForm.title,
        imageUrl: bannerForm.imageUrl || null,
        shopName: bannerForm.shopName || '',
        offerText: bannerForm.offerText || null,
        linkUrl: bannerForm.linkUrl || null,
        phoneNumber: bannerForm.phoneNumber || null,
        cityId: managedCityId || null,
        isActive: bannerForm.isActive,
      }
      const res = await fetch('/api/banners', {
        method: editingBanner ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast.success(editingBanner ? 'Banner updated!' : 'Banner created!')
        setShowBannerForm(false)
        setEditingBanner(null)
        setBannerForm({ title: '', imageUrl: '', shopName: '', offerText: '', linkUrl: '', phoneNumber: '', isActive: true })
        fetchBanners()
      } else {
        toast.error('Failed to save banner')
      }
    } catch {
      toast.error('Failed to save banner')
    } finally {
      setSavingBanner(false)
    }
  }

  const handleDeleteBanner = async (id: string) => {
    try {
      const res = await fetch(`/api/banners?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Banner deleted')
        fetchBanners()
      } else {
        toast.error('Failed to delete banner')
      }
    } catch {
      toast.error('Failed to delete banner')
    }
    setDeleteBannerDialog(null)
  }

  // ─── Helpers ────────────────────────────────────────────────────
  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Clock className="size-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><CheckCircle className="size-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="size-3 mr-1" />Rejected</Badge>
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 border-green-200"><Banknote className="size-3 mr-1" />Paid</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getListingStatusBadge = (isApproved: boolean, isFeatured: boolean) => {
    if (isFeatured && isApproved) {
      return <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30 font-semibold"><Crown className="size-3 mr-0.5" />Featured</Badge>
    }
    if (isApproved) {
      return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="size-3 mr-0.5" />Approved</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><AlertCircle className="size-3 mr-0.5" />Pending</Badge>
  }

  // ─── Animation ──────────────────────────────────────────────────
  const fadeIn = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.25 },
  }

  // ─── Guard ──────────────────────────────────────────────────────
  if (!user || user.role !== 'city_admin') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <GlassCard>
          <p className="text-gray-500">This dashboard is for City Admins only.</p>
        </GlassCard>
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 -mx-3 md:-mx-6 -my-3 md:-my-6 min-h-screen">
      <div className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-6">

        {/* ─── City Admin Header ──────────────────────────────────── */}
        <GlassCard variant="gold" className="mb-4 md:mb-6">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#4169E1] flex items-center justify-center text-white text-xl font-bold shadow-lg"
            >
              <ShieldCheck className="size-7" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{user.fullName}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 text-xs">
                  <Crown className="size-3 mr-1" />
                  City Admin (Franchisee)
                </Badge>
                {managedCityId && (
                  <Badge className="bg-[#4169E1]/10 text-[#4169E1] border-[#4169E1]/20 text-xs">
                    <Store className="size-3 mr-1" />
                    {managedCityId}
                  </Badge>
                )}
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-400">Pending Payout</p>
                <p className="text-sm font-bold text-[#D4AF37]">{formatCurrency(user.pendingPayout || 0)}</p>
              </div>
              <BadgeDollarSign className="size-5 text-[#D4AF37]" />
            </div>
          </div>
        </GlassCard>

        {/* ─── Layout: Desktop Sidebar + Mobile Horizontal Tabs ──── */}
        <div className="flex gap-6">
          {/* Desktop Left Vertical Tab Menu */}
          <div className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24 space-y-1">
              {TAB_ITEMS.map((tab) => {
                const isActive = activeTab === tab.key
                const Icon = tab.icon
                return (
                  <motion.button
                    key={tab.key}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[#D4AF37]/10 text-[#D4AF37] shadow-sm border border-[#D4AF37]/20'
                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-800 border border-transparent'
                    }`}
                  >
                    <Icon className={`size-4.5 ${isActive ? 'text-[#D4AF37]' : ''}`} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <ChevronRight className="size-4 ml-auto text-[#D4AF37]" />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Mobile Top Horizontal Scrollable Tabs */}
          <div className="lg:hidden w-full">
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-3 px-3">
              {TAB_ITEMS.map((tab) => {
                const isActive = activeTab === tab.key
                const Icon = tab.icon
                return (
                  <motion.button
                    key={tab.key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                      isActive
                        ? 'bg-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/25'
                        : 'bg-white/60 text-gray-600 border border-gray-200/50'
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{tab.label}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* ─── Tab Content ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >

                {/* ═══════════════════════════════════════════════════════
                    TAB 1: Revenue Overview (Enhanced)
                ═══════════════════════════════════════════════════════ */}
                {activeTab === 'revenue' && (
                  <div className="space-y-6">
                    {/* 4 Revenue Cards in 2x2 Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Total City Revenue */}
                      <motion.div {...fadeIn}>
                        <RoyalCard variant="gold" className="relative overflow-hidden">
                          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-[#D4AF37]/10" />
                          <div className="relative">
                            <div className="flex items-center justify-between mb-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#F5D76E] flex items-center justify-center shadow-md">
                                <IndianRupee className="size-5 text-white" />
                              </div>
                              <ArrowUpRight className="size-4 text-[#D4AF37]" />
                            </div>
                            <p className="text-xs text-gray-500 font-medium">Total City Revenue</p>
                            <p className="text-xl font-bold text-[#D4AF37] mt-1">{formatCurrency(totalCityRevenue)}</p>
                            <p className="text-[10px] text-gray-400 mt-1">All transactions in your city</p>
                          </div>
                        </RoyalCard>
                      </motion.div>

                      {/* Your Commission Share */}
                      <motion.div {...fadeIn}>
                        <RoyalCard variant="blue" className="relative overflow-hidden">
                          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-[#4169E1]/10" />
                          <div className="relative">
                            <div className="flex items-center justify-between mb-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4169E1] to-[#6B8FF1] flex items-center justify-center shadow-md">
                                <HandCoins className="size-5 text-white" />
                              </div>
                              <BadgeDollarSign className="size-4 text-[#4169E1]" />
                            </div>
                            <p className="text-xs text-gray-500 font-medium">Your Commission</p>
                            <p className="text-xl font-bold text-[#4169E1] mt-1">{formatCurrency(totalCommissionEarned)}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{commissionSharePercent}% of net revenue</p>
                          </div>
                        </RoyalCard>
                      </motion.div>

                      {/* Pending Payout */}
                      <motion.div {...fadeIn}>
                        <RoyalCard className="relative overflow-hidden">
                          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-orange-500/10" />
                          <div className="relative">
                            <div className="flex items-center justify-between mb-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-md">
                                <Clock className="size-5 text-white" />
                              </div>
                              <span className="text-[10px] font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">Awaiting</span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium">Pending Payout</p>
                            <p className="text-xl font-bold text-orange-600 mt-1">{formatCurrency(user.pendingPayout || 0)}</p>
                            <p className="text-[10px] text-gray-400 mt-1">Ready for withdrawal</p>
                          </div>
                        </RoyalCard>
                      </motion.div>

                      {/* Available for Withdrawal */}
                      <motion.div {...fadeIn}>
                        <RoyalCard className="relative overflow-hidden">
                          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-green-500/10" />
                          <div className="relative">
                            <div className="flex items-center justify-between mb-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-400 flex items-center justify-center shadow-md">
                                <PiggyBank className="size-5 text-white" />
                              </div>
                              <ArrowDownToLine className="size-4 text-green-600" />
                            </div>
                            <p className="text-xs text-gray-500 font-medium">Total Earned</p>
                            <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(user.totalEarnings || 0)}</p>
                            <p className="text-[10px] text-gray-400 mt-1">Lifetime earnings</p>
                          </div>
                        </RoyalCard>
                      </motion.div>
                    </div>

                    {/* Commission Breakdown Card */}
                    <RoyalCard variant="gold">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#4169E1] flex items-center justify-center shadow-md">
                          <Receipt className="size-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">How Your Commission Works</h3>
                          <p className="text-xs text-gray-400">Revenue split for every transaction in your city</p>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-[#D4AF37]/5 via-[#4169E1]/5 to-[#D4AF37]/5 rounded-xl p-4 border border-[#D4AF37]/10">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          You earn <span className="font-bold text-[#D4AF37]">{commissionSharePercent}%</span> of net revenue
                          (after agent commission) from every transaction in your city.
                          When a business pays ₹100, the agent gets <span className="font-semibold text-gray-600">{agentCommissionPercent}%</span> (₹{100 * agentCommissionPercent / 100}),
                          you get <span className="font-bold text-[#4169E1]">{commissionSharePercent}%</span> of the remaining
                          (₹{((100 - 100 * agentCommissionPercent / 100) * commissionSharePercent / 100).toFixed(0)}),
                          and the platform keeps the rest.
                        </p>
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-[#D4AF37]" />
                            <span className="text-xs text-gray-600">You ({commissionSharePercent}%)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-gray-400" />
                            <span className="text-xs text-gray-600">Agent ({agentCommissionPercent}%)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-[#4169E1]" />
                            <span className="text-xs text-gray-600">Platform ({100 - commissionSharePercent - agentCommissionPercent}%)</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="text-center p-3 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/10">
                          <p className="text-lg font-bold text-[#D4AF37]">{formatCurrency(totalCommissionEarned)}</p>
                          <p className="text-[10px] text-gray-500">Your Share</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <p className="text-lg font-bold text-gray-600">{formatCurrency(totalAgentCommission)}</p>
                          <p className="text-[10px] text-gray-500">Agent Share</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-[#4169E1]/5 border border-[#4169E1]/10">
                          <p className="text-lg font-bold text-[#4169E1]">{formatCurrency(totalCityRevenue - totalCommissionEarned - totalAgentCommission)}</p>
                          <p className="text-[10px] text-gray-500">Platform Share</p>
                        </div>
                      </div>
                    </RoyalCard>

                    {/* Revenue Trend Chart */}
                    {revenueChartData.length > 0 && (
                      <RoyalCard>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <BarChart3 className="size-4 text-[#4169E1]" />
                            Revenue Trend
                          </h3>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                              <span className="text-[10px] text-gray-500">Revenue</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#4169E1]" />
                              <span className="text-[10px] text-gray-500">Commission</span>
                            </div>
                          </div>
                        </div>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueChartData}>
                              <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#4169E1" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#4169E1" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                              <Tooltip
                                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, undefined as unknown as string]}
                              />
                              <Area type="monotone" dataKey="Revenue" stroke="#D4AF37" strokeWidth={2.5} fill="url(#colorRevenue)" />
                              <Area type="monotone" dataKey="Commission" stroke="#4169E1" strokeWidth={2.5} fill="url(#colorCommission)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </RoyalCard>
                    )}

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <motion.div {...fadeIn}>
                        <RoyalCard className="text-center">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4169E1] to-[#6B8FF1] flex items-center justify-center mx-auto shadow-md mb-3">
                            <Store className="size-6 text-white" />
                          </div>
                          <p className="text-sm text-gray-500 mb-1">Total Listings</p>
                          <p className="text-2xl font-bold text-gray-800">{totalListings}</p>
                          <p className="text-xs text-gray-400 mt-1">In your city</p>
                        </RoyalCard>
                      </motion.div>
                      <motion.div {...fadeIn}>
                        <RoyalCard className="text-center">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#F5D76E] flex items-center justify-center mx-auto shadow-md mb-3">
                            <Crown className="size-6 text-white" />
                          </div>
                          <p className="text-sm text-gray-500 mb-1">Active Subscriptions</p>
                          <p className="text-2xl font-bold text-gray-800">{activeSubscriptions}</p>
                          <p className="text-xs text-gray-400 mt-1">In your city</p>
                        </RoyalCard>
                      </motion.div>
                    </div>

                    {/* Recent Transactions Table (Enhanced) */}
                    <RoyalCard>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          <TrendingUp className="size-4 text-[#4169E1]" />
                          Recent Transactions
                        </h3>
                        <motion.div whileTap={{ scale: 0.95 }}>
                          <Button
                            size="sm"
                            onClick={() => setShowPayoutDialog(true)}
                            className="bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white font-bold shadow-lg shadow-[#D4AF37]/25"
                          >
                            <Wallet className="size-3.5 mr-1.5" />
                            Request Payout
                          </Button>
                        </motion.div>
                      </div>
                      {transactionsLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="size-6 animate-spin text-[#D4AF37]" />
                        </div>
                      ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <IndianRupee className="size-10 mx-auto mb-2 opacity-30" />
                          <p>No transactions yet</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto -mx-4 md:-mx-6 px-4 md:px-6">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Buyer</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Your Share</TableHead>
                                <TableHead className="text-right">Agent Comm.</TableHead>
                                <TableHead>Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {transactions.slice(0, 15).map((tx) => (
                                <TableRow key={tx.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                                        <Receipt className="size-3.5 text-[#D4AF37]" />
                                      </div>
                                      <span className="text-sm font-medium text-gray-800">{tx.type}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm text-gray-600">{tx.user?.fullName || '-'}</TableCell>
                                  <TableCell className="text-right font-semibold text-gray-800">{formatCurrency(tx.amount)}</TableCell>
                                  <TableCell className="text-right font-bold text-[#D4AF37]">+{formatCurrency(tx.cityAdminShare)}</TableCell>
                                  <TableCell className="text-right text-gray-500">{formatCurrency(tx.agentCommission)}</TableCell>
                                  <TableCell className="text-gray-400 text-xs whitespace-nowrap">
                                    {new Date(tx.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </RoyalCard>
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════
                    TAB 2: My Agents (Enhanced)
                ═══════════════════════════════════════════════════════ */}
                {activeTab === 'agents' && (
                  <div className="space-y-6">
                    {/* Pending Agent Approvals */}
                    {pendingAgentRequests.length > 0 && (
                      <RoyalCard variant="gold">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <AlertCircle className="size-4 text-[#D4AF37]" />
                            Pending Agent Approvals
                          </h3>
                          <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 text-xs">
                            {pendingAgentRequests.length} pending
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {pendingAgentRequests.map((req) => (
                            <div
                              key={req.id}
                              className="flex items-center justify-between p-3 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/15"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#4169E1]/10 flex items-center justify-center shrink-0">
                                  <Users className="size-5 text-[#4169E1]" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-800">{req.user?.fullName || 'Unknown'}</p>
                                  <p className="text-xs text-gray-400">{req.user?.phone || '-'} · Wants to join your city</p>
                                  {req.reason && (
                                    <p className="text-xs text-gray-500 mt-0.5 italic">&ldquo;{req.reason}&rdquo;</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  onClick={() => handleAgentRequest(req.id, 'approve')}
                                  disabled={processingAgentId === req.id}
                                  className="bg-green-600 hover:bg-green-700 text-white h-8"
                                >
                                  {processingAgentId === req.id ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <UserCheck className="size-3.5 mr-1" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAgentRequest(req.id, 'reject')}
                                  disabled={processingAgentId === req.id}
                                  className="text-red-600 border-red-200 hover:bg-red-50 h-8"
                                >
                                  <UserX className="size-3.5 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </RoyalCard>
                    )}

                    {/* Agent Cards Grid */}
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Users className="size-4 text-[#4169E1]" />
                        My Agents
                      </h3>
                      <Badge className="bg-[#4169E1]/10 text-[#4169E1] border-[#4169E1]/20 text-xs">
                        {agents.length} agents
                      </Badge>
                    </div>

                    {agentsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="size-6 animate-spin text-[#D4AF37]" />
                      </div>
                    ) : agents.length === 0 ? (
                      <RoyalCard className="text-center">
                        <div className="py-8 text-gray-400">
                          <Users className="size-10 mx-auto mb-2 opacity-30" />
                          <p>No agents in your city yet</p>
                          <p className="text-xs mt-1">Agents who apply to your city will appear here</p>
                        </div>
                      </RoyalCard>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {agents.map((agent) => (
                          <motion.div key={agent.id} {...fadeIn}>
                            <RoyalCard variant={agent.isAgentApproved ? 'blue' : 'default'} className="relative overflow-hidden">
                              <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-[#4169E1]/5" />
                              <div className="relative">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#4169E1] to-[#6B8FF1] flex items-center justify-center text-white font-bold text-sm shadow-md">
                                      {agent.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-800">{agent.fullName}</p>
                                      <p className="text-xs text-gray-400">{agent.phone}</p>
                                    </div>
                                  </div>
                                  {agent.isAgentApproved ? (
                                    <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">
                                      <CheckCircle className="size-2.5 mr-0.5" />Active
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-[10px]">
                                      <Clock className="size-2.5 mr-0.5" />Pending
                                    </Badge>
                                  )}
                                </div>

                                <div className="grid grid-cols-3 gap-2 mt-3">
                                  <div className="text-center p-2 rounded-lg bg-green-50 border border-green-100">
                                    <p className="text-xs text-gray-500">Earnings</p>
                                    <p className="text-sm font-bold text-green-600">{formatCurrency(agent.totalEarnings)}</p>
                                  </div>
                                  <div className="text-center p-2 rounded-lg bg-[#D4AF37]/5 border border-[#D4AF37]/10">
                                    <p className="text-xs text-gray-500">Pending</p>
                                    <p className="text-sm font-bold text-[#D4AF37]">{formatCurrency(agent.pendingPayout)}</p>
                                  </div>
                                  <div className="text-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                                    <p className="text-xs text-gray-500">UPI</p>
                                    <p className="text-[10px] font-semibold text-gray-700 truncate">{agent.upiId || 'Not set'}</p>
                                  </div>
                                </div>

                                <div className="mt-3 flex justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[#4169E1] hover:bg-[#4169E1]/10 h-7 text-xs"
                                    onClick={() => { setSelectedAgent(agent); setShowAgentDialog(true) }}
                                  >
                                    <Eye className="size-3 mr-1" />View Details
                                  </Button>
                                </div>
                              </div>
                            </RoyalCard>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Agent Detail Dialog */}
                    <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Users className="size-5 text-[#4169E1]" />
                            Agent Details
                          </DialogTitle>
                          <DialogDescription>Detailed information about this agent.</DialogDescription>
                        </DialogHeader>
                        {selectedAgent && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#4169E1]/5 to-[#D4AF37]/5 border border-[#4169E1]/10">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4169E1] to-[#6B8FF1] flex items-center justify-center text-white font-bold shadow-md">
                                {selectedAgent.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{selectedAgent.fullName}</p>
                                <p className="text-xs text-gray-400">{selectedAgent.phone}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <p className="text-xs text-gray-500">Total Earnings</p>
                                <p className="font-semibold text-green-600">{formatCurrency(selectedAgent.totalEarnings)}</p>
                              </div>
                              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <p className="text-xs text-gray-500">Pending Payout</p>
                                <p className="font-semibold text-[#D4AF37]">{formatCurrency(selectedAgent.pendingPayout)}</p>
                              </div>
                              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <p className="text-xs text-gray-500">UPI ID</p>
                                <p className="font-semibold text-gray-800 text-sm">{selectedAgent.upiId || 'Not set'}</p>
                              </div>
                              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <p className="text-xs text-gray-500">Status</p>
                                {selectedAgent.isAgentApproved ? (
                                  <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="size-3 mr-1" />Approved</Badge>
                                ) : (
                                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Clock className="size-3 mr-1" />Pending</Badge>
                                )}
                              </div>
                              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="font-semibold text-gray-800 text-sm">{selectedAgent.email || 'Not set'}</p>
                              </div>
                              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <p className="text-xs text-gray-500">City</p>
                                <p className="font-semibold text-gray-800 text-sm">{selectedAgent.agentCity?.name || managedCityId || 'Not set'}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowAgentDialog(false)}>Close</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════
                    TAB 3: Manage Content
                ═══════════════════════════════════════════════════════ */}
                {activeTab === 'content' && (
                  <div className="space-y-6">
                    {/* Sub-tab selector */}
                    <Tabs value={contentSubTab} onValueChange={setContentSubTab}>
                      <TabsList className="grid w-full grid-cols-3 bg-white/60 border border-gray-200/50 rounded-xl p-1">
                        <TabsTrigger value="listings" className="rounded-lg data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white text-xs">
                          <Store className="size-3.5 mr-1" />Listings
                        </TabsTrigger>
                        <TabsTrigger value="news" className="rounded-lg data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white text-xs">
                          <Newspaper className="size-3.5 mr-1" />News
                        </TabsTrigger>
                        <TabsTrigger value="banners" className="rounded-lg data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white text-xs">
                          <Megaphone className="size-3.5 mr-1" />Banners
                        </TabsTrigger>
                      </TabsList>

                      {/* ─── Listings Sub-Tab ─────────────────────── */}
                      <TabsContent value="listings" className="mt-4">
                        <RoyalCard>
                          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                              <Store className="size-4 text-[#4169E1]" />
                              City Listings
                              <Badge className="bg-[#4169E1]/10 text-[#4169E1] text-[10px]">{managedCityId}</Badge>
                            </h3>
                            <Select value={listingFilter} onValueChange={setListingFilter}>
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="featured">Featured</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {listingsLoading ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="size-6 animate-spin text-[#D4AF37]" />
                            </div>
                          ) : cityListings.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                              <Store className="size-10 mx-auto mb-2 opacity-30" />
                              <p>No listings found in your city</p>
                            </div>
                          ) : (
                            <div className="max-h-96 overflow-y-auto space-y-2">
                              {cityListings.map((listing) => (
                                <div
                                  key={listing.id}
                                  className="flex items-center justify-between p-3 rounded-xl bg-white/50 border border-gray-50"
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-9 h-9 rounded-lg bg-[#4169E1]/10 flex items-center justify-center shrink-0">
                                      <Store className="size-4 text-[#4169E1]" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-gray-800 truncate">{listing.name}</p>
                                      <p className="text-xs text-gray-400">{listing.category} · by {listing.user.fullName}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {getListingStatusBadge(listing.isApproved, listing.isFeatured)}
                                    {!listing.isApproved && (
                                      <Button size="sm" variant="ghost" className="h-7 text-green-600 hover:bg-green-50" onClick={() => handleListingAction(listing.id, 'approve')}>
                                        <CheckCircle className="size-3.5" />
                                      </Button>
                                    )}
                                    {listing.isApproved && (
                                      <Button size="sm" variant="ghost" className="h-7 text-red-500 hover:bg-red-50" onClick={() => handleListingAction(listing.id, 'reject')}>
                                        <XCircle className="size-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </RoyalCard>
                      </TabsContent>

                      {/* ─── News Sub-Tab ─────────────────────────── */}
                      <TabsContent value="news" className="mt-4">
                        <RoyalCard>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                              <Newspaper className="size-4 text-[#4169E1]" />
                              City News
                              <Badge className="bg-[#4169E1]/10 text-[#4169E1] text-[10px]">{managedCityId}</Badge>
                            </h3>
                            <Button
                              size="sm"
                              onClick={() => {
                                setEditingNews(null)
                                setNewsForm({ title: '', content: '', imageUrl: '', source: '', isPublished: true })
                                setShowNewsForm(true)
                              }}
                              className="bg-[#4169E1] text-white"
                            >
                              <Plus className="size-3.5 mr-1" />Add News
                            </Button>
                          </div>
                          {newsLoading ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="size-6 animate-spin text-[#D4AF37]" />
                            </div>
                          ) : newsArticles.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                              <Newspaper className="size-10 mx-auto mb-2 opacity-30" />
                              <p>No news articles yet</p>
                            </div>
                          ) : (
                            <div className="max-h-96 overflow-y-auto space-y-2">
                              {newsArticles.map((article) => (
                                <div
                                  key={article.id}
                                  className="flex items-center justify-between p-3 rounded-xl bg-white/50 border border-gray-50"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-800 truncate">{article.title}</p>
                                    <p className="text-xs text-gray-400">
                                      {new Date(article.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      {' · '}
                                      {article.isPublished ? 'Published' : 'Draft'}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button size="sm" variant="ghost" className="h-7" onClick={() => {
                                      setEditingNews(article)
                                      setNewsForm({
                                        title: article.title,
                                        content: article.content || '',
                                        imageUrl: article.imageUrl || '',
                                        source: article.source || '',
                                        isPublished: article.isPublished,
                                      })
                                      setShowNewsForm(true)
                                    }}>
                                      <Pencil className="size-3.5" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-red-500 hover:bg-red-50" onClick={() => setDeleteNewsDialog(article.id)}>
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </RoyalCard>

                        {/* News Form Dialog */}
                        <Dialog open={showNewsForm} onOpenChange={setShowNewsForm}>
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle>{editingNews ? 'Edit News' : 'Add News'}</DialogTitle>
                              <DialogDescription>{managedCityId ? `Publishing to: ${managedCityId}` : 'Create a news article for your city.'}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Title *</Label>
                                <Input
                                  value={newsForm.title}
                                  onChange={(e) => setNewsForm((p) => ({ ...p, title: e.target.value }))}
                                  placeholder="News headline..."
                                />
                              </div>
                              <div>
                                <Label>Content</Label>
                                <Textarea
                                  value={newsForm.content}
                                  onChange={(e) => setNewsForm((p) => ({ ...p, content: e.target.value }))}
                                  placeholder="Write the article content..."
                                  rows={5}
                                />
                              </div>
                              <div>
                                <Label>Image URL</Label>
                                <Input
                                  value={newsForm.imageUrl}
                                  onChange={(e) => setNewsForm((p) => ({ ...p, imageUrl: e.target.value }))}
                                  placeholder="https://..."
                                />
                              </div>
                              <div>
                                <Label>Source</Label>
                                <Input
                                  value={newsForm.source}
                                  onChange={(e) => setNewsForm((p) => ({ ...p, source: e.target.value }))}
                                  placeholder="e.g. Eenadu, Sakshi..."
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="newsPublished"
                                  checked={newsForm.isPublished}
                                  onChange={(e) => setNewsForm((p) => ({ ...p, isPublished: e.target.checked }))}
                                  className="rounded border-gray-300"
                                />
                                <Label htmlFor="newsPublished">Publish immediately</Label>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowNewsForm(false)}>Cancel</Button>
                              <Button onClick={handleSaveNews} disabled={savingNews} className="bg-[#4169E1] text-white">
                                {savingNews && <Loader2 className="size-4 mr-1 animate-spin" />}
                                {editingNews ? 'Update' : 'Create'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {/* Delete News Confirmation */}
                        <Dialog open={!!deleteNewsDialog} onOpenChange={() => setDeleteNewsDialog(null)}>
                          <DialogContent className="sm:max-w-sm">
                            <DialogHeader>
                              <DialogTitle>Delete News?</DialogTitle>
                              <DialogDescription>This action cannot be undone.</DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeleteNewsDialog(null)}>Cancel</Button>
                              <Button variant="destructive" onClick={() => deleteNewsDialog && handleDeleteNews(deleteNewsDialog)}>Delete</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TabsContent>

                      {/* ─── Banners Sub-Tab ──────────────────────── */}
                      <TabsContent value="banners" className="mt-4">
                        <RoyalCard>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                              <Megaphone className="size-4 text-[#4169E1]" />
                              Banner Ads
                              <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] text-[10px]">{managedCityId}</Badge>
                            </h3>
                            <Button
                              size="sm"
                              onClick={() => {
                                setEditingBanner(null)
                                setBannerForm({ title: '', imageUrl: '', shopName: '', offerText: '', linkUrl: '', phoneNumber: '', isActive: true })
                                document.getElementById('city-banner-file-input')?.click()
                              }}
                              className="bg-[#D4AF37] text-white"
                            >
                              <Plus className="size-3.5 mr-1" />Add Banner
                            </Button>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="city-banner-file-input"
                            onChange={async (e) => {
                              const files = e.target.files
                              if (!files || files.length === 0) return

                              toast.info('Compressing and uploading image...')
                              try {
                                const file = files[0]
                                let fileToUpload = file
                                if (file.type.startsWith('image/')) {
                                  const imageCompression = (await import('browser-image-compression')).default
                                  const options = { maxSizeMB: 1, maxWidthOrHeight: 800, useWebWorker: true, initialQuality: 0.6 }
                                  fileToUpload = await imageCompression(file, options)
                                }

                                const { data: uploadResult, error } = await supabase.storage
                                  .from('listing-images')
                                  .upload(`choutuppal/banners/${Date.now()}_${fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '')}`, fileToUpload, { cacheControl: '3600', upsert: false });

                                if (error) throw new Error('Upload failed');
                                const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(uploadResult.path);
                                const data = { url: urlData.publicUrl };

                                setBannerForm((prev) => ({ ...prev, imageUrl: data.url }))
                                setShowBannerForm(true)
                              } catch (err) {
                                toast.error('Failed to upload image')
                              }
                              e.target.value = ''
                            }}
                          />
                          {bannersLoading ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="size-6 animate-spin text-[#D4AF37]" />
                            </div>
                          ) : banners.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                              <Megaphone className="size-10 mx-auto mb-2 opacity-30" />
                              <p>No banner ads yet</p>
                            </div>
                          ) : (
                            <div className="max-h-96 overflow-y-auto space-y-2">
                              {banners.map((banner) => (
                                <div
                                  key={banner.id}
                                  className="flex items-center justify-between p-3 rounded-xl bg-white/50 border border-gray-50"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium text-gray-800 truncate">{banner.title}</p>
                                      {banner.isActive ? (
                                        <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">Active</Badge>
                                      ) : (
                                        <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-[10px]">Inactive</Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-400">{banner.shopName}{banner.offerText ? ` · ${banner.offerText}` : ''}</p>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button size="sm" variant="ghost" className="h-7" onClick={() => {
                                      setEditingBanner(banner)
                                      setBannerForm({
                                        title: banner.title,
                                        imageUrl: banner.imageUrl || '',
                                        shopName: banner.shopName || '',
                                        offerText: banner.offerText || '',
                                        linkUrl: banner.linkUrl || '',
                                        phoneNumber: banner.phoneNumber || '',
                                        isActive: banner.isActive,
                                      })
                                      setShowBannerForm(true)
                                    }}>
                                      <Pencil className="size-3.5" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-red-500 hover:bg-red-50" onClick={() => setDeleteBannerDialog(banner.id)}>
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </RoyalCard>

                        {/* Banner Form Dialog */}
                        <Dialog open={showBannerForm} onOpenChange={setShowBannerForm}>
                          <DialogContent className="sm:max-w-md max-h-[95vh] overflow-y-auto p-0 border-0 bg-white shadow-2xl rounded-xl">
                            <div className="relative w-full aspect-[21/9] bg-gray-100 flex items-center justify-center overflow-hidden">
                              {bannerForm.imageUrl ? (
                                <img src={bannerForm.imageUrl} alt="Banner Preview" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                              ) : (
                                <Megaphone className="size-16 text-gray-300" />
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 bg-black/40 text-white hover:bg-black/60 rounded-full"
                                onClick={() => setShowBannerForm(false)}
                              >
                                <X className="size-5" />
                              </Button>
                            </div>

                            <div className="p-5 space-y-4">
                              <div>
                                <Label className="text-sm font-semibold">Title *</Label>
                                <Input
                                  value={bannerForm.title}
                                  onChange={(e) => setBannerForm((p) => ({ ...p, title: e.target.value }))}
                                  placeholder="Banner title..."
                                />
                              </div>
                              <div>
                                <Label>Shop Name</Label>
                                <Input
                                  value={bannerForm.shopName}
                                  onChange={(e) => setBannerForm((p) => ({ ...p, shopName: e.target.value }))}
                                  placeholder="e.g. Lakshmi Electronics"
                                />
                              </div>
                              <div>
                                <Label>Offer Text</Label>
                                <Input
                                  value={bannerForm.offerText}
                                  onChange={(e) => setBannerForm((p) => ({ ...p, offerText: e.target.value }))}
                                  placeholder="e.g. 50% off on all items!"
                                />
                              </div>
                              <div>
                                <Label>Image URL</Label>
                                <Input
                                  value={bannerForm.imageUrl}
                                  onChange={(e) => setBannerForm((p) => ({ ...p, imageUrl: e.target.value }))}
                                  placeholder="https://..."
                                />
                              </div>
                              <div>
                                <Label>Link URL</Label>
                                <Input
                                  value={bannerForm.linkUrl}
                                  onChange={(e) => setBannerForm((p) => ({ ...p, linkUrl: e.target.value }))}
                                  placeholder="https://..."
                                />
                              </div>
                              <div>
                                <Label>Business Owner Phone Number (Required for Auto-Claim) *</Label>
                                <Input
                                  required
                                  value={bannerForm.phoneNumber}
                                  onChange={(e) => setBannerForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                                  placeholder="e.g. 9876543210"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="bannerActive"
                                  checked={bannerForm.isActive}
                                  onChange={(e) => setBannerForm((p) => ({ ...p, isActive: e.target.checked }))}
                                  className="rounded border-gray-300"
                                />
                                <Label htmlFor="bannerActive">Active</Label>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowBannerForm(false)}>Cancel</Button>
                              <Button onClick={handleSaveBanner} disabled={savingBanner} className="bg-[#D4AF37] text-white">
                                {savingBanner && <Loader2 className="size-4 mr-1 animate-spin" />}
                                {editingBanner ? 'Update' : 'Create'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {/* Delete Banner Confirmation */}
                        <Dialog open={!!deleteBannerDialog} onOpenChange={() => setDeleteBannerDialog(null)}>
                          <DialogContent className="sm:max-w-sm">
                            <DialogHeader>
                              <DialogTitle>Delete Banner?</DialogTitle>
                              <DialogDescription>This action cannot be undone.</DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeleteBannerDialog(null)}>Cancel</Button>
                              <Button variant="destructive" onClick={() => deleteBannerDialog && handleDeleteBanner(deleteBannerDialog)}>Delete</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════
                    TAB 4: Payout History (Enhanced)
                ═══════════════════════════════════════════════════════ */}
                {activeTab === 'payouts' && (
                  <div className="space-y-6">
                    {/* Payout Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <RoyalCard variant="gold" className="text-center">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#F5D76E] flex items-center justify-center mx-auto shadow-md mb-2">
                          <PiggyBank className="size-5 text-white" />
                        </div>
                        <p className="text-xs text-gray-500">Total Earned</p>
                        <p className="text-xl font-bold text-[#D4AF37]">{formatCurrency(user.totalEarnings || 0)}</p>
                      </RoyalCard>
                      <RoyalCard variant="blue" className="text-center">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4169E1] to-[#6B8FF1] flex items-center justify-center mx-auto shadow-md mb-2">
                          <Clock className="size-5 text-white" />
                        </div>
                        <p className="text-xs text-gray-500">Pending Payout</p>
                        <p className="text-xl font-bold text-[#4169E1]">{formatCurrency(user.pendingPayout || 0)}</p>
                      </RoyalCard>
                      <RoyalCard className="text-center">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-400 flex items-center justify-center mx-auto shadow-md mb-2">
                          <Banknote className="size-5 text-white" />
                        </div>
                        <p className="text-xs text-gray-500">Paid Out</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency((user.totalEarnings || 0) - (user.pendingPayout || 0))}
                        </p>
                      </RoyalCard>
                    </div>

                    {/* Payout History Table */}
                    <RoyalCard>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          <Wallet className="size-4 text-[#4169E1]" />
                          Payout History
                        </h3>
                        <Button
                          size="sm"
                          onClick={() => setShowPayoutDialog(true)}
                          className="bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white font-bold shadow-lg shadow-[#D4AF37]/25"
                        >
                          <Plus className="size-3.5 mr-1" />Request Payout
                        </Button>
                      </div>
                      {payoutHistoryLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="size-6 animate-spin text-[#D4AF37]" />
                        </div>
                      ) : payoutHistory.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <Wallet className="size-10 mx-auto mb-2 opacity-30" />
                          <p>No payout requests yet</p>
                          <p className="text-xs mt-1">Click &quot;Request Payout&quot; to withdraw your earnings</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto -mx-4 md:-mx-6 px-4 md:px-6">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Amount</TableHead>
                                <TableHead>UPI ID</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Note</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {payoutHistory.map((payout) => (
                                <TableRow key={payout.id}>
                                  <TableCell className="font-bold text-[#D4AF37]">{formatCurrency(payout.amount)}</TableCell>
                                  <TableCell className="text-gray-500 text-sm">{payout.upiId || '-'}</TableCell>
                                  <TableCell>{getPayoutStatusBadge(payout.status)}</TableCell>
                                  <TableCell className="text-gray-500 text-sm whitespace-nowrap">
                                    {new Date(payout.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </TableCell>
                                  <TableCell className="text-gray-400 text-sm max-w-[150px] truncate">{payout.note || '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </RoyalCard>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ─── Request Payout Dialog ──────────────────────────────── */}
        <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="size-5 text-[#D4AF37]" />
                Request Payout
              </DialogTitle>
              <DialogDescription>Submit a payout request. Your pending balance: {formatCurrency(user?.pendingPayout || 0)}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>UPI ID *</Label>
                <Input
                  value={payoutForm.upiId}
                  onChange={(e) => setPayoutForm((p) => ({ ...p, upiId: e.target.value }))}
                  placeholder="yourname@upi"
                />
                {user?.upiId && (
                  <button
                    type="button"
                    onClick={() => setPayoutForm((p) => ({ ...p, upiId: user.upiId || '' }))}
                    className="text-xs text-[#4169E1] mt-1 hover:underline"
                  >
                    Use saved: {user.upiId}
                  </button>
                )}
              </div>
              <div>
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="Enter amount"
                  min={1}
                  max={user?.pendingPayout || 0}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">Available: {formatCurrency(user?.pendingPayout || 0)}</p>
                  {user?.pendingPayout && user.pendingPayout > 0 && (
                    <button
                      type="button"
                      onClick={() => setPayoutForm((p) => ({ ...p, amount: String(user.pendingPayout) }))}
                      className="text-xs text-[#D4AF37] hover:underline font-medium"
                    >
                      Withdraw All
                    </button>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>Cancel</Button>
              <Button
                onClick={handleRequestPayout}
                disabled={submittingPayout}
                className="bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white font-bold"
              >
                {submittingPayout && <Loader2 className="size-4 mr-1 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}
