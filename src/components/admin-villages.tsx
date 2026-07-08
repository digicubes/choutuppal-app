'use client'

import React, { useState, useEffect } from 'react'
import { getAdminVillages, createAdminVillage, updateAdminVillage, deleteAdminVillage } from '@/app/actions/admin-actions'
import { Plus, Edit2, Trash2, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function AdminVillages() {
  const [villages, setVillages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [name, setName] = useState('')
  const [pincode, setPincode] = useState('')

  useEffect(() => {
    fetchVillages()
  }, [])

  const fetchVillages = async () => {
    try {
      const data = await getAdminVillages()
      setVillages(data)
    } catch (e: any) {
      toast.error('Failed to load villages')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenForm = (village?: any) => {
    if (village) {
      setEditingId(village.id)
      setName(village.name)
      setPincode(village.pincode)
    } else {
      setEditingId(null)
      setName('')
      setPincode('508252')
    }
    setIsFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !pincode.trim()) return toast.error('Name and pincode are required')
    
    setSaving(true)
    try {
      const payload = { name, pincode }
      if (editingId) {
        await updateAdminVillage(editingId, payload)
        toast.success('Village updated')
      } else {
        await createAdminVillage(payload)
        toast.success('Village created')
      }
      setIsFormOpen(false)
      fetchVillages()
    } catch (error: any) {
      toast.error('Error saving village')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this village?')) return
    try {
      await deleteAdminVillage(id)
      toast.success('Village deleted')
      fetchVillages()
    } catch (error: any) {
      toast.error('Error deleting village')
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Villages / Areas</h2>
          <p className="text-gray-500 text-sm mt-1">Manage local areas and villages</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Village
        </Button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Village' : 'New Village'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg p-2.5 outline-none focus:border-blue-600" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pincode</label>
              <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} className="w-full border rounded-lg p-2.5 outline-none focus:border-blue-600" required />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-blue-600 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Village
            </Button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Pincode</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">City</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {villages.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">No villages found.</td></tr>
              )}
              {villages.map(village => (
                <tr key={village.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{village.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{village.pincode}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{village.city?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button type="button" onClick={() => handleOpenForm(village)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                    <button type="button" onClick={() => handleDelete(village.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
