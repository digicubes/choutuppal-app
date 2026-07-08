'use client'

import React, { useState, useEffect } from 'react'
import { getAdminCategories, createAdminCategory, updateAdminCategory, deleteAdminCategory } from '@/app/actions/admin-actions'
import { Plus, Edit2, Trash2, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await getAdminCategories()
      setCategories(data)
    } catch (e: any) {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenForm = (category?: any) => {
    if (category) {
      setEditingId(category.id)
      setName(category.name)
      setParentId(category.parentId || null)
      setIsActive(category.isActive)
    } else {
      setEditingId(null)
      setName('')
      setParentId(null)
      setIsActive(true)
    }
    setIsFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Category name is required')
    
    setSaving(true)
    try {
      const payload = { name, parentId, isActive }
      if (editingId) {
        await updateAdminCategory(editingId, payload)
        toast.success('Category updated')
      } else {
        await createAdminCategory(payload)
        toast.success('Category created')
      }
      setIsFormOpen(false)
      fetchCategories()
    } catch (error: any) {
      toast.error('Error saving category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      await deleteAdminCategory(id)
      toast.success('Category deleted')
      fetchCategories()
    } catch (error: any) {
      toast.error('Error deleting category')
    }
  }

  // Organize into main categories and subcategories
  const mainCategories = categories.filter(c => !c.parentId)
  const getSubcategories = (parentId: string) => categories.filter(c => c.parentId === parentId)

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
          <p className="text-gray-500 text-sm mt-1">Manage main and sub-categories</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Category' : 'New Category'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg p-2.5 outline-none focus:border-blue-600" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Parent Category (Optional)</label>
              <Select value={parentId || 'none'} onValueChange={v => setParentId(v === 'none' ? null : v)}>
                <SelectTrigger className="w-full border rounded-lg p-2.5 h-auto">
                  <SelectValue placeholder="None (Main Category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Main Category)</SelectItem>
                  {mainCategories.filter(c => c.id !== editingId).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-blue-600 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Category
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
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Slug</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Type</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mainCategories.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">No categories found.</td></tr>
              )}
              {mainCategories.map(mainCat => (
                <React.Fragment key={mainCat.id}>
                  {/* Main Category Row */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{mainCat.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{mainCat.slug}</td>
                    <td className="px-6 py-4"><Badge className="bg-blue-100 text-blue-700">Main</Badge></td>
                    <td className="px-6 py-4">
                      <Badge className={mainCat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {mainCat.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                      <button type="button" onClick={() => handleOpenForm(mainCat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button type="button" onClick={() => handleDelete(mainCat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                  {/* Subcategories */}
                  {getSubcategories(mainCat.id).map(subCat => (
                    <tr key={subCat.id} className="hover:bg-gray-50 bg-gray-50/50">
                      <td className="px-6 py-4 text-gray-700 pl-12 flex items-center gap-2">
                        <div className="w-3 h-px bg-gray-300"></div> {subCat.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{subCat.slug}</td>
                      <td className="px-6 py-4"><Badge className="bg-purple-100 text-purple-700 border-none">Sub</Badge></td>
                      <td className="px-6 py-4">
                        <Badge className={subCat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {subCat.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                        <button type="button" onClick={() => handleOpenForm(subCat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button type="button" onClick={() => handleDelete(subCat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
