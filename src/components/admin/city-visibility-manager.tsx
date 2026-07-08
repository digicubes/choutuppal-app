'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MapPin,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { GlassCard } from '@/components/glass-card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CityConfig {
  id: number
  name: string
  slug: string
  showOnHome: boolean
  priority: number
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'manaCitiesConfig'

const DEFAULT_CITIES: CityConfig[] = [
  { id: 1, name: 'Choutuppal', slug: 'choutuppal', showOnHome: true, priority: 1 },
  { id: 2, name: 'Hyderabad', slug: 'hyderabad', showOnHome: true, priority: 2 },
  { id: 3, name: 'Yadadri', slug: 'yadadri', showOnHome: true, priority: 3 },
]

// ─── Helper: generate URL slug from city name ─────────────────────────────────
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
function loadCities(): CityConfig[] {
  if (typeof window === 'undefined') return DEFAULT_CITIES
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // First-time: seed defaults
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CITIES))
      return DEFAULT_CITIES
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : DEFAULT_CITIES
  } catch {
    return DEFAULT_CITIES
  }
}

function saveCities(cities: CityConfig[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cities))
  // Dispatch a custom event so other components can react immediately
  window.dispatchEvent(new CustomEvent('manaCitiesConfigChanged'))
}

function getNextId(cities: CityConfig[]): number {
  if (cities.length === 0) return 1
  return Math.max(...cities.map((c) => c.id)) + 1
}

