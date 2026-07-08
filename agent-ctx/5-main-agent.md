# Task 5 — Integrate MediaUploader into User Dashboard

## Summary
Integrated `MultiMediaUploader` component into the Dashboard's "Add New Listing" form, replacing the plain text input for image URLs with a full drag & drop multi-image uploader.

## Changes Made
**File: `/home/z/my-project/src/components/dashboard-view.tsx`**

1. **Import added**: `MultiMediaUploader` from `@/components/media-uploader`
2. **formData state**: `imageUrl: ''` → `imageUrls: [] as string[]`
3. **openAddListing**: `imageUrl: ''` → `imageUrls: []`
4. **openEditListing**: `imageUrl: imageUrls[0] || ''` → `imageUrls: imageUrls`
5. **handleSubmitListing**: `const imagesArr = formData.imageUrl ? [formData.imageUrl] : []` → `const imagesArr = formData.imageUrls.length > 0 ? formData.imageUrls : null`
6. **Create/Update fetch bodies**: `images: imagesArr.length > 0 ? imagesArr : null` → `images: imagesArr`
7. **JSX**: Replaced "Image URL" Input block with `<MultiMediaUploader value={formData.imageUrls} onChange={...} guideline="listing" folder="choutuppal/listings" maxFiles={8} label="Shop Images" />`

## Verification
- `bun run lint`: 0 errors (2 pre-existing warnings in media-uploader.tsx)
- Dev server running fine
