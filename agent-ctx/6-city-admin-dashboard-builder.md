# Task 6: City Admin Dashboard Builder

## Task
Build City Admin Dashboard with Revenue, Agents, Content Management, and Payout tabs

## Work Completed

### Created `/src/components/city-admin-dashboard.tsx`
- Full standalone component with `export function CityAdminDashboard()`
- `'use client'` directive at top
- Uses `useAuth()` for user data and `useAppStore()` for theme/platform settings

### Tab 1: Revenue Overview
- Gold GlassCard with Total Revenue (sum of cityAdminShare from transactions)
- Commission Share auto-calculated from `platformSettings.city_admin_commission_share`
- "Request Payout" button opening dialog with UPI ID and amount inputs
- Two side-by-side stat cards: Total Listings, Active Subscriptions
- Recent Revenue list (last 10 transactions)

### Tab 2: My Agents
- Fetches from `/api/admin/users?role=agent`, filters by `agentCityId === managedCityId`
- Table: Agent Name, Phone, Total Earnings, Pending Payout, Status, View action
- Agent detail dialog with full info grid

### Tab 3: Manage Content
- Three sub-tabs (Listings, News, Banners) using shadcn Tabs
- Listings: Approve/reject with city filter, status filter dropdown
- News: Full CRUD with dialog forms, auto-sets cityId to managedCityId
- Banners: Full CRUD with dialog forms, auto-sets cityId to managedCityId

### Tab 4: Payout History
- Fetches from `/api/payouts?userId={userId}`
- Table: Amount, UPI ID, Status, Date, Note
- Status badges: pending (yellow), approved (green), rejected (red), paid (blue)

### Updated `/src/components/dashboard-view.tsx`
- Added import for `CityAdminDashboard`
- Added conditional: `if (user?.role === 'city_admin') return <CityAdminDashboard />`

### Styling
- Royal Glassmorphism theme throughout
- Gold #D4AF37, Royal Blue #4169E1 colors
- GlassCard component with gold variant
- framer-motion animations for tab transitions
- Mobile responsive: desktop sidebar + mobile horizontal scrollable tabs
- All lint checks pass cleanly
