'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Ticket, Percent, Tag, Plus, Save, Pencil, Trash2,
  Check, X, Loader2, Copy, Calendar, IndianRupee,
  ToggleLeft, ToggleRight, Search,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { GlassCard } from '@/components/glass-card'
import { useCouponData, useCouponActions, type Coupon } from '@/hooks/use-coupon-store'
import { toast } from 'sonner'

// ─── Animation Variants ────────────────────────────────────────────────────────
const cardVariants: import('framer-motion').Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' as const },
  }),
}

const rowVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: 10, transition: { duration: 0.2 } },
}

// ─── Coupon Form Type ────────────────────────────────────────────────────────

interface CouponFormData {
  code: string
  discountType: 'percentage' | 'flat'
  discountValue: number
  minimumPurchase: number
  expiryDate: string
  maxUsage: number
  isActive: boolean
  description: string
}

const EMPTY_FORM: CouponFormData = {
  code: '',
  discountType: 'percentage',
  discountValue: 10,
  minimumPurchase: 0,
  expiryDate: '',
  maxUsage: 100,
  isActive: true,
  description: '',
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function CouponManagement() {
  const { coupons } = useCouponData()
  const { addCoupon, updateCoupon, deleteCoupon, toggleCouponStatus, generateCode } = useCouponActions()

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CouponFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Edit state
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [editForm, setEditForm] = useState<CouponFormData>(EMPTY_FORM)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)

  // Delete state
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleGenerateCode = () => {
    const code = generateCode()
    setForm((prev) => ({ ...prev, code }))
  }

  const handleCreateCoupon = async () => {
    if (!form.code.trim()) {
      toast.error('Coupon code is required')
      return
    }
    if (form.discountValue <= 0) {
      toast.error('Discount value must be greater than 0')
      return
    }
    if (form.discountType === 'percentage' && form.discountValue > 100) {
      toast.error('Percentage discount cannot exceed 100%')
      return
    }
    if (!form.expiryDate) {
      toast.error('Expiry date is required')
      return
    }
    // Check duplicate code
    if (coupons.some((c) => c.code === form.code.toUpperCase().trim())) {
      toast.error('This coupon code already exists')
      return
    }

    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))

    addCoupon({
      code: form.code.toUpperCase().trim(),
      discountType: form.discountType,
      discountValue: form.discountValue,
      minimumPurchase: form.minimumPurchase,
      expiryDate: new Date(form.expiryDate).toISOString(),
      maxUsage: form.maxUsage,
      isActive: form.isActive,
      description: form.description,
    })

    setSaving(false)
    setShowForm(false)
    setForm(EMPTY_FORM)
    toast.success('Coupon created!', { description: `Code: ${form.code.toUpperCase()}` })
  }

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setEditForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumPurchase: coupon.minimumPurchase,
      expiryDate: coupon.expiryDate.split('T')[0], // format for date input
      maxUsage: coupon.maxUsage,
      isActive: coupon.isActive,
      description: coupon.description || '',
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingCoupon) return
    if (!editForm.code.trim()) {
      toast.error('Coupon code is required')
      return
    }
    if (editForm.discountValue <= 0) {
      toast.error('Discount value must be greater than 0')
      return
    }
    if (editForm.discountType === 'percentage' && editForm.discountValue > 100) {
      toast.error('Percentage discount cannot exceed 100%')
      return
    }
    if (!editForm.expiryDate) {
      toast.error('Expiry date is required')
      return
    }
    // Check duplicate code (excluding current)
    if (coupons.some((c) => c.code === editForm.code.toUpperCase().trim() && c.id !== editingCoupon.id)) {
      toast.error('This coupon code already exists')
      return
    }

    setSavingEdit(true)
    await new Promise((r) => setTimeout(r, 300))

    updateCoupon(editingCoupon.id, {
      code: editForm.code.toUpperCase().trim(),
      discountType: editForm.discountType,
      discountValue: editForm.discountValue,
      minimumPurchase: editForm.minimumPurchase,
      expiryDate: new Date(editForm.expiryDate).toISOString(),
      maxUsage: editForm.maxUsage,
      isActive: editForm.isActive,
      description: editForm.description,
    })

    setSavingEdit(false)
    setEditDialogOpen(false)
    toast.success('Coupon updated', { description: `Code: ${editForm.code.toUpperCase()}` })
  }

  const handleConfirmDelete = async () => {
    if (!deleteDialogId) return
    setDeleting(true)
    await new Promise((r) => setTimeout(r, 300))
    deleteCoupon(deleteDialogId)
    setDeleting(false)
    setDeleteDialogId(null)
    toast.success('Coupon deleted')
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('Coupon code copied!', { description: code })
    }).catch(() => {
      toast.info(`Coupon code: ${code}`)
    })
  }

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date()

  // Filter coupons by search
  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#4169E1]/10">
              <Ticket className="w-5 h-5 text-[#4169E1]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Coupon Management</h2>
              <p className="text-sm text-muted-foreground">Create and manage discount coupons</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setForm(EMPTY_FORM)
              setShowForm(!showForm)
            }}
            className="bg-gradient-to-r from-[#4169E1] to-[#3155c1] hover:from-[#3b5fd4] hover:to-[#2a4cb0] text-white font-semibold shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Coupon
          </Button>
        </div>
      </motion.div>

      {/* Create Coupon Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard variant="default">
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="text-sm font-semibold text-foreground">New Coupon</h3>
                </div>

                <Separator />

                {/* Code row */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Coupon Code</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., SAVE20"
                      value={form.code}
                      onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      className="flex-1 h-10 uppercase font-mono tracking-wider"
                    />
                    <Button
                      variant="outline"
                      onClick={handleGenerateCode}
                      className="h-10 px-3 border-dashed"
                    >
                      <Percent className="w-4 h-4 mr-1" />
                      Auto
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Uppercase letters and numbers only</p>
                </div>

                {/* Discount row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Discount Type</Label>
                    <Select
                      value={form.discountType}
                      onValueChange={(val) => setForm((prev) => ({ ...prev, discountType: val as 'percentage' | 'flat' }))}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">
                          <span className="flex items-center gap-2">
                            <Percent className="w-3.5 h-3.5" /> Percentage (%)
                          </span>
                        </SelectItem>
                        <SelectItem value="flat">
                          <span className="flex items-center gap-2">
                            <IndianRupee className="w-3.5 h-3.5" /> Flat Amount (₹)
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Discount Value {form.discountType === 'percentage' ? '(%)' : '(₹)'}
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={form.discountType === 'percentage' ? 100 : undefined}
                      value={form.discountValue || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, discountValue: Number(e.target.value) }))}
                      className="h-10"
                      placeholder={form.discountType === 'percentage' ? 'e.g., 20' : 'e.g., 100'}
                    />
                  </div>
                </div>

                {/* Min purchase + Expiry row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Minimum Purchase (₹) <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.minimumPurchase || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, minimumPurchase: Number(e.target.value) }))}
                      className="h-10"
                      placeholder="e.g., 500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Expiry Date</Label>
                    <Input
                      type="date"
                      value={form.expiryDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Max usage + Status row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Max Usage Limit</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.maxUsage || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, maxUsage: Number(e.target.value) }))}
                      className="h-10"
                      placeholder="e.g., 100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="flex items-center gap-3 h-10">
                      <Switch
                        checked={form.isActive}
                        onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
                        className="data-[state=checked]:bg-[#22c55e] data-[state=unchecked]:bg-gray-300"
                      />
                      <span className="text-sm font-medium">{form.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    placeholder="e.g., Diwali Special Offer"
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="h-10"
                  />
                </div>

                {/* Preview */}
                {form.code && form.discountValue > 0 && (
                  <div className="rounded-lg p-3 bg-gradient-to-r from-[#4169E1]/5 to-[#D4AF37]/5 border border-[#4169E1]/10">
                    <p className="text-xs text-muted-foreground mb-1">Preview</p>
                    <p className="text-sm font-semibold text-foreground">
                      Code: <code className="px-2 py-0.5 rounded bg-[#4169E1]/10 text-[#4169E1] font-mono">{form.code}</code>
                      {' → '}
                      {form.discountType === 'percentage'
                        ? `${form.discountValue}% off`
                        : `₹${form.discountValue} off`}
                      {form.minimumPurchase > 0 && ` (min ₹${form.minimumPurchase})`}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateCoupon}
                    disabled={saving || !form.code.trim() || form.discountValue <= 0 || !form.expiryDate}
                    className="bg-gradient-to-r from-[#D4AF37] to-[#B8941F] hover:from-[#C9A533] hover:to-[#A88518] text-white font-semibold shadow-md"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                    Create Coupon
                  </Button>
                  <Button variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search coupons by code or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 bg-white border-gray-200"
        />
      </div>

      {/* Coupons Table */}
      <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
        <GlassCard variant="default">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">All Coupons</h3>
              <Badge variant="secondary" className="text-xs">
                {coupons.length} {coupons.length === 1 ? 'coupon' : 'coupons'}
              </Badge>
            </div>

            {filteredCoupons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Ticket className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  {coupons.length === 0 ? 'No coupons created yet' : 'No matching coupons'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {coupons.length === 0 ? 'Click "Create Coupon" to add your first one.' : 'Try a different search term.'}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead className="hidden sm:table-cell">Expiry</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {filteredCoupons.map((coupon) => {
                        const expired = isExpired(coupon.expiryDate)
                        return (
                          <motion.tr
                            key={coupon.id}
                            variants={rowVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            layout
                            className="border-b transition-colors hover:bg-muted/50 group"
                          >
                            {/* Code */}
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <code className="px-2 py-1 rounded-md bg-[#4169E1]/10 text-[#4169E1] text-xs font-mono font-semibold">
                                  {coupon.code}
                                </code>
                                <button
                                  onClick={() => handleCopyCode(coupon.code)}
                                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                                  title="Copy code"
                                >
                                  <Copy className="w-3 h-3 text-gray-400" />
                                </button>
                              </div>
                              {coupon.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{coupon.description}</p>
                              )}
                            </TableCell>

                            {/* Discount */}
                            <TableCell>
                              <span className="text-sm font-semibold text-foreground">
                                {coupon.discountType === 'percentage'
                                  ? `${coupon.discountValue}%`
                                  : `₹${coupon.discountValue}`}
                              </span>
                              {coupon.minimumPurchase > 0 && (
                                <p className="text-[10px] text-muted-foreground">min ₹{coupon.minimumPurchase}</p>
                              )}
                            </TableCell>

                            {/* Expiry */}
                            <TableCell className="hidden sm:table-cell">
                              <span className={`text-xs ${expired ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                                {expired ? 'Expired' : new Date(coupon.expiryDate).toLocaleDateString('en-IN', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                })}
                              </span>
                            </TableCell>

                            {/* Uses */}
                            <TableCell>
                              <span className="text-xs text-foreground font-medium">
                                {coupon.currentUsage}/{coupon.maxUsage}
                              </span>
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#4169E1] to-[#D4AF37] rounded-full transition-all"
                                  style={{ width: `${Math.min(100, (coupon.currentUsage / coupon.maxUsage) * 100)}%` }}
                                />
                              </div>
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              <button
                                onClick={() => toggleCouponStatus(coupon.id)}
                                className="flex items-center gap-1.5"
                              >
                                {coupon.isActive && !expired ? (
                                  <ToggleRight className="w-5 h-5 text-green-500" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5 text-gray-400" />
                                )}
                                <span className={`text-xs font-medium ${coupon.isActive && !expired ? 'text-green-600' : 'text-gray-400'}`}>
                                  {expired ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </button>
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEdit(coupon)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-[#4169E1] hover:bg-[#4169E1]/10"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteDialogId(coupon.id)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* ─── Edit Coupon Dialog ──────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-[#4169E1]" />
              Edit Coupon
            </DialogTitle>
            <DialogDescription>
              Update the coupon details. Code: <code className="font-mono text-[#4169E1]">{editingCoupon?.code}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Coupon Code</Label>
              <Input
                value={editForm.code}
                onChange={(e) => setEditForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="h-9 uppercase font-mono tracking-wider"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Discount Type</Label>
                <Select
                  value={editForm.discountType}
                  onValueChange={(val) => setEditForm((prev) => ({ ...prev, discountType: val as 'percentage' | 'flat' }))}
                >
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Value</Label>
                <Input
                  type="number"
                  min={1}
                  value={editForm.discountValue || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, discountValue: Number(e.target.value) }))}
                  className="h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Min Purchase (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editForm.minimumPurchase || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, minimumPurchase: Number(e.target.value) }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Expiry Date</Label>
                <Input
                  type="date"
                  value={editForm.expiryDate}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                  className="h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Max Usage</Label>
                <Input
                  type="number"
                  min={1}
                  value={editForm.maxUsage || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, maxUsage: Number(e.target.value) }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Active</Label>
                <div className="flex items-center gap-2 h-9">
                  <Switch
                    checked={editForm.isActive}
                    onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, isActive: checked }))}
                    className="data-[state=checked]:bg-[#22c55e]"
                  />
                  <span className="text-xs font-medium">{editForm.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Description</Label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                className="h-9"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={savingEdit}>
              <X className="w-4 h-4 mr-1.5" />Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={savingEdit || !editForm.code.trim() || editForm.discountValue <= 0}
              className="bg-gradient-to-r from-[#4169E1] to-[#3155c1] text-white"
            >
              {savingEdit ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Check className="w-4 h-4 mr-1.5" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ──────────────────────────────────────────── */}
      <AlertDialog open={!!deleteDialogId} onOpenChange={(open) => { if (!open) setDeleteDialogId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this coupon? This action cannot be undone.
              {deleteDialogId && (
                <span className="block mt-2 font-medium text-foreground">
                  Code: {coupons.find((c) => c.id === deleteDialogId)?.code}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
