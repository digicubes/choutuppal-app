import re

def patch_listing_footer():
    file_path = 'src/components/listing-view.tsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    old_footer_pattern = re.compile(r'\{\/\* Sticky Action Footer .*?<\/div>\s*<\/div>\s*<\/div>', re.DOTALL)
    
    new_footer = """      {/* Sticky Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-50 md:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 h-14">
          {phoneToCall && (
            <a
              href={`tel:${phoneToCall}`}
              className="flex-1 h-full flex flex-col items-center justify-center rounded-xl bg-[#4169E1] hover:bg-[#3151b0] text-white transition-colors shadow-sm"
            >
              <Phone className="size-5 mb-0.5" />
              <span className="text-[10px] font-bold">Call</span>
            </a>
          )}
          {phoneToWA && (
            <a
              href={`https://wa.me/${phoneToWA}?text=Hi%2C%20I%20saw%20your%20business%20on%20Choutuppal%20App`}
              target="_blank" rel="noreferrer"
              className="flex-1 h-full flex flex-col items-center justify-center rounded-xl bg-[#25D366] hover:bg-[#1DA851] text-white transition-colors shadow-sm"
            >
              <MessageCircle className="size-5 mb-0.5" />
              <span className="text-[10px] font-bold">WhatsApp</span>
            </a>
          )}
          {listing.latitude && listing.longitude && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`}
              target="_blank" rel="noreferrer"
              className="flex-1 h-full flex flex-col items-center justify-center rounded-xl bg-[#EA4335] hover:bg-[#C5221F] text-white transition-colors shadow-sm"
            >
              <MapPin className="size-5 mb-0.5" />
              <span className="text-[10px] font-bold">Location</span>
            </a>
          )}
          <button
            onClick={generateVCard}
            className="flex-1 h-full flex flex-col items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors shadow-sm border border-gray-200"
          >
            <Download className="size-5 mb-0.5" />
            <span className="text-[10px] font-bold">Save</span>
          </button>
          <button
            onClick={handleShare}
            className="flex-1 h-full flex flex-col items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors shadow-sm border border-gray-200"
          >
            <Share2 className="size-5 mb-0.5" />
            <span className="text-[10px] font-bold">Share</span>
          </button>
        </div>
      </div>"""
      
    content = old_footer_pattern.sub(new_footer, content)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

patch_listing_footer()
print("Patched footer")
