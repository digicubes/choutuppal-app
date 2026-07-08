'use client'

import { useState } from 'react'
import { Send, Loader2, BellRing } from 'lucide-react'
import { toast } from 'sonner'
import { sendPushNotification } from '@/app/actions/admin-actions'

export default function AdminPush() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [url, setUrl] = useState('/')
  const [isSending, setIsSending] = useState(false)

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !message) {
      toast.error('Title and Message are required')
      return
    }

    const toastId = toast.loading('Sending notification...')
    console.log('Sending push...', { title, message })
    setIsSending(true)
    
    try {
      const result = await sendPushNotification(title, message, url)
      
      if (result.error) throw new Error(result.error)
      
      toast.success('Notification sent successfully!', { id: toastId })
      setTitle('')
      setMessage('')
      setUrl('/')
    } catch (error: any) {
      toast.error('Error: ' + error.message, { id: toastId })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Push Notifications</h1>
        <p className="text-gray-500 mt-1">Send a global push notification to all subscribed users across the platform.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <form onSubmit={handleSendPush} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., New Feature Alert!"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message Body</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px] resize-none"
              placeholder="Enter the notification message here..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Link URL (Optional)</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., /news/latest-update"
            />
            <p className="text-xs text-gray-500 mt-2">Where the user is taken when they click the notification.</p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={isSending}
              className="flex items-center gap-2 px-6 py-3 text-white rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm shadow-blue-200"
              style={{ background: 'linear-gradient(to right, #4169E1, #D4AF37)' }}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Push Notification
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
