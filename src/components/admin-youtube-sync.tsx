'use client'

import { useState, useEffect } from 'react'
import { Youtube, Trash2, Plus, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export default function AdminYoutubeSync() {
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  
  const [newChannelId, setNewChannelId] = useState('')
  const [newChannelName, setNewChannelName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [isAddingVideo, setIsAddingVideo] = useState(false)
  
  // Track which channel is syncing right now
  const [syncingChannelId, setSyncingChannelId] = useState<string | null>(null)

  useEffect(() => {
    fetchChannels()
  }, [])

  const fetchChannels = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/youtube-channels', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setChannels(data.channels || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChannelId.trim() || !newChannelName.trim()) return

    setIsAdding(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/youtube-channels', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          channelId: newChannelId.trim(),
          channelName: newChannelName.trim()
        })
      })
      
      if (res.ok) {
        toast.success('Channel added successfully')
        setNewChannelId('')
        setNewChannelName('')
        fetchChannels()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to add channel')
      }
    } catch (e) {
      toast.error('An error occurred')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this channel?')) return
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/admin/youtube-channels?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        credentials: 'include'
      })
      
      if (res.ok) {
        toast.success('Channel removed')
        fetchChannels()
      } else {
        toast.error('Failed to remove channel')
      }
    } catch (e) {
      toast.error('An error occurred')
    }
  }

  const handleManualSync = async (specificChannelId?: string) => {
    if (specificChannelId) {
      setSyncingChannelId(specificChannelId)
    } else {
      setIsSyncing(true)
    }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/youtube/sync', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: specificChannelId ? JSON.stringify({ channelId: specificChannelId }) : '{}',
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Synced successfully! Added ${data.addedCount} new videos.`)
      } else {
        toast.error('Sync failed')
      }
    } catch (e) {
      toast.error('An error occurred during sync')
    } finally {
      setIsSyncing(false)
      setSyncingChannelId(null)
    }
  }

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newVideoUrl.trim()) return

    setIsAddingVideo(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/youtube/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ videoUrl: newVideoUrl.trim() }),
        credentials: 'include'
      })
      
      if (res.ok) {
        toast.success('Video added successfully')
        setNewVideoUrl('')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to add video')
      }
    } catch (e) {
      toast.error('An error occurred')
    } finally {
      setIsAddingVideo(false)
    }
  }

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">YouTube Auto-Sync</h2>
          <p className="text-gray-500 mt-1">Manage connected YouTube channels for the Shorts feed.</p>
        </div>
        <button
          onClick={() => handleManualSync()}
          disabled={isSyncing || channels.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing All...' : 'Sync All Now'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Channel</h3>
        <form onSubmit={handleAddChannel} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Channel Name (e.g. Mana Choutuppal)"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="YouTube Channel ID (e.g. UCAxxxxxx)"
            value={newChannelId}
            onChange={(e) => setNewChannelId(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={isAdding}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Channel
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-900">Connected Channels</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {channels.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No channels added yet. Add a channel ID above to start syncing.
            </div>
          ) : (
            channels.map((channel) => (
              <div key={channel.id} className="p-4 px-6 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Youtube className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{channel.channelName}</h4>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{channel.channelId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleManualSync(channel.channelId)}
                    disabled={syncingChannelId === channel.channelId}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncingChannelId === channel.channelId ? 'animate-spin' : ''}`} />
                    Sync
                  </button>
                  <button
                    onClick={() => handleDelete(channel.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Remove Channel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Add Specific Video</h3>
        <p className="text-gray-500 text-sm mb-4">Manually add a single YouTube video or Short by pasting its link.</p>
        <form onSubmit={handleAddVideo} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="YouTube URL (e.g. https://youtu.be/...)"
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={isAddingVideo}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Video
          </button>
        </form>
      </div>
    </div>
  )
}
