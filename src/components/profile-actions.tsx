'use client'

import { Share2, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function ProfileActions({ userId, phone }: { userId: string, phone?: string | null }) {
  const handleShare = async () => {
    const url = `https://choutuppal.in/profile/${userId}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this profile on Choutuppal App',
          url,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Profile link copied to clipboard!')
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-gray-100">
      <Button 
        onClick={handleShare}
        className="w-full rounded-xl h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-[#4169E1] to-[#D4AF37] hover:opacity-90 text-white shadow-lg font-bold border-0"
      >
        <Share2 className="size-4" />
        Share Profile
      </Button>
      
      {phone && (
        <a href={`https://wa.me/91${phone}`} target="_blank" rel="noopener noreferrer" className="w-full">
          <Button className="w-full rounded-xl h-12 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-[#25D366]/20 font-bold border-0">
            <MessageCircle className="size-4" />
            WhatsApp
          </Button>
        </a>
      )}
    </div>
  )
}
