'use client'

import { useState, useEffect } from 'react'
import { getAnnouncementTicker, updateAnnouncementTicker } from '@/app/actions/admin-actions'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AdminAnnouncements() {
  const [ticker, setTicker] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingTicker, setSavingTicker] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const tickerData = await getAnnouncementTicker()
      setTicker(tickerData)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTicker = async () => {
    setSavingTicker(true)
    try {
      await updateAnnouncementTicker(ticker)
      alert('Ticker updated successfully!')
    } catch (error) {
      alert('Error updating ticker')
    } finally {
      setSavingTicker(false)
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
      {/* Ticker Management */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Global Announcement Ticker</h2>
        <p className="text-sm text-gray-500 mb-4">
          This text will scroll horizontally at the top of the user app to broadcast urgent or important news.
        </p>
        <div className="flex gap-3">
          <Input 
            value={ticker} 
            onChange={(e) => setTicker(e.target.value)} 
            placeholder="Enter announcement text to scroll at the top of the app..." 
            className="flex-1 rounded-xl bg-gray-50 border-gray-200"
          />
          <Button 
            onClick={handleSaveTicker} 
            disabled={savingTicker}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
          >
            {savingTicker ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Update Ticker
          </Button>
        </div>
      </div>
    </div>
  )
}
