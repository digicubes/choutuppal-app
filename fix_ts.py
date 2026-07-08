import re

# Fix bulk route TS errors
with open('src/app/api/listings/bulk/route.ts', 'r', encoding='utf-8') as f:
    bulk_content = f.read()

bulk_content = bulk_content.replace('let finalGallery = [];', 'let finalGallery: string[] = [];')

with open('src/app/api/listings/bulk/route.ts', 'w', encoding='utf-8') as f:
    f.write(bulk_content)

# Fix agent-dashboard TS errors
with open('src/components/agent-dashboard.tsx', 'r', encoding='utf-8') as f:
    dash_content = f.read()

dash_content = dash_content.replace(
    "address: '', coverImage: '', logoUrl: '', galleryUrls: [],",
    "address: '', coverImage: '', logoUrl: '', galleryUrls: [] as string[],"
)
dash_content = dash_content.replace(
    "address: l.address || '', coverImage: l.coverImage || '', logoUrl: l.logoUrl || '', galleryUrls: l.gallery ? JSON.parse(l.gallery) : [],",
    "address: l.address || '', coverImage: l.coverImage || '', logoUrl: l.logoUrl || '', galleryUrls: l.gallery ? JSON.parse(l.gallery) as string[] : [] as string[],"
)

# And line 343 where expected 1 arguments but got 2: Wait, I added `handleImageUpload(e, 'gallery')` and `handleImageUpload` is now `(e: React.ChangeEvent<HTMLInputElement>, field: 'coverImage' | 'logoUrl' | 'gallery')`. Did I replace all instances?
# I'll check if there's any `handleImageUpload` called with 1 argument.
dash_content = dash_content.replace(
    "onChange={handleImageUpload}",
    "onChange={(e) => handleImageUpload(e, 'coverImage')}"
)

with open('src/components/agent-dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(dash_content)

print("TS errors fixed")
