'use client'

import { useState, useEffect } from 'react'
import { getAdminNews, deleteAdminNews, createAdminNews, updateAdminNews } from '@/app/actions/admin-actions'
import { Loader2, Trash2, Edit, Save, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'

export default function AdminNews() {
  const { user } = useAuth()
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isEditing, setIsEditing] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [savingNews, setSavingNews] = useState(false)

  // News Form State
  const [title, setTitle] = useState('')
  const [source, setSource] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [authorName, setAuthorName] = useState('Choutuppal App Team')
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Write your news content here...' })
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[150px] p-4 bg-gray-50 rounded-b-xl border-x border-b border-gray-200',
      },
    },
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const newsData = await getAdminNews()
      setNews(newsData)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this news article?')) return
    try {
      await deleteAdminNews(id)
      fetchData()
    } catch (error) {
      alert('Error deleting news')
    }
  }

  const handleEditClick = (item: any) => {
    setIsEditing(item)
    setTitle(item.title || '')
    setSource(item.source || '')
    setImageUrl(item.imageUrl || '')
    setAuthorName(item.authorName || 'Choutuppal App Team')
    editor?.commands.setContent(item.content || '')
  }

  const resetForm = () => {
    setIsCreating(false)
    setIsEditing(null)
    setTitle('')
    setSource('')
    setImageUrl('')
    setAuthorName('Choutuppal App Team')
    editor?.commands.setContent('')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSavingNews(true)
    try {
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      }
      const compressedFile = await imageCompression(file, options)

      const fileName = `news/${Date.now()}-${compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
      const { error } = await supabase.storage.from('listing-images').upload(fileName, compressedFile)
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(fileName)
      setImageUrl(publicUrl)
    } catch (error) {
      console.error('News upload error:', error)
      alert('Image upload failed')
    } finally {
      setSavingNews(false)
    }
  }

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingNews(true)
    try {
      const content = editor?.getHTML() || ''
      const cityId = news[0]?.cityId || user?.id // fallback

      const payload = {
        title,
        content,
        source,
        imageUrl,
        authorName,
        cityId: isEditing ? isEditing.cityId : cityId,
        authorId: user?.id,
        isPublished: true,
      }

      if (isEditing) {
        await updateAdminNews(isEditing.id, payload)
      } else {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch('/api/news', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify(payload)
        })
        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || 'Failed to create news')
        }
      }

      resetForm()
      fetchData()
    } catch (error) {
      console.error(error)
      alert('Failed to save news article')
    } finally {
      setSavingNews(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* News Management */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Local News Articles</h2>
        <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Add News
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {news.map(article => (
          <div key={article.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col md:flex-row">
            {article.imageUrl && (
              <div className="w-full md:w-1/3 aspect-video md:aspect-auto bg-gray-100">
                <img loading="lazy" decoding="async" src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 line-clamp-2 mb-2">{article.title}</h3>
                {article.source && (
                  <Badge variant="outline" className="text-xs text-blue-600 bg-blue-50 border-blue-100 mb-2">
                    {article.source}
                  </Badge>
                )}
                <div 
                  className="text-sm text-gray-600 line-clamp-2 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: article.content || '' }}
                />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-400">
                  {new Date(article.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg"
                    onClick={() => handleEditClick(article)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg"
                    onClick={() => handleDelete(article.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {(isCreating || isEditing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold">{isEditing ? 'Edit News Article' : 'Write News Article'}</h2>
              <button onClick={resetForm} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            
            <form onSubmit={handleSaveNews} className="p-6 space-y-6 flex-1 flex flex-col">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Article Title</label>
                <Input 
                  required 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="rounded-xl bg-gray-50 border-gray-200"
                  placeholder="e.g. New Highway Project Announced"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Author Name</label>
                  <Input 
                    value={authorName} 
                    onChange={e => setAuthorName(e.target.value)} 
                    className="rounded-xl bg-gray-50 border-gray-200"
                    placeholder="e.g. Choutuppal App Team"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Source (Optional)</label>
                  <Input 
                    value={source} 
                    onChange={e => setSource(e.target.value)} 
                    className="rounded-xl bg-gray-50 border-gray-200"
                    placeholder="e.g. Local News Daily"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Cover Image</label>
                  <div className="flex items-center gap-4">
                    {imageUrl && <img loading="lazy" decoding="async" src={imageUrl} alt="Cover" className="w-16 h-12 rounded-lg object-cover border border-gray-200" />}
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      disabled={savingNews}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
                <label className="text-sm font-semibold text-gray-700">Content</label>
                
                {/* Simple Editor Toolbar */}
                <div className="flex flex-wrap gap-1 p-2 bg-gray-100 rounded-t-xl border-x border-t border-gray-200">
                  <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className={`px-2 py-1 rounded text-sm ${editor?.isActive('bold') ? 'bg-white shadow' : 'hover:bg-gray-200'}`}><b>B</b></button>
                  <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className={`px-2 py-1 rounded text-sm ${editor?.isActive('italic') ? 'bg-white shadow' : 'hover:bg-gray-200'}`}><i>I</i></button>
                  <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 rounded text-sm ${editor?.isActive('heading', { level: 2 }) ? 'bg-white shadow' : 'hover:bg-gray-200'}`}>H2</button>
                  <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={`px-2 py-1 rounded text-sm ${editor?.isActive('heading', { level: 3 }) ? 'bg-white shadow' : 'hover:bg-gray-200'}`}>H3</button>
                  <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`px-2 py-1 rounded text-sm ${editor?.isActive('bulletList') ? 'bg-white shadow' : 'hover:bg-gray-200'}`}>List</button>
                </div>
                
                <EditorContent editor={editor} className="flex-1 overflow-auto" />
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1 rounded-xl h-12">Cancel</Button>
                <Button type="submit" disabled={savingNews} className="flex-1 rounded-xl h-12 bg-blue-600 hover:bg-blue-700 text-white">
                  {savingNews ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (isEditing ? 'Update Article' : 'Publish Article')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
