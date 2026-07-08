# Task 5: Music Library Admin Tab Builder

## Task
Add a "Music Library" tab to the Admin Panel with full CRUD operations and mandatory copyright protection.

## Changes Made

### 1. API Route Update: `/api/music-library/route.ts`
- Added `?all=true` parameter support to GET handler
- When `all=true`, removes the `isActive: true` filter so admin can see all tracks including inactive ones
- Preserves existing `?search=` and `?genre=` filter behavior

### 2. Admin View: `/src/components/admin-view.tsx`
**Imports:**
- Added `Music` and `Disc3` icons from lucide-react

**Interface:**
- Added `MusicTrack` interface with: id, name, artist, audioUrl, genre, duration, isActive, createdAt

**State Variables:**
- `musicTracks` - array of MusicTrack
- `musicLoading` - loading state
- `showMusicForm` - dialog visibility
- `editingMusic` - track being edited (null for new)
- `musicForm` - form fields (name, artist default "Royalty Free", audioUrl, genre default "Telugu", duration default 30, isActive)
- `savingMusic` - saving state
- `deleteMusicDialog` - track ID for delete confirmation
- `isRoyaltyFreeConfirmed` - mandatory copyright checkbox

**Fetch:**
- `fetchMusicTracks` callback hitting `/api/music-library?all=true`
- useEffect to call on mount

**Tab Trigger:**
- Added "Music" tab with Music icon between Ticker and Branding tabs

**Tab Content (TabsContent "music"):**
- Track list table with columns: Name, Artist, Genre, Duration (mm:ss format), Status (Active/Inactive badge), Actions
- Toggle active/inactive button (PATCH /api/music-library/[id])
- Edit button (opens pre-filled dialog)
- Delete button (opens confirmation dialog)
- Add Track button (opens empty form dialog)
- Empty state with Disc3 icon
- Loading state with spinner
- max-h-96 overflow-y-auto with custom scrollbar

**Add/Edit Dialog:**
- Track Name (required)
- Artist (default "Royalty Free")
- Audio URL (required, direct link only)
- Genre (Select: Telugu, Hindi, Instrumental, Lo-Fi, Ambient, Pop, Classical, Folk, Devotional, Other)
- Duration in seconds (number input)
- Active toggle (Switch)
- **Mandatory copyright checkbox**: "I confirm this audio is royalty-free and safe for commercial use."
  - Visual feedback: red border/bg when unchecked, green when checked
  - Explanation text about YouTube/Spotify/piracy prohibition
- Submit validates: name required, audioUrl required, no blocked URLs, checkbox must be checked
- POST sends `isRoyaltyFreeConfirmed: true`
- PATCH for edits
- Toast notifications for all outcomes

**Delete Dialog:**
- Confirmation with Cancel/Delete buttons
- DELETE /api/music-library/[id]

## Copyright Protection
- **Client-side**: Mandatory checkbox + blocked URL patterns (youtube.com, youtu.be, spotify.com, spotify.link)
- **Server-side**: POST requires `isRoyaltyFreeConfirmed: true` or returns 400 error
- No YouTube, Spotify, or pirated content links allowed

## Lint Status
Passes (pre-existing error in stories-section.tsx unrelated to changes)
