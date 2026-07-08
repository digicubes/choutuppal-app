# Task 4: Integrate MediaUploader into Admin Panel views

## Summary
Successfully integrated the MediaUploader component into 4 locations across 3 admin tabs in admin-view.tsx.

## Changes Made

### 1. Import Added (line 51)
```tsx
import { MediaUploader } from '@/components/media-uploader'
```

### 2. City Manager Tab - Hero Image (was lines 981-989)
- Replaced: Text `<Input>` for Hero Image URL
- With: `<MediaUploader guideline="hero" folder="choutuppal/cities" label="Hero Image" className="col-span-1 sm:col-span-2" />`
- State binding: `value={newCityHero}` / `onChange={setNewCityHero}`

### 3. Content CMS Tab - News Image (was lines 1449-1457)
- Replaced: Text `<Input>` for Image URL
- With: `<MediaUploader guideline="news" folder="choutuppal/news" acceptVideo label="Article Thumbnail / Video" />`
- State binding: `value={newsForm.imageUrl}` / `onChange={(url) => setNewsForm({ ...newsForm, imageUrl: url })}`

### 4. Settings Tab - App Logo (was lines 1915-1927)
- Replaced: Text `<Input>` + `<Image>` preview for App Logo URL
- With: `<MediaUploader guideline="logo" folder="choutuppal/branding" label="App Logo" />`
- State binding: `value={settings?.logoUrl || ''}` / `onChange={(url) => setSettings((s) => s ? { ...s, logoUrl: url } : s)}`

### 5. Settings Tab - Hero Background Image (was lines 1929-1942)
- Replaced: Text `<Input>` + `<Image>` preview for Hero Background Image URL
- With: `<MediaUploader guideline="hero" folder="choutuppal/branding" label="Hero Background Image" />`
- State binding: `value={heroImageUrl}` / `onChange={setHeroImageUrl}`

## Verification
- Lint: 0 errors (2 pre-existing warnings in media-uploader.tsx unrelated to this change)
- Dev server: Running and serving pages successfully
- All state bindings preserved
- Royal Gold & Blue theme preserved
