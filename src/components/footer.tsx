'use client'

import { MapPin, Phone, Mail, Heart, Globe, ExternalLink, MessageCircle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { getCityUrl } from '@/lib/subdomain'

export default function Footer() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const selectedCityName = useAppStore((s) => s.selectedCityName)
  const currentCity = useAppStore((s) => s.currentCity)
  const availableCities = useAppStore((s) => s.availableCities)
  const themePrimary = useAppStore((s) => s.themePrimary)
  const themeSecondary = useAppStore((s) => s.themeSecondary)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const siteSettings = useAppStore((s) => s.siteSettings)

  const brandName = currentCity?.brandName || 'Choutuppal App'
  const appLogoUrl = siteSettings?.appLogoUrl || siteSettings?.logoUrl || '/brand-logo.png'
  const primary = themePrimary || '#4169E1'
  const secondary = themeSecondary || '#D4AF37'
  const currentSubdomain = currentCity?.subdomain || 'choutuppal'

  return (
    <footer className="hidden md:block border-t border-gray-100 bg-white mt-auto shrink-0">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
              <div className="flex items-center mb-3">
                <img src={appLogoUrl} alt="Choutuppal App" className="h-12 w-auto object-contain" />
              </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your super app for {selectedCityName}. Discover businesses, news, services, and
              everything local — all in one place.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Powered by Citizen CSC — choutuppal.in
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm text-gray-800 mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li
                className="hover:text-gray-800 transition-colors cursor-pointer"
                onClick={() => navigateTo('explore')}
              >
                Explore Businesses
              </li>
              <li
                className="hover:text-gray-800 transition-colors cursor-pointer"
                onClick={() => navigateTo('news')}
              >
                Local News
              </li>
              <li
                className="hover:text-gray-800 transition-colors cursor-pointer"
                onClick={() => navigateTo('blog')}
              >
                Blog
              </li>
              <li
                className="hover:text-gray-800 transition-colors cursor-pointer"
                onClick={() => navigateTo('dashboard')}
              >
                List Your Business
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm text-gray-800 mb-3">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-start gap-2">
                <MapPin className="size-3.5 mt-0.5 shrink-0" style={{ color: secondary }} />
                <span>{siteSettings?.contactAddress || `${currentCity?.name || 'Choutuppal'}, ${currentCity?.state || 'Telangana'}`}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0" style={{ color: secondary }} />
                <a href={`tel:${siteSettings?.contactPhone || '8790083706'}`} className="hover:text-gray-800 transition-colors">
                  +91 {siteSettings?.contactPhone || '8790083706'}
                </a>
              </li>
              {siteSettings?.supportEmail && (
                <li className="flex items-center gap-2">
                  <Mail className="size-3.5 shrink-0" style={{ color: secondary }} />
                  <a href={`mailto:${siteSettings.supportEmail}`} className="hover:text-gray-800 transition-colors">
                    {siteSettings.supportEmail}
                  </a>
                </li>
              )}
              <li className="text-xs text-gray-400 mt-1">
                Managed by Citizen CSC
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-xs text-gray-800 uppercase tracking-wider">Follow Us</h4>
              <div className="flex items-center gap-4">
                {useAppStore.getState().siteSettings.instagramUrl && (
                  <a href={useAppStore.getState().siteSettings.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#E1306C] transition-colors">
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                )}
                {useAppStore.getState().siteSettings.facebookUrl && (
                  <a href={useAppStore.getState().siteSettings.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1877F2] transition-colors">
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
                {useAppStore.getState().siteSettings.youtubeUrl && (
                  <a href={useAppStore.getState().siteSettings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#FF0000] transition-colors">
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                )}
                {useAppStore.getState().siteSettings.xUrl && (
                  <a href={useAppStore.getState().siteSettings.xUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors">
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                )}
              </div>
              {useAppStore.getState().siteSettings.whatsappCommunityLink && (
                <a 
                  href={useAppStore.getState().siteSettings.whatsappCommunityLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#25D366] text-[#25D366] text-xs font-medium hover:bg-[#25D366] hover:text-white transition-colors w-fit"
                >
                  <MessageCircle className="size-3.5" />
                  Join WhatsApp Community
                </a>
              )}
            </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col md:flex-row md:justify-between items-center gap-4">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Citizen CSC. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <a href="/terms" className="hover:text-gray-800 transition-colors">Terms & Conditions</a>
            <a href="/privacy" className="hover:text-gray-800 transition-colors">Privacy Policy</a>
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            Powered by Citizen CSC
          </p>
        </div>
      </div>
    </footer>
  )
}
