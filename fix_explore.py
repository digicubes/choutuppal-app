import re

with open('src/components/explore-view.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

if 'coverImage?: string | null' not in c:
    c = c.replace('images: string | null', 'images: string | null\n  coverImage?: string | null\n  logoUrl?: string | null')

c = c.replace("const coverImg = images[0] || ''", "const coverImg = listing.coverImage || listing.logoUrl || images[0] || ''")

# Remove whatsapp button
c = re.sub(r'<div className="pt-1">\s*\{listing\.whatsappNumber \? \([\s\S]*?<\/div>\s*<\/div>\s*<\/GlassCard>', '</div>\n                    </div>\n                  </GlassCard>', c)

with open('src/components/explore-view.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
