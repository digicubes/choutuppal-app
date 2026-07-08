'use client'

import { useState, useEffect } from 'react'
import { getAdminStories, deleteAdminStory } from '@/app/actions/admin-actions'
import { Loader2, Trash2, Clock, PlayCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function AdminStories() {
  const [stories, setStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStories()
  }, [])

  async function fetchStories() {
    setLoading(true)
    try {
      const data = await getAdminStories()
      setStories(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story? This action cannot be undone.')) return
    try {
      await deleteAdminStory(id)
      fetchStories()
    } catch (error) {
      alert('Error deleting story')
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const remaining = new Date(expiresAt).getTime() - new Date().getTime()
    if (remaining <= 0) return 'Expired'
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m left`
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
        <h2 className="text-xl font-bold text-gray-800">Stories Moderation</h2>
        <Badge variant="secondary" className="px-3 py-1 text-sm">{stories.length} Active</Badge>
      </div>

      {stories.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500">
          No active stories found.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {stories.map(story => (
            <div key={story.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col relative group">
              <div className="aspect-[9/16] bg-black relative">
                {story.mediaType === 'VIDEO' ? (
                  <>
                    <video src={story.mediaUrl} className="w-full h-full object-cover opacity-80" />
                    <PlayCircle className="absolute inset-0 m-auto text-white w-8 h-8 opacity-70" />
                  </>
                ) : (
                  <img src={story.mediaUrl} alt="Story" className="w-full h-full object-cover" />
                )}
                
                <div className="absolute top-2 right-2 left-2 flex justify-between items-center z-10">
                  <Badge variant="secondary" className="bg-black/50 text-white border-none text-xs flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {getTimeRemaining(story.expiresAt)}
                  </Badge>
                </div>
              </div>
              
              <div className="p-3 bg-white flex flex-col gap-2">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">User ID</span>
                  <span className="text-sm font-semibold truncate" title={story.userId}>{story.userId}</span>
                </div>
                {story.title && (
                  <p className="text-sm text-gray-700 truncate">{story.title}</p>
                )}
                <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-400">{story.viewsCount} views</span>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-full"
                    onClick={() => handleDelete(story.id)}
                    title="Delete Story"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
