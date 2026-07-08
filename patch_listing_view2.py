import re

def patch_listing_view2():
    file_path = 'src/components/listing-view.tsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Ensure `services` is rendered.
    # Add `services: string[] | null` to ListingData
    if 'services: string[] | null' not in content:
        content = content.replace('description: string | null', 'description: string | null\n  services?: string | null')

    # Add services rendering below Description
    services_block = """        {/* Services Section */}
        {listing.services && JSON.parse(listing.services).length > 0 && (
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 p-5 md:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-3">
              <div className="w-1.5 h-6 bg-gradient-to-b from-[#4169E1] to-[#D4AF37] rounded-full"></div>
              Our Services
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {JSON.parse(listing.services).map((service: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <div className="mt-1 size-1.5 rounded-full bg-[#D4AF37] shrink-0" />
                  <span className="text-sm font-medium">{service}</span>
                </li>
              ))}
            </ul>
          </div>
        )}"""
    
    if 'Our Services' not in content:
        content = content.replace('{/* Gallery Section */}', services_block + '\n\n        {/* Gallery Section */}')

    # 2. Location Button condition fix
    # Desktop
    content = re.sub(
        r'\{listing\.latitude && listing\.longitude && \([\s\S]*?<Button variant="outline" onClick=\{\(\) => window\.open\(`https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=\$\{listing\.latitude\},\$\{listing\.longitude\}`\)\} className="border-gray-200 hover:bg-gray-50">\s*<MapPin className="size-4 mr-2" \/> Location\s*<\/Button>\s*\)\}',
        r"""            <Button variant="outline" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${listing.latitude ? listing.latitude + ',' + listing.longitude : encodeURIComponent(listing.address || listing.name)}`)} className="border-gray-200 hover:bg-gray-50">
              <MapPin className="size-4 mr-2" /> Location
            </Button>""",
        content
    )

    # Mobile
    content = re.sub(
        r'\{listing\.latitude && listing\.longitude && \([\s\S]*?<a\s*href=\{\`https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=\$\{listing\.latitude\},\$\{listing\.longitude\}\`\}\s*target="_blank" rel="noreferrer"\s*className="flex-1 h-full flex flex-col items-center justify-center rounded-xl bg-\[#EA4335\] hover:bg-\[#C5221F\] text-white transition-colors shadow-sm"\s*>\s*<MapPin className="size-5 mb-0\.5" \/>\s*<span className="text-\[10px\] font-bold">Location<\/span>\s*<\/a>\s*\)\}',
        r"""          <a
            href={`https://www.google.com/maps/search/?api=1&query=${listing.latitude ? listing.latitude + ',' + listing.longitude : encodeURIComponent(listing.address || listing.name)}`}
            target="_blank" rel="noreferrer"
            className="flex-1 h-full flex flex-col items-center justify-center rounded-xl bg-[#EA4335] hover:bg-[#C5221F] text-white transition-colors shadow-sm"
          >
            <MapPin className="size-5 mb-0.5" />
            <span className="text-[10px] font-bold">Location</span>
          </a>""",
        content
    )
    
    # About Section rendering fix: Ensure prose-li and prose-ul are styled
    content = content.replace('prose prose-sm md:prose-base', 'prose prose-sm md:prose-base prose-ul:list-disc prose-li:marker:text-[#D4AF37]')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

patch_listing_view2()
print("Patched listing view 2")
