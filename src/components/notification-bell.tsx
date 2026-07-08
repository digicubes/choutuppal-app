'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications')
        if (res.ok) {
          const data = await res.json()
          setNotifications(data)
        }
      } catch (error) {
        console.error('Failed to fetch notifications', error)
      }
    }
    fetchNotifications()
    // Polling every minute
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleNotificationClick = async (notification: any) => {
    setIsOpen(false)
    if (!notification.isRead) {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notification.id })
      })
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n))
    }
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const markAllAsRead = async () => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition bg-white rounded-full hover:bg-gray-100"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  <Bell className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  No notifications yet
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition flex items-start gap-3 ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.isRead ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
