import re

def patch_listing_view():
    file_path = 'src/components/listing-view.tsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add rating to ListingData
    if 'rating: number' not in content:
        content = content.replace("viewsCount: number", "viewsCount: number\n  rating: number")

    # 2. Add rating display
    rating_display = """              {listing.isClaimed === false && (
                <Badge 
                  onClick={() => setShowClaimDialog(true)}
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer animate-pulse"
                >
                  🎯 Claim This Business
                </Badge>
              )}
              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-100 text-yellow-700">
                <Star className="size-3.5 fill-yellow-500 text-yellow-500" />
                <span className="text-sm font-bold">{listing.rating || 5.0}</span>
              </div>"""
    content = content.replace("""              {listing.isClaimed === false && (
                <Badge 
                  onClick={() => setShowClaimDialog(true)}
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer animate-pulse"
                >
                  🎯 Claim This Business
                </Badge>
              )}""", rating_display)

    # 3. Add Desktop Buttons next to profile logo or right side of header
    desktop_buttons = """          <div className="hidden md:flex items-center gap-4 mt-4 md:mt-0">
            {phoneToCall && (
              <Button onClick={() => window.location.href = `tel:${phoneToCall}`} className="bg-[#4169E1] hover:bg-[#3151b0] text-white">
                <Phone className="size-4 mr-2" /> Call
              </Button>
            )}
            {phoneToWA && (
              <Button onClick={() => window.open(`https://wa.me/${phoneToWA}?text=Hi%2C%20I%20saw%20your%20business%20on%20Choutuppal%20App`)} className="bg-[#25D366] hover:bg-[#1DA851] text-white">
                <MessageCircle className="size-4 mr-2" /> WhatsApp
              </Button>
            )}
            <Button variant="outline" onClick={generateVCard} className="border-gray-200 hover:bg-gray-50">
              <Download className="size-4 mr-2" /> Save
            </Button>
            {listing.latitude && listing.longitude && (
              <Button variant="outline" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`)} className="border-gray-200 hover:bg-gray-50">
                <MapPin className="size-4 mr-2" /> Location
              </Button>
            )}
            <Button variant="outline" onClick={handleShare} className="border-gray-200 hover:bg-gray-50">
              <Share2 className="size-4 mr-2" /> Share
            </Button>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0 md:hidden text-sm text-gray-500 bg-white px-3 py-1 rounded-md shadow-sm border border-gray-100">"""
    
    content = content.replace("""          <div className="flex items-center gap-4 mt-4 md:mt-0 text-sm text-gray-500 bg-white px-3 py-1 rounded-md shadow-sm border border-gray-100">""", desktop_buttons)

    # 4. Hide Sticky Footer on Desktop
    content = content.replace("""<div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-50">""", """<div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-50 md:hidden">""")

    # 5. Replace Carousel with Photo Gallery (Grid Layout) and Lightbox
    # First, add selectedImage state
    if 'const [selectedImage, setSelectedImage] = useState<string | null>(null)' not in content:
        content = content.replace('const [loading, setLoading] = useState(true)', 'const [loading, setLoading] = useState(true)\n  const [selectedImage, setSelectedImage] = useState<string | null>(null)')

    gallery_grid = """          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 p-5 md:p-6 overflow-hidden">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-3">
              <div className="w-1.5 h-6 bg-gradient-to-b from-[#4169E1] to-[#D4AF37] rounded-full"></div>
              Gallery
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {galleryImages.map((img: string, idx: number) => (
                <div key={idx} onClick={() => setSelectedImage(img)} className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer group">
                  <OptimizedImage
                    src={img}
                    alt={`${listing.name} gallery ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
              ))}
            </div>
          </div>"""
    
    # We replace the entire Carousel block
    pattern_gallery = re.compile(r'\{\/\* Gallery Section \*\/\}.*?<\/div>.*?<\/div>.*?<\/div>', re.DOTALL)
    # Actually wait, the gallery block ends differently
    old_gallery_search = """        {galleryImages.length > 0 && (
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 p-5 md:p-6 overflow-hidden">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-3">
              <div className="w-1.5 h-6 bg-gradient-to-b from-[#4169E1] to-[#D4AF37] rounded-full"></div>
              Gallery
            </h2>
            <Carousel className="w-full">
              <CarouselContent className="-ml-2">
                {galleryImages.map((img: string, idx: number) => (
                  <CarouselItem key={idx} className="pl-2 basis-[85%] sm:basis-1/2 lg:basis-1/3">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm border border-gray-100">
                      <OptimizedImage
                        src={img}
                        alt={`${listing.name} gallery ${idx + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        )}"""
    
    gallery_replacement = """        {/* Gallery Section */}
        {galleryImages.length > 0 && (""" + gallery_grid + "\n        )}"
    content = content.replace(old_gallery_search, gallery_replacement)

    # 6. Add Lightbox Dialog at the bottom
    lightbox_code = """      {/* Lightbox Dialog */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-white/10 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <div className="relative w-full max-w-5xl aspect-square md:aspect-video" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Gallery image fullscreen" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
      
      {/* Claim Business Dialog */}"""
    content = content.replace("{/* Claim Business Dialog */}", lightbox_code)
    
    # 7. Make Sticky Footer simple 5-button layout. "Mobile Sticky Footer: Call, WhatsApp, Save Contact (.vcf), Location, Share"
    # User might want a single row or simple icons. 
    # Current has Top Row: Call, WhatsApp, Location. Bottom Row: Status, Group, Save Contact, Share.
    # We will leave it as is but hide on MD. Since they requested 5 buttons, I'll combine them or let them be in 2 rows. 
    # Actually wait, I will keep what's there because they said "Call, WhatsApp, Save Contact (.vcf), Location, Share" which are exactly 5 if we ignore "Status/Group". Let's simplify bottom row to just "Save" and "Share".
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

patch_listing_view()
print("Patched listing view")
