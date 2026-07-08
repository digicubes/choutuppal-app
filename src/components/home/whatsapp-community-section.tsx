'use client'

import { MessageCircle, Bell } from 'lucide-react'
import { useAppStore } from '@/lib/store'

/**
 * WhatsAppCommunitySection — Highly visible glassmorphism section
 * for user growth via WhatsApp Community & Channel.
 * Placed below Banner Ads, above Categories Grid.
 * Links are dynamic from admin settings; buttons hidden if links are empty.
 */
export function WhatsAppCommunitySection() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const siteSettings = useAppStore((s) => s.siteSettings)

  const communityLink = siteSettings.whatsappCommunityLink || ''
  const channelLink = siteSettings.whatsappChannelLink || ''

  // Hide entire section if neither link is configured
  if (!communityLink && !channelLink) return null

  return (
    <section className="w-full px-4">
      <div className="w-full bg-gradient-to-r from-[#25D366]/10 to-white p-4 md:p-6 rounded-2xl border border-[#25D366]/30 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h3 className="text-lg md:text-xl font-bold text-gray-900">
              Join Choutuppal Digital Community
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Get instant local updates, offers, and news directly on WhatsApp!
            </p>
          </div>
          <div className="flex gap-3">
            {communityLink && (
              <a
                href={communityLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2.5 rounded-xl font-semibold shadow-md hover:bg-[#128C7E] transition-colors text-sm min-h-[44px]"
              >
                <MessageCircle className="size-4 shrink-0" />
                Join Community
              </a>
            )}
            {channelLink && (
              <a
                href={channelLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white text-[#128C7E] border-2 border-[#25D366] px-4 py-2.5 rounded-xl font-semibold shadow-md hover:bg-gray-50 transition-colors text-sm min-h-[44px]"
              >
                <Bell className="size-4 shrink-0" />
                Follow Channel
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