// ─── Component ────────────────────────────────────────────────────────────────
export function CityVisibilityManager() {
  const [cities, setCities] = useState<CityConfig[]>(DEFAULT_CITIES)

  useEffect(() => {
    setCities(loadCities())
  }, [])

  // Add form state
  const [newCityName, setNewCityName] = useState('')

  const [manualSlug, setManualSlug] = useState<string | null>(null)
  const newSlug = manualSlug !== null ? manualSlug : generateSlug(newCityName)

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCity, setEditingCity] = useState<CityConfig | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editShowOnHome, setEditShowOnHome] = useState(true)
  const [editPriority, setEditPriority] = useState(1)
  const [savingEdit, setSavingEdit] = useState(false)

  // Delete dialog state
  const [deleteDialogId, setDeleteDialogId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ─── Persist whenever cities change ────────────────────────────────────
  const updateCities = useCallback((updated: CityConfig[]) => {
    setCities(updated)
    saveCities(updated)
  }, [])

  // ─── Handlers ──────────────────────────────────────────────────────────
  const handleCityNameChange = (value: string) => {
    setNewCityName(value)
    setManualSlug(null) // Reset to auto-generation mode
  }

  const handleAddCity = () => {
    const trimmedName = newCityName.trim()
    const trimmedSlug = newSlug.trim().toLowerCase()

    if (!trimmedName) {
      toast.error('City name is required')
      return
    }
    if (!trimmedSlug) {
      toast.error('URL slug is required')
      return
    }
    if (cities.some((c) => c.slug === trimmedSlug)) {
      toast.error('A city with this slug already exists')
      return
    }

    const newCity: CityConfig = {
      id: getNextId(cities),
      name: trimmedName,
      slug: trimmedSlug,
      showOnHome: true,
      priority: cities.length + 1,
    }

    updateCities([...cities, newCity])
    setNewCityName('')
    setManualSlug(null)
    toast.success('City added', {
      description: `${trimmedName} has been added and is visible on the Home Page.`,
    })
  }

  const handleToggleVisibility = (id: number) => {
    const updated = cities.map((c) =>
      c.id === id ? { ...c, showOnHome: !c.showOnHome } : c
    )
    updateCities(updated)
    const city = updated.find((c) => c.id === id)
    toast.success(city?.showOnHome ? 'City is now visible on Home Page' : 'City hidden from Home Page', {
      description: city?.name,
    })
  }

  const handleMovePriority = (id: number, direction: 'up' | 'down') => {
    const sorted = [...cities].sort((a, b) => a.priority - b.priority)
    const idx = sorted.findIndex((c) => c.id === id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === sorted.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const tempPriority = sorted[idx].priority
    sorted[idx] = { ...sorted[idx], priority: sorted[swapIdx].priority }
    sorted[swapIdx] = { ...sorted[swapIdx], priority: tempPriority }

    updateCities(sorted)
  }

  const openEditDialog = (city: CityConfig) => {
    setEditingCity(city)
    setEditName(city.name)
    setEditSlug(city.slug)
    setEditShowOnHome(city.showOnHome)
    setEditPriority(city.priority)
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingCity) return
    const trimmedName = editName.trim()
    const trimmedSlug = editSlug.trim().toLowerCase()

    if (!trimmedName) {
      toast.error('City name is required')
      return
    }
    if (!trimmedSlug) {
      toast.error('URL slug is required')
      return
    }
    if (cities.some((c) => c.slug === trimmedSlug && c.id !== editingCity.id)) {
      toast.error('A city with this slug already exists')
      return
    }

    setSavingEdit(true)
    await new Promise((r) => setTimeout(r, 200))

    const updated = cities.map((c) =>
      c.id === editingCity.id
        ? { ...c, name: trimmedName, slug: trimmedSlug, showOnHome: editShowOnHome, priority: editPriority }
        : c
    )
    updateCities(updated)
    setSavingEdit(false)
    setEditDialogOpen(false)
    toast.success('City updated', { description: trimmedName })
  }

  const handleConfirmDelete = async () => {
    if (deleteDialogId === null) return
    setDeleting(true)
    await new Promise((r) => setTimeout(r, 200))
    const updated = cities.filter((c) => c.id !== deleteDialogId)
    updateCities(updated)
    setDeleting(false)
    setDeleteDialogId(null)
    toast.success('City deleted')
  }

  // Sort by priority for display
  const sortedCities = [...cities].sort((a, b) => a.priority - b.priority)
  const visibleCount = cities.filter((c) => c.showOnHome).length

  return (
    <div className="space-y-6">
      {/* ─── Add City Card ──────────────────────────────────────────────── */}
      <GlassCard variant="default">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#4169E1]/10">
              <Plus className="w-5 h-5 text-[#4169E1]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Add New City</h2>
              <p className="text-sm text-muted-foreground">Add a city to the visibility manager</p>
            </div>
          </div>

          <Separator />

          {/* Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-city-name" className="text-xs font-medium text-muted-foreground">
                City Name
              </Label>
              <Input
                id="new-city-name"
                placeholder="e.g., Hyderabad"
                value={newCityName}
                onChange={(e) => handleCityNameChange(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-city-slug" className="text-xs font-medium text-muted-foreground">
                URL Slug
              </Label>
              <Input
                id="new-city-slug"
                placeholder="e.g., hyderabad"
                value={newSlug}
                onChange={(e) => setManualSlug(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {newSlug && (
            <p className="text-xs text-muted-foreground">
              Preview:{' '}
              <code className="px-1.5 py-0.5 rounded bg-[#4169E1]/10 text-[#4169E1] font-mono">
                /city/{newSlug}
              </code>
            </p>
          )}

          <Button
            onClick={handleAddCity}
            disabled={!newCityName.trim() || !newSlug.trim()}
            className="w-full sm:w-auto bg-gradient-to-r from-[#4169E1] to-[#3155c1] hover:from-[#3b5fd4] hover:to-[#2a4cb0] text-white font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Add City
          </Button>
        </div>
      </GlassCard>

      {/* ─── Cities Table Card ──────────────────────────────────────────── */}
      <GlassCard variant="default">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#D4AF37]/10">
                <MapPin className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Cities List</h2>
                <p className="text-sm text-muted-foreground">Control which cities appear on the Home Page</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {visibleCount}/{cities.length} visible
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Table */}
          {cities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <MapPin className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">No cities configured yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Add your first city above.</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-10 text-center">
                      <GripVertical className="w-4 h-4 mx-auto text-muted-foreground" />
                    </TableHead>
                    <TableHead>City Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className="text-center">Show on Home</TableHead>
                    <TableHead className="text-center">Priority</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCities.map((city) => (
                    <TableRow key={city.id} className="group transition-colors hover:bg-muted/50">
                      {/* Order handles */}
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            onClick={() => handleMovePriority(city.id, 'up')}
                            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMovePriority(city.id, 'down')}
                            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>

                      {/* Name */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          {city.name}
                        </div>
                      </TableCell>

                      {/* Slug */}
                      <TableCell>
                        <code className="px-2 py-1 rounded-md bg-[#4169E1]/10 text-[#4169E1] text-xs font-mono font-semibold">
                          {city.slug}
                        </code>
                      </TableCell>

                      {/* Visibility toggle */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={city.showOnHome}
                            onCheckedChange={() => handleToggleVisibility(city.id)}
                            className="data-[state=checked]:bg-[#22c55e] data-[state=unchecked]:bg-gray-300"
                          />
                          {city.showOnHome ? (
                            <Eye className="w-4 h-4 text-green-500" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </TableCell>

                      {/* Priority */}
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono text-xs">
                          #{city.priority}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(city)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-[#4169E1] hover:bg-[#4169E1]/10"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialogId(city.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Info banner */}
          <div className="rounded-lg p-3 bg-[#4169E1]/5 border border-[#4169E1]/10 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#4169E1] shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-[#4169E1]">How it works:</strong> Toggle the{' '}
              <Eye className="w-3 h-3 inline" /> / <EyeOff className="w-3 h-3 inline" /> switch to
              control which cities appear on the Home Page city selector. Use the{' '}
              <ArrowUp className="w-3 h-3 inline" /> / <ArrowDown className="w-3 h-3 inline" /> arrows
              to set display order. Cities with lower priority numbers appear first.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* ─── Edit Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-[#4169E1]" />
              Edit City
            </DialogTitle>
            <DialogDescription>
              Update the city name, slug, visibility, and priority.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-city-name" className="text-sm font-medium">City Name</Label>
              <Input
                id="edit-city-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g., Hyderabad"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-city-slug" className="text-sm font-medium">URL Slug</Label>
              <Input
                id="edit-city-slug"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value.toLowerCase())}
                placeholder="e.g., hyderabad"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Show on Home Page</Label>
              <Switch
                checked={editShowOnHome}
                onCheckedChange={setEditShowOnHome}
                className="data-[state=checked]:bg-[#22c55e] data-[state=unchecked]:bg-gray-300"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-city-priority" className="text-sm font-medium">Priority (lower = shown first)</Label>
              <Input
                id="edit-city-priority"
                type="number"
                min={1}
                value={editPriority}
                onChange={(e) => setEditPriority(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={savingEdit}
            >
              <X className="w-4 h-4 mr-1.5" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={savingEdit || !editName.trim() || !editSlug.trim()}
              className="bg-gradient-to-r from-[#4169E1] to-[#3155c1] hover:from-[#3b5fd4] hover:to-[#2a4cb0] text-white"
            >
              {savingEdit ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Check className="w-4 h-4 mr-1.5" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ───────────────────────────────────── */}
      <AlertDialog
        open={deleteDialogId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteDialogId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete City</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <strong className="text-foreground">
                {cities.find((c) => c.id === deleteDialogId)?.name}
              </strong>{' '}
              from the city list? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1.5" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
