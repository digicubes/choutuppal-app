# Task ID: 3 — Dashboard View Complete Rewrite

## Agent: Main
## Status: ✅ Complete

## Summary
Completely rewrote `/home/z/my-project/src/components/dashboard-view.tsx` with all 5 tabs fully implemented, plus supporting API changes.

## Files Modified

### 1. `/home/z/my-project/src/components/dashboard-view.tsx` (COMPLETE REWRITE)
- **Tab 1: My Subscription**
  - Current plan display with active status badge & expiry date
  - 3 plan cards (Free ₹0, Pro ₹499/mo, Premium ₹999/mo) with full feature lists
  - Upgrade button calls `POST /api/subscriptions` with demo payment
  - Updates Zustand store on successful upgrade
  - Subscription history from `GET /api/subscriptions?userId=...`
  - Gold gradient "Upgrade Now" CTA for free users

- **Tab 2: Choutuppal Coins**
  - Large animated gold coin balance display
  - Daily Claim button → `POST /api/coins` with `dailyClaim` action
  - Earn categories: Daily Check-in (+10), Review (+15), Share (+5)
  - Spend categories: Coupons & Deals (-20), Premium Features (-50)
  - Transaction history with +/- indicators and timestamps
  - Scrollable lists with max height constraints

- **Tab 3: My Listings**
  - Grid of user listings as cards with status badges
  - Status badges: Pending (Yellow), Approved (Green), Featured (Green+Star)
  - "Add New Listing" button opens Dialog form with:
    - Name (required), Category (dropdown, required), Description (textarea)
    - WhatsApp Number, Image URL (text input), City (dropdown)
    - Submit calls `POST /api/listings`
  - "Edit" button opens same form pre-filled, calls `PUT /api/listings/[id]`
  - "View" button navigates to listing detail via Zustand store
  - Empty state with CTA

- **Tab 4: Lead Inbox (Mini CRM)**
  - Table with: Date, Customer, Phone (hidden on mobile), Requirement, Listing, Status
  - Status badges: New (Blue), Contacted (Yellow), Converted (Green)
  - Click to expand/collapse lead details
  - Expanded row shows full: Name, Phone, Listing, Source, Requirement, Date
  - New/Converted count badges at top
  - Uses `Fragment` with proper keys for table row pairs

- **Tab 5: My Mini-Website**
  - Only shows approved listings
  - QR Code via `qrcode.react` (QRCodeSVG component)
  - Auto-generated URL display (choutuppal.com/listing/{slug})
  - Total views count
  - "Copy Link" → clipboard
  - "Download QR" → renders SVG to canvas, downloads as PNG
  - "Share on WhatsApp" → opens wa.me link
  - "View" → navigates to listing
  - Empty state with contextual message

- **Listing Form Dialog**
  - Full Dialog with form for creating/editing listings
  - Proper validation (name + category required)
  - Loading state during submission
  - City selection only for new listings (can't change city on edit)
  - Auto-generates slug from name + timestamp

### 2. `/home/z/my-project/src/app/api/listings/route.ts` (MODIFIED)
- Added `userId` query parameter support
- When `userId` is provided: returns ALL listings for that user (including unapproved)
- When `userId` is NOT provided: only returns approved listings (existing behavior)

### 3. `/home/z/my-project/src/app/api/coins/route.ts` (MODIFIED)
- Changed 404 response for unknown users to return `{ balance: 0, transactions: [] }`
- Ensures dashboard works gracefully for demo/unregistered users

## UI Design
- Gold (#D4AF37) for primary actions, Royal Blue (#4169E1) for secondary
- GlassCard component (solid white on mobile, glass on desktop)
- Framer Motion: whileTap={{ scale: 0.95 }}, fadeIn transitions
- Mobile-first responsive: grid cols adapt, phone column hidden on mobile
- shadcn/ui: Tabs, Card, Button, Badge, Input, Label, Textarea, Select, Table, Dialog
- Lucide icons throughout
- Gold gradient buttons for CTAs

## Validation
- `bun run lint` — ✅ No errors
- Dev server compiles successfully
- Coins API returns 200 for demo user (was 404)
- Listings API supports userId filter
