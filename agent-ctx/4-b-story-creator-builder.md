# Task 4-b: Story Creator Component

## Summary
Created the Story Creator component at `/home/z/my-project/src/components/story-creator.tsx`.

## Component Details

### Interface
```tsx
interface StoryCreatorProps {
  isOpen: boolean
  onClose: () => void
  cityId: string
  userId: string
  onStoryCreated: () => void
}
```

### 3-Step Flow

1. **Step 1 - Media Upload**: Full-screen dark modal with react-dropzone drag & drop zone. Accepts image/* and video/*. Validates video duration (max 30s). Shows preview after upload with "Choose different media" option. Auto-advances to Step 2 on upload.

2. **Step 2 - Add Music**: Shows media preview with floating "🎵 Music" button. Clicking opens a vaul Drawer with search bar, track list from `/api/music-library` API. Each track shows name, artist, genre, duration with Play/Pause 10-second preview. Selected track gets gold (#D4AF37) highlight border. Spinning disc pill shows on preview: "🎵 {musicName}". Remove music option available.

3. **Step 3 - Preview & Post**: Full media preview with background music (looped). Animated equalizer bars indicator. Optional title input (100 char max). Glowing gold gradient "Post Story" button. POSTs to `/api/stories` with base64 data URL as mediaUrl.

### Key Features
- Proper audio cleanup on unmount
- Full state reset on close
- Debounced music search (300ms)
- Framer Motion animations throughout
- Step indicator dots in header
- Responsive design (max-w-lg, aspect-[9/16] preview)
- TypeScript strict mode compatible
- ESLint clean

### Dependencies Used
- react-dropzone (v15)
- framer-motion
- vaul Drawer (from @/components/ui/drawer)
- shadcn/ui Input
- sonner toast
- Lucide React icons

### API Integration
- GET `/api/music-library` - Fetches music tracks with optional search parameter
- POST `/api/stories` - Creates story with userId, cityId, title, mediaType, mediaUrl, musicId, musicName, isPremium
