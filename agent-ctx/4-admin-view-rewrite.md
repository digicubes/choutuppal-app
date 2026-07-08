# Task 4: Admin View Complete Rewrite

## Agent: admin-view-rewrite
## Date: 2026-03-04

## Summary
Complete rewrite of `/home/z/my-project/src/components/admin-view.tsx` with all 7 tabs fully implemented. No placeholders.

## Changes Made

### File Modified
- `src/components/admin-view.tsx` — Complete rewrite (~900 lines)

### Tab 1: Overview Dashboard
- 4 stat cards: Total Users, Active Subscriptions, Total Revenue (₹), Total Leads
- User Growth line chart (Recharts LineChart) showing last 6 months
- Revenue over time bar chart (Recharts BarChart) showing last 6 months
- Leads by Status horizontal progress bars with animated fills
- Subscriptions by Plan breakdown
- Fetches from `GET /api/stats`

### Tab 2: Multi-City Manager
- Add city form: Name (auto-generates slug), Slug, State, Hero Image URL
- Cities table with: Name, Slug, State, Listings count, Users count
- Delete city button with confirmation Dialog
- Fetches from `GET /api/cities`, `POST /api/cities`, `DELETE /api/cities?id=...`

### Tab 3: Listing Moderation
- Two sub-tabs (Tabs component): Business Listings & Real Estate Listings
- Filter dropdown: All, Pending, Approved, Featured, Premium
- Business Listings table: Image thumbnail, Name, City, Category, Status badge, Owner
- Real Estate Listings table: Image, Title, City, Price, Status, Owner
- Action buttons: Approve (green), Reject (red, with reason Dialog), Feature/Unfeature, Make Premium
- Fetches from `GET /api/admin/listings?status=...&limit=50`, `GET /api/admin/realestate?status=...`
- Actions call `PATCH /api/admin/listings` and `PATCH /api/admin/realestate`

### Tab 4: Lead CRM
- Global view of ALL leads across platform
- Table: Lead ID (shortened), Property/Business Name, Customer Phone, Requirement, Source, Status, Date
- Status filter dropdown (All, New, Contacted, Converted, Lost)
- Export as CSV button — triggers download from `GET /api/admin/leads/export`
- Fetches from `GET /api/leads`

### Tab 5: Content CMS (News & Blogs)
- TipTap rich text editor with toolbar (Bold, Italic, Heading 2, Link, Bullet List, Ordered List)
- Placeholder supports Telugu typing
- Form fields: Title, City (dropdown from /api/cities), Content (TipTap), Image URL, Source, Published toggle (Switch)
- Auto-Affiliate note displayed to user
- List of existing news articles with: Title (with image), City, Published status, Date, Edit/Delete buttons
- Create: `POST /api/admin/news`, Update: `PUT /api/admin/news`, Delete: `DELETE /api/admin/news?id=...`
- Fetch all: `GET /api/admin/news?all=true`
- Edit mode: loads content into TipTap editor, switches button to "Update Article"
- Cancel edit returns to create mode

### Tab 6: Gamification Manager
- Coin Values section: Editable fields for Daily Check-in (5), Review (10), Share (3) + Save button
- Spin Wheel Prizes grid: Label, Type, Value, Probability (%), Color swatch, Active/Inactive Switch
- Add Prize button opens animated form: Label, Prize Type (coins/discount/free_listing/none), Value, Probability, Color picker
- Edit/Delete buttons per prize with confirmation dialogs
- Toggle active/inactive with Switch
- Fetches from `GET /api/admin/spin-prizes`, Create/Update/Delete via same endpoint

### Tab 7: Global Site Settings
- App Logo URL input + preview
- Hero Background Image URL input + preview
- Broadcast Notification: text input + "Send to All" button, shows subscriber count confirmation
- SOS Emergency Contacts: Ambulance (108), Police (100), Fire (101), Women Helpline (181)
- Custom SOS contacts: add/remove Name + Phone pairs
- General Settings: Hero Headline, Hero Description, Affiliate Base URL, Primary Color, Accent Color (with color swatches)
- Save Settings button
- Fetches from `GET /api/settings`, saves via `PUT /api/settings`
- Broadcast via `POST /api/admin/broadcast`

## Key Design Decisions
- Used `useEditor` from TipTap with StarterKit, Link, and Placeholder extensions
- Editor content synced via `onUpdate` callback and `useEffect` for edit mode
- Used AnimatePresence for prize form show/hide animation
- All Dialog confirmations use shadcn Dialog component
- Mobile-first responsive with grid breakpoints (grid-cols-1 → sm:grid-cols-2 → lg:grid-cols-4)
- Gold (#D4AF37) gradient for primary actions, Royal Blue (#4169E1) for secondary
- Framer Motion `whileTap` on buttons, `fadeIn` animation on stat cards

## Verification
- `bun run lint` — passed with no errors
- Dev server compiles successfully
- All API endpoints match existing route handlers
