import re

def patch_featured():
    file_path = 'src/components/home/featured-listings.tsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add rating to interface
    if 'rating: number' not in content:
        content = content.replace("viewsCount: number", "viewsCount: number\n  rating: number")

    # Remove category from image
    content = content.replace("""                    {/* Category badge */}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-white/80 backdrop-blur-sm text-gray-700 text-[10px] border-0 shadow-sm">
                        {listing.category}
                      </Badge>
                    </div>""", "")
                    
    # Change content block
    content_block_old = """                  {/* Content */}
                  <div className="p-3 space-y-1.5">
                    <h3 className="text-sm font-semibold text-gray-800 line-clamp-1">
                      {listing.name}
                    </h3>

                    {listing.address && (
                      <div className="flex items-center gap-1 text-gray-500">
                        <MapPin className="size-3 flex-shrink-0" />
                        <span className="text-[11px] truncate">{listing.address}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="size-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                        <span className="text-xs text-gray-600">
                          {(listing._count?.reviews || 0) > 0 ? `${listing._count?.reviews} reviews` : 'New'}
                        </span>
                      </div>
                    </div>

                    {/* WhatsApp Button */}
                    {listing.whatsappNumber && (
                      <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                        <WhatsAppButton
                          whatsappNumber={listing.whatsappNumber}
                          businessName={listing.name}
                          className="!px-3 !py-1.5 !text-[11px] w-full justify-center bg-green-500 hover:bg-green-600 text-white"
                        />
                      </div>
                    )}
                  </div>"""
    
    # We'll just replace the whole content div using regex or simple replace
    # Wait, the WhatsAppButton currently might not have bg-green-500. Let's use regex to replace from "                  {/* Content */}" to "</GlassCard>"
    pattern = re.compile(r'\{\/\* Content \*\/\}.*?<\/GlassCard>', re.DOTALL)
    new_content = """{/* Content */}
                  <div className="p-3 space-y-1.5">
                    <h3 className="text-sm font-semibold text-gray-800 line-clamp-1">
                      {listing.name}
                    </h3>
                    
                    <Badge variant="secondary" className="bg-[#4169E1]/10 text-[#4169E1] border-[#4169E1]/20 text-[10px] py-0">
                      {listing.category}
                    </Badge>

                    {listing.address && (
                      <div className="flex items-center gap-1 text-gray-500 mt-1">
                        <MapPin className="size-3 flex-shrink-0" />
                        <span className="text-[11px] truncate">{listing.address}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 mt-1">
                      <Star className="size-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                      <span className="text-xs font-semibold text-gray-700">
                        {listing.rating || 5.0}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        ({listing._count?.reviews || 0} reviews)
                      </span>
                    </div>

                    {/* WhatsApp Button */}
                    {listing.whatsappNumber && (
                      <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                        <button className="w-full flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1.5 rounded-md transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                          WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                </GlassCard>"""
    content = pattern.sub(new_content, content)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def patch_explore():
    file_path = 'src/components/explore-view.tsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'rating: number' not in content:
        content = content.replace("viewsCount: number", "viewsCount: number\n  rating: number")

    pattern = re.compile(r'\{\/\* Content \*\/\}.*?<\/GlassCard>', re.DOTALL)
    new_content = """{/* Content */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {listing.name}
                      </h3>
                      
                      <Badge variant="secondary" className="bg-[#4169E1]/10 text-[#4169E1] border-[#4169E1]/20 text-[10px] py-0 inline-flex w-max">
                        {listing.category}
                      </Badge>
                      
                      {listing.address && (
                        <p className="text-xs text-gray-500 line-clamp-1 flex items-center gap-1 mt-1">
                          <MapPin className="size-3 shrink-0" />
                          {listing.address}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="size-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                        <span className="text-xs font-semibold text-gray-700">
                          {listing.rating || 5.0}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          ({listing._count?.reviews || 0} reviews)
                        </span>
                      </div>
                      
                      <div className="pt-1">
                        {listing.whatsappNumber ? (
                           <div onClick={(e) => {
                             e.stopPropagation()
                             window.open(`https://wa.me/91${listing.whatsappNumber.replace(/\\\\D/g, '')}?text=Hi, I found your business on Choutuppal App`, '_blank')
                           }}>
                             <button className="w-full flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1.5 rounded-md transition-colors">
                               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                               WhatsApp
                             </button>
                           </div>
                        ) : (
                          <button
                            onClick={(e) => handleGetQuote(e, listing.id)}
                            className="w-full flex items-center justify-center gap-1 bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white text-xs font-semibold py-1.5 rounded-md transition-colors active:scale-95"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-phone"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            Get Quote
                          </button>
                        )}
                      </div>
                    </div>
                  </GlassCard>"""
    content = pattern.sub(new_content, content)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

patch_featured()
patch_explore()
print("Patched cards")
