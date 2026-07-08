import re

def patch_cards():
    for file_path in ['src/components/home/featured-listings.tsx', 'src/components/explore-view.tsx']:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Remove WhatsApp buttons
        # In featured-listings.tsx
        content = re.sub(r'\{\/\* WhatsApp Button \*\/\}.*?<\/button>\s*<\/div>\s*<\/div>', '', content, flags=re.DOTALL)
        
        # In explore-view.tsx
        content = re.sub(r'<div className="pt-1">\s*\{listing\.whatsappNumber \? \([\s\S]*?<\/div>\s*<\/div>\s*<\/GlassCard>', '</div>\n                  </GlassCard>', content)

        # Image fixing: The cards use `getFirstImage(listing.images)` or similar. 
        if 'coverImage: string | null' not in content:
            content = content.replace('images: string | null', 'images: string | null\n  coverImage?: string | null\n  logoUrl?: string | null')
        
        # Replace the image fallback logic
        if 'featured-listings.tsx' in file_path:
            content = content.replace('const img = getFirstImage(listing.images)', 'const img = listing.coverImage || listing.logoUrl || getFirstImage(listing.images)')
        elif 'explore-view.tsx' in file_path:
            content = content.replace("const coverImg = images[0] || ''", "const coverImg = listing.coverImage || listing.logoUrl || images[0] || ''")

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

patch_cards()
print('Patched cards')
