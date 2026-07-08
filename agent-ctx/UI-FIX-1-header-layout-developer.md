# Task UI-FIX-1: Header & Layout Developer

## Task
Rewrite header with desktop nav, remove sidebar, update store

## Work Done
1. Rewrote `/home/z/my-project/src/components/header.tsx` - Full rewrite with desktop horizontal nav links (Home, Explore, News, Dashboard, Admin), city selector, voice search, notifications, avatar. Mobile header is compact with logo, city pin, search icon, bell icon.
2. Replaced `/home/z/my-project/src/components/desktop-sidebar.tsx` - Now returns null (sidebar removed).
3. Updated `/home/z/my-project/src/lib/store.ts` - Added `showBottomNav` boolean state, `setShowBottomNav` action. Updated `navigateTo` to set `showBottomNav: view !== 'listing'`. Updated `setSelectedListing` to set `showBottomNav: !slug`.
4. Lint passes with 0 errors.

## Key Decisions
- Desktop nav uses horizontal text links in header (SaaS style) instead of sidebar
- Active link indicated by gold underline + gold text with Framer Motion layoutId animation
- Admin link only visible if `currentUser.role === 'admin'`
- Mobile header is minimal: logo, city selector, search icon, notification bell
- `showBottomNav` state controls bottom nav visibility (hides when viewing listing detail)
