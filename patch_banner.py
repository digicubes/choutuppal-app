import re

with open('src/components/home/banner-ads.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add states for hover and popup
state_replace = """  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [selectedBannerUrl, setSelectedBannerUrl] = useState<string | null>(null)
  
  // Icon import for popup close
  import { X } from 'lucide-react'"""

content = content.replace("  const [currentIndex, setCurrentIndex] = useState(0)\n  const [loading, setLoading] = useState(true)", state_replace)

# Wait, the import must be at the top. Let's fix that.
content = content.replace("import { useAppStore } from '@/lib/store'", "import { useAppStore } from '@/lib/store'\nimport { X } from 'lucide-react'")
content = content.replace("  // Icon import for popup close\n  import { X } from 'lucide-react'", "")

# Modify the interval logic
interval_match = """  useEffect(() => {
    const interval = setInterval(goToNext, 3000)
    return () => clearInterval(interval)
  }, [goToNext])"""
interval_replace = """  useEffect(() => {
    if (isHovered || isPopupOpen) return;
    const interval = setInterval(goToNext, 4000)
    return () => clearInterval(interval)
  }, [goToNext, isHovered, isPopupOpen])"""
content = content.replace(interval_match, interval_replace)

# Add hover and click logic to the banner div
banner_div_match = """          <div
            key={currentIndex}
            onClick={() => {
              if (currentAd?.linkUrl) window.open(currentAd.linkUrl, '_blank', 'noopener,noreferrer')
            }}
            className="w-full aspect-[16/9] overflow-hidden bg-gray-100 rounded-lg relative shadow-sm cursor-pointer transition-opacity duration-300 border-2 border-transparent"
            style={{
              backgroundClip: 'padding-box, border-box',
              backgroundImage: 'linear-gradient(white, white), linear-gradient(to right, #4169E1, #D4AF37)'
            }}
          >"""
banner_div_replace = """          <div
            key={currentIndex}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => {
              if (hasImage) {
                setSelectedBannerUrl(currentAd.imageUrl!);
                setIsPopupOpen(true);
              } else if (currentAd?.linkUrl) {
                window.open(currentAd.linkUrl, '_blank', 'noopener,noreferrer')
              }
            }}
            className="w-full aspect-[16/9] overflow-hidden bg-gray-100 rounded-lg relative shadow-sm cursor-pointer transition-opacity duration-300 border-2 border-transparent"
            style={{
              backgroundClip: 'padding-box, border-box',
              backgroundImage: 'linear-gradient(white, white), linear-gradient(to right, #4169E1, #D4AF37)'
            }}
          >"""
content = content.replace(banner_div_match, banner_div_replace)

# Add the modal to the return statement
modal_code = """      {/* Subtle Dot Indicators */}
      <div className="flex justify-center items-center gap-1 mt-2">
        {ads.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-4 bg-[#D4AF37]'
                : 'w-1.5 bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Full-Screen Banner Popup Modal */}
      {isPopupOpen && selectedBannerUrl && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setIsPopupOpen(false)}
              className="absolute -top-4 -right-4 bg-white text-black p-2 rounded-full shadow-lg z-50 hover:bg-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={selectedBannerUrl} 
              className="max-w-full max-h-[90vh] rounded-lg animate-bounce-once object-contain" 
              alt="Banner Popup" 
            />
          </div>
        </div>
      )}
    </div>"""

content = content.replace("""      {/* Subtle Dot Indicators */}
      <div className="flex justify-center items-center gap-1 mt-2">
        {ads.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-4 bg-[#D4AF37]'
                : 'w-1.5 bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>""", modal_code)

with open('src/components/home/banner-ads.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated banner-ads.tsx")
