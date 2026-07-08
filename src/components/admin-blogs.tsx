'use client'

import { useState, useEffect } from 'react'
import { getAdminBlogs, deleteAdminBlog, createAdminBlog, updateAdminBlog } from '@/app/actions/admin-actions'
import { Loader2, Trash2, Edit, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'

export default function AdminBlogs() {
  const { user } = useAuth()
  const [blogs, setBlogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isEditing, setIsEditing] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [savingBlog, setSavingBlog] = useState(false)

  // Blog Form State
  const [title, setTitle] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [authorName, setAuthorName] = useState('Choutuppal App Team')
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Write your blog content here...' })
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
      const blogData = await getAdminBlogs()
      setBlogs(blogData)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return
    try {
      await deleteAdminBlog(id)
      fetchData()
    } catch (error) {
      alert('Error deleting blog')
    }
  }

  const handleEditClick = (item: any) => {
    setIsEditing(item)
    setTitle(item.title || '')
    setCoverImageUrl(item.coverImageUrl || '')
    setAuthorName(item.authorName || 'Choutuppal App Team')
    editor?.commands.setContent(item.content || '')
  }

  const resetForm = () => {
    setIsCreating(false)
    setIsEditing(null)
    setTitle('')
    setCoverImageUrl('')
    setAuthorName('Choutuppal App Team')
    editor?.commands.setContent('')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSavingBlog(true)
    try {
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      }
      const compressedFile = await imageCompression(file, options)

      const fileName = `blogs/${Date.now()}-${compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
      const { error } = await supabase.storage.from('listing-images').upload(fileName, compressedFile)
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(fileName)
      setCoverImageUrl(publicUrl)
    } catch (error) {
      console.error('Blog upload error:', error)
      alert('Image upload failed')
    } finally {
      setSavingBlog(false)
    }
  }

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingBlog(true)
    try {
      const content = editor?.getHTML() || ''
      const cityId = blogs[0]?.cityId || null // fallback removed user?.id

      const payload = {
        title,
        content,
        coverImageUrl,
        authorName,
        cityId: isEditing ? isEditing.cityId : cityId,
        authorId: user?.id,
        isPublished: true,
      }

      if (isEditing) {
        await updateAdminBlog(isEditing.id, payload)
      } else {
        await createAdminBlog(payload)
      }

      resetForm()
      fetchData()
    } catch (error) {
      console.error(error)
      alert('Failed to save blog post')
    } finally {
      setSavingBlog(false)
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
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Local Blog Posts</h2>
        <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Add Blog
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {blogs.map(post => (
          <div key={post.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col md:flex-row">
            {post.coverImageUrl && (
              <div className="w-full md:w-1/3 aspect-video md:aspect-auto bg-gray-100">
                <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 line-clamp-2 mb-2">{post.title}</h3>
                <div 
                  className="text-sm text-gray-600 line-clamp-2 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: post.content || '' }}
                />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-400">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg"
                    onClick={() => handleEditClick(post)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg"
                    onClick={() => handleDelete(post.id)}
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
              <h2 className="text-xl font-bold">{isEditing ? 'Edit Blog Post' : 'Write Blog Post'}</h2>
              <button onClick={resetForm} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            
            <form onSubmit={handleSaveBlog} className="p-6 space-y-6 flex-1 flex flex-col">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Blog Title</label>
                <Input 
                  required 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="rounded-xl bg-gray-50 border-gray-200"
                  placeholder="e.g. Best Places to Visit in Choutuppal"
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
                  <label className="text-sm font-semibold text-gray-700">Cover Image</label>
                  <div className="flex items-center gap-4">
                    {coverImageUrl && <img src={coverImageUrl} alt="Cover" className="w-16 h-12 rounded-lg object-cover border border-gray-200" />}
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      disabled={savingBlog}
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
                <Button type="submit" disabled={savingBlog} className="flex-1 rounded-xl h-12 bg-blue-600 hover:bg-blue-700 text-white">
                  {savingBlog ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (isEditing ? 'Update Post' : 'Publish Post')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
