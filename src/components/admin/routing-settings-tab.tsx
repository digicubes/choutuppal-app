'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Globe, Save, Loader2, AlertTriangle, CheckCircle, Plus, Trash2,
  Edit3, ExternalLink, Link2, Shield, Router, Info, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { GlassCard } from '@/components/glass-card'
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
import { useAppStore } from '@/lib/store'
import { checkSubdomainSupport, resetRoutingConfig } from '@/lib/routing-config'
import { toast } from 'sonner'

// ─── City with subdomain info ────────────────────────────────────
interface CitySubdomain {
  id: string
  name: string
  slug: string
  subdomain: string
  fullDomain: string
  state: string
}

// ─── Main Component ──────────────────────────────────────────────
export function RoutingSettingsTab() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const routingConfig = useAppStore((s) => s.routingConfig)
  const setRoutingConfig = useAppStore((s) => s.setRoutingConfig)
  const availableCities = useAppStore((s) => s.availableCities)
  const themePrimary = useAppStore((s) => s.themePrimary)
  const themeSecondary = useAppStore((s) => s.themeSecondary)
  const primary = themePrimary || '#4169E1'
  const secondary = themeSecondary || '#D4AF37'

  // ─── State ───────────────────────────────────────────────────
  const [baseDomain, setBaseDomain] = useState(routingConfig.baseDomain)
  const [subdomainEnabled, setSubdomainEnabled] = useState(routingConfig.subdomainRoutingEnabled)
  const [saving, setSaving] = useState(false)
  const [envCheck, setEnvCheck] = useState<{ supported: boolean; reason: string }>({ supported: false, reason: 'Checking...' })

  // City management
  const [cities, setCities] = useState<CitySubdomain[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newCityName, setNewCityName] = useState('')
  const [addingCity, setAddingCity] = useState(false)
  const [deleteDialogCity, setDeleteDialogCity] = useState<CitySubdomain | null>(null)
  const [editDialogCity, setEditDialogCity] = useState<CitySubdomain | null>(null)
  const [editSubdomain, setEditSubdomain] = useState('')

  // ─── Effects ────────────────────────────────────────────────
  useEffect(() => {
    setEnvCheck(checkSubdomainSupport())
  }, [])

  useEffect(() => {
    setBaseDomain(routingConfig.baseDomain)
    setSubdomainEnabled(routingConfig.subdomainRoutingEnabled)
  }, [routingConfig])

  useEffect(() => {
    // Map available cities to subdomain info
    const mapped: CitySubdomain[] = availableCities.map((city) => ({
      id: city.id,
      name: city.name,
      slug: city.slug,
      subdomain: city.subdomain || city.slug,
      fullDomain: `${city.subdomain || city.slug}.${routingConfig.baseDomain}`,
      state: city.state,
    }))
    setCities(mapped)
  }, [availableCities, routingConfig.baseDomain])

  // ─── Handlers ───────────────────────────────────────────────
  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      // Validate domain format
      const domain = baseDomain.trim().toLowerCase()
      if (!domain || !/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/.test(domain)) {
        toast.error('Invalid domain format. Use format like: mana.in')
        setSaving(false)
        return
      }

      setRoutingConfig({
        baseDomain: domain,
        subdomainRoutingEnabled: subdomainEnabled,
      })

      toast.success(
        subdomainEnabled
          ? `Custom domain routing activated for *.${domain}`
          : 'Switched to path-based routing',
        { duration: 4000 }
      )
    } catch {
      toast.error('Failed to save routing config')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleSubdomain = (enabled: boolean) => {
    setSubdomainEnabled(enabled)
    if (enabled && !envCheck.supported) {
      toast.warning(
        'Subdomain routing is enabled, but your current environment does not support it. It will take effect when deployed on your custom domain.',
        { duration: 6000 }
      )
    }
  }

  const handleAddCity = async () => {
    if (!newCityName.trim()) {
      toast.error('City name is required')
      return
    }

    setAddingCity(true)
    try {
      const slug = newCityName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const res = await fetch('/api/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCityName.trim(),
          slug,
          subdomain: slug,
          state: 'Telangana',
          brandName: `${newCityName.trim()} App`,
          primaryColor: '#4169E1',
          secondaryColor: '#D4AF37',
          latitude: 17.2985,
          longitude: 78.9256,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add city')
      }

      toast.success(`${newCityName.trim()} added successfully!`)
      setNewCityName('')
      setShowAddDialog(false)

      // Refresh cities list in store
      const citiesRes = await fetch('/api/cities')
      if (citiesRes.ok) {
        const data = await citiesRes.json()
        if (Array.isArray(data)) {
          const storeCities = data.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            name: c.name as string,
            slug: c.slug as string,
            subdomain: (c.subdomain as string) || (c.slug as string),
            state: (c.state as string) || 'Telangana',
            brandName: (c.brandName as string) || `${c.name} App`,
            logoUrl: (c.logoUrl as string) || null,
            heroImageUrl: (c.heroImageUrl as string) || null,
            primaryColor: (c.primaryColor as string) || '#4169E1',
            secondaryColor: (c.secondaryColor as string) || '#D4AF37',
            latitude: (c.latitude as number) || 17.2985,
            longitude: (c.longitude as number) || 78.9256,
          }))
          useAppStore.getState().setAvailableCities(storeCities)
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add city')
    } finally {
      setAddingCity(false)
    }
  }

  const handleDeleteCity = async (city: CitySubdomain) => {
    try {
      const res = await fetch(`/api/cities?id=${city.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete city')
      }
      toast.success(`${city.name} deleted`)
      setDeleteDialogCity(null)

      // Refresh cities
      const citiesRes = await fetch('/api/cities')
      if (citiesRes.ok) {
        const data = await citiesRes.json()
        if (Array.isArray(data)) {
          const storeCities = data.map((c: Record<string, unknown>) => ({
            id: c.id as string, name: c.name as string, slug: c.slug as string,
            subdomain: (c.subdomain as string) || (c.slug as string),
            state: (c.state as string) || 'Telangana',
            brandName: (c.brandName as string) || `${c.name} App`,
            logoUrl: (c.logoUrl as string) || null, heroImageUrl: (c.heroImageUrl as string) || null,
            primaryColor: (c.primaryColor as string) || '#4169E1',
            secondaryColor: (c.secondaryColor as string) || '#D4AF37',
            latitude: (c.latitude as number) || 17.2985, longitude: (c.longitude as number) || 78.9256,
          }))
          useAppStore.getState().setAvailableCities(storeCities)
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete city')
    }
  }

  const handleEditSubdomain = async () => {
    if (!editDialogCity || !editSubdomain.trim()) return

    try {
      const res = await fetch('/api/cities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editDialogCity.id,
          subdomain: editSubdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update subdomain')
      }

      toast.success(`Subdomain updated to ${editSubdomain}.${routingConfig.baseDomain}`)
      setEditDialogCity(null)

      // Refresh cities
      const citiesRes = await fetch('/api/cities')
      if (citiesRes.ok) {
        const data = await citiesRes.json()
        if (Array.isArray(data)) {
          const storeCities = data.map((c: Record<string, unknown>) => ({
            id: c.id as string, name: c.name as string, slug: c.slug as string,
            subdomain: (c.subdomain as string) || (c.slug as string),
            state: (c.state as string) || 'Telangana',
            brandName: (c.brandName as string) || `${c.name} App`,
            logoUrl: (c.logoUrl as string) || null, heroImageUrl: (c.heroImageUrl as string) || null,
            primaryColor: (c.primaryColor as string) || '#4169E1',
            secondaryColor: (c.secondaryColor as string) || '#4169E1',
            latitude: (c.latitude as number) || 17.2985, longitude: (c.longitude as number) || 78.9256,
          }))
          useAppStore.getState().setAvailableCities(storeCities)
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update subdomain')
    }
  }

  const handleResetConfig = () => {
    const defaultConfig = resetRoutingConfig()
    setBaseDomain(defaultConfig.baseDomain)
    setSubdomainEnabled(defaultConfig.subdomainRoutingEnabled)
    setRoutingConfig(defaultConfig)
    toast.success('Routing config reset to defaults')
  }

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: Domain Connection Settings
          ═══════════════════════════════════════════════════════════ */}
      <GlassCard>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
            >
              <Globe className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Domain Connection Settings</h2>
              <p className="text-sm text-gray-500">Configure custom domain and routing mode</p>
            </div>
          </div>

          <Separator />

          {/* Current Routing Mode Badge */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <Router className="size-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Current Routing Mode</p>
              <p className="text-xs text-gray-500">
                {routingConfig.routingMode === 'subdomain'
                  ? 'Subdomain-based: hyderabad.mana.in'
                  : 'Path-based: /city/hyderabad'}
              </p>
            </div>
            <Badge
              className="text-xs px-3 py-1"
              style={{
                backgroundColor: routingConfig.routingMode === 'subdomain' ? '#10B981' : `${primary}20`,
                color: routingConfig.routingMode === 'subdomain' ? 'white' : primary,
              }}
            >
              {routingConfig.routingMode === 'subdomain' ? 'Subdomain' : 'Path-Based'}
            </Badge>
          </div>

          {/* Environment Check */}
          <div
            className={`flex items-start gap-3 p-4 rounded-xl border ${
              envCheck.supported
                ? 'bg-green-50 border-green-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            {envCheck.supported ? (
              <CheckCircle className="size-5 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`text-sm font-medium ${envCheck.supported ? 'text-green-800' : 'text-amber-800'}`}>
                {envCheck.supported ? 'Subdomain Routing Available' : 'Subdomain Routing Not Available'}
              </p>
              <p className={`text-xs ${envCheck.supported ? 'text-green-600' : 'text-amber-600'}`}>
                {envCheck.reason}
              </p>
            </div>
          </div>

          {/* Base Domain Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Base Custom Domain</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  *.
                </span>
                <Input
                  value={baseDomain}
                  onChange={(e) => setBaseDomain(e.target.value)}
                  placeholder="mana.in"
                  className="pl-8 bg-white/50 border-white/40 h-11"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Your custom domain where city subdomains will be hosted. Example: mana.in → hyderabad.mana.in, choutuppal.mana.in
            </p>
          </div>

          {/* Activate Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <Shield className="size-5" style={{ color: subdomainEnabled ? '#10B981' : '#D1D5DB' }} />
              <div>
                <p className="text-sm font-medium text-gray-800">Activate Custom Domain Routing</p>
                <p className="text-xs text-gray-500">
                  When enabled, city selection navigates to subdomain URLs
                </p>
              </div>
            </div>
            <Switch
              checked={subdomainEnabled}
              onCheckedChange={handleToggleSubdomain}
            />
          </div>

          {/* Preview of URLs */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600">URL Preview</Label>
            <div className="space-y-2">
              {cities.slice(0, 3).map((city) => (
                <div key={city.id} className="flex items-center gap-2 text-sm">
                  <Globe className="size-3.5 text-gray-400" />
                  <span className="text-gray-600 w-24">{city.name}:</span>
                  <code
                    className="text-xs px-2 py-1 rounded-md font-mono"
                    style={{
                      backgroundColor: subdomainEnabled ? `${primary}10` : '#F3F4F6',
                      color: subdomainEnabled ? primary : '#6B7280',
                    }}
                  >
                    {subdomainEnabled
                      ? `https://${city.subdomain}.${baseDomain}`
                      : `/city/${city.slug}`}
                  </code>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSaveConfig}
              disabled={saving}
              className="bg-gradient-to-r text-white shadow-lg"
              style={{
                backgroundImage: `linear-gradient(to right, ${primary}, ${secondary})`,
              }}
            >
              {saving ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              Save Configuration
            </Button>
            <Button
              variant="outline"
              onClick={handleResetConfig}
              className="text-gray-500"
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2: Subdomain Management
          ═══════════════════════════════════════════════════════════ */}
      <GlassCard>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${secondary}, ${primary})` }}
              >
                <Link2 className="size-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Manage Cities / Subdomains</h2>
                <p className="text-sm text-gray-500">
                  Add cities and manage their subdomain mappings
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r text-white shadow-sm"
              style={{
                backgroundImage: `linear-gradient(to right, ${primary}, ${secondary})`,
              }}
            >
              <Plus className="size-4 mr-1.5" />
              Add City
            </Button>
          </div>

          <Separator />

          {/* Cities Table */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="text-xs font-semibold">City</TableHead>
                  <TableHead className="text-xs font-semibold">Slug</TableHead>
                  <TableHead className="text-xs font-semibold">Subdomain Prefix</TableHead>
                  <TableHead className="text-xs font-semibold">Full Domain</TableHead>
                  <TableHead className="text-xs font-semibold">Path URL</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                      <Globe className="size-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No cities configured yet</p>
                      <p className="text-xs">Click &quot;Add City&quot; to get started</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  cities.map((city) => (
                    <TableRow key={city.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
                          >
                            {city.name.charAt(0)}
                          </div>
                          <span className="font-medium text-sm text-gray-800">{city.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">{city.slug}</code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: `${primary}10`, color: primary }}>
                          {city.subdomain}
                        </code>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`https://${city.subdomain}.${baseDomain}`}
                          className="text-xs flex items-center gap-1 hover:underline"
                          style={{ color: secondary }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {city.subdomain}.{baseDomain}
                          <ExternalLink className="size-2.5" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-500">/city/{city.slug}</code>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditDialogCity(city)
                              setEditSubdomain(city.subdomain)
                            }}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                          >
                            <Edit3 className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialogCity(city)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* DNS Instructions */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
            <div className="flex items-start gap-3">
              <Info className="size-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">DNS Configuration Required</p>
                <p className="text-xs text-blue-600 mt-1">
                  To enable subdomain routing, add a wildcard DNS record:
                </p>
                <code className="block mt-2 text-xs bg-blue-100/50 text-blue-800 px-3 py-2 rounded-lg font-mono">
                  CNAME * → cname.vercel-dns.com
                </code>
                <p className="text-xs text-blue-500 mt-2">
                  Then add <strong>*.{baseDomain}</strong> as a wildcard domain in your Vercel dashboard.
                  This is only needed when you activate custom domain routing above.
                </p>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3: Smart Routing Logic Info
          ═══════════════════════════════════════════════════════════ */}
      <GlassCard>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
            >
              <Router className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Smart Routing Logic</h2>
              <p className="text-sm text-gray-500">How the app decides which routing mode to use</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Path-Based */}
            <div className={`p-4 rounded-xl border-2 ${routingConfig.routingMode === 'path' ? 'border-green-300 bg-green-50/30' : 'border-gray-100 bg-gray-50/30'}`}>
              <div className="flex items-center gap-2 mb-3">
                {routingConfig.routingMode === 'path' && <CheckCircle className="size-4 text-green-600" />}
                <h3 className="font-semibold text-sm text-gray-800">Path-Based Routing</h3>
              </div>
              <code className="text-xs block bg-white/80 px-3 py-2 rounded-lg mb-3 text-gray-600">
                /city/hyderabad
              </code>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>✅ Works in ALL environments</li>
                <li>✅ No DNS configuration needed</li>
                <li>✅ Preview/sandbox compatible</li>
                <li>✅ Default mode</li>
              </ul>
            </div>

            {/* Subdomain */}
            <div className={`p-4 rounded-xl border-2 ${routingConfig.routingMode === 'subdomain' ? 'border-green-300 bg-green-50/30' : 'border-gray-100 bg-gray-50/30'}`}>
              <div className="flex items-center gap-2 mb-3">
                {routingConfig.routingMode === 'subdomain' && <CheckCircle className="size-4 text-green-600" />}
                <h3 className="font-semibold text-sm text-gray-800">Subdomain Routing</h3>
              </div>
              <code className="text-xs block bg-white/80 px-3 py-2 rounded-lg mb-3 text-gray-600">
                hyderabad.mana.in
              </code>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>⚡ Better SEO (each city = unique domain)</li>
                <li>⚡ Professional branding</li>
                <li>⚡ Clearer city identity</li>
                <li>⚠️ Requires custom domain + DNS setup</li>
              </ul>
            </div>
          </div>

          {/* Decision Tree */}
          <div className="p-4 rounded-xl bg-gray-50/50 border border-gray-100">
            <p className="text-xs font-semibold text-gray-600 mb-2">Decision Flow:</p>
            <div className="space-y-1 text-xs text-gray-500">
              <p>1. User selects a city (e.g., &quot;Hyderabad&quot;)</p>
              <p>2. App checks <code className="bg-gray-100 px-1 rounded">routingConfig.routingMode</code></p>
              <p>3. If <code className="bg-green-50 text-green-700 px-1 rounded">path</code> → Navigate to <code className="bg-gray-100 px-1 rounded">/city/hyderabad</code></p>
              <p>4. If <code className="bg-blue-50 text-blue-700 px-1 rounded">subdomain</code> → Navigate to <code className="bg-gray-100 px-1 rounded">hyderabad.mana.in</code></p>
              <p>5. Environment check overrides: sandbox/localhost always uses path mode</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ═══════════════════════════════════════════════════════════
          ADD CITY DIALOG
          ═══════════════════════════════════════════════════════════ */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5" style={{ color: primary }} />
              Add New City
            </DialogTitle>
            <DialogDescription>
              Add a city to the platform. The subdomain will be auto-generated from the city name.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>City Name</Label>
              <Input
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                placeholder="e.g., Hyderabad"
                className="bg-white/50"
              />
            </div>

            {newCityName.trim() && (
              <div className="p-3 rounded-lg bg-gray-50 space-y-2">
                <p className="text-xs text-gray-500">Auto-generated mapping:</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Slug:</span>
                  <code className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                    {newCityName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}
                  </code>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Subdomain:</span>
                  <code className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${primary}10`, color: primary }}>
                    {newCityName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.{baseDomain}
                  </code>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Path:</span>
                  <code className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                    /city/{newCityName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}
                  </code>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCity}
              disabled={addingCity || !newCityName.trim()}
              style={{ background: `linear-gradient(to right, ${primary}, ${secondary})` }}
              className="text-white"
            >
              {addingCity ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Plus className="size-4 mr-2" />}
              Add City
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════
          DELETE CITY DIALOG
          ═══════════════════════════════════════════════════════════ */}
      <Dialog open={!!deleteDialogCity} onOpenChange={() => setDeleteDialogCity(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="size-5" />
              Delete City
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteDialogCity?.name}</strong>?
              This will remove all associated data including listings, news, and users.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogCity(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialogCity && handleDeleteCity(deleteDialogCity)}
            >
              <Trash2 className="size-4 mr-2" />
              Delete {deleteDialogCity?.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════
          EDIT SUBDOMAIN DIALOG
          ═══════════════════════════════════════════════════════════ */}
      <Dialog open={!!editDialogCity} onOpenChange={() => setEditDialogCity(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="size-5" style={{ color: primary }} />
              Edit Subdomain — {editDialogCity?.name}
            </DialogTitle>
            <DialogDescription>
              Change the subdomain prefix for {editDialogCity?.name}.
              This will change the URL from <code>{editDialogCity?.subdomain}.{baseDomain}</code> to the new subdomain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Subdomain Prefix</Label>
              <div className="flex items-center gap-1">
                <Input
                  value={editSubdomain}
                  onChange={(e) => setEditSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="hyderabad"
                  className="bg-white/50 flex-1"
                />
                <span className="text-gray-400 text-sm whitespace-nowrap">.{baseDomain}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 space-y-1">
              <p className="text-xs text-gray-500">Updated URLs:</p>
              <code className="text-xs block px-2 py-1 bg-white rounded" style={{ color: primary }}>
                https://{editSubdomain || '...'}.{baseDomain}
              </code>
              <code className="text-xs block px-2 py-1 bg-white rounded text-gray-500">
                /city/{editDialogCity?.slug}
              </code>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogCity(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSubdomain}
              style={{ background: `linear-gradient(to right, ${primary}, ${secondary})` }}
              className="text-white"
            >
              <Save className="size-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
