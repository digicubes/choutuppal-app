# Task 3: Header RBAC Rewrite

## Summary
Rewrote `/home/z/my-project/src/components/header.tsx` with full role-based access control for both desktop navigation links and mobile drawer menu.

## Key Changes

### Role Hierarchy System
- Added `RoleLevel` type: 'guest' | 'user' | 'agent' | 'admin' | 'super_admin'
- `ROLE_HIERARCHY` numeric map for comparison
- `getEffectiveRole()` maps real roles ('city_admin' → 'admin', 'business' → 'user')
- `hasMinRole()` filter function used throughout

### Desktop Nav (MAX_VISIBLE_DESKTOP = 5)
- **Guest**: Home, Explore, News, Jobs, Real Estate (5 items, no overflow)
- **User**: 5 visible + "More" dropdown (Community, Blog)
- **Agent**: 5 visible + "More" dropdown (Community, Blog, Agent Dashboard, Boost Listings)
- **Admin**: 5 visible + "More" dropdown (Community, Blog, Agent Dashboard, Boost Listings, Admin Panel)
- **Super Admin**: 5 visible + "More" dropdown (... + Super Admin)

### Mobile Drawer
- Main nav section (RBAC filtered)
- Separator
- Personal section (authenticated): My Dashboard, My Listings, Saved, Notifications (with badge)
- Guest section: Sign In, Install App
- Install App also available for authenticated users

### Solid White Backgrounds
- Header: `bg-white border-b border-gray-200 shadow-sm` (no transparency)
- Drawer: `bg-white` (already solid)

### All Existing Functionality Preserved
- City selector, NotificationPanel, auth buttons, brand logo/name, PWA install

## Verification
- ESLint: passes
- Dev server: compiles cleanly
