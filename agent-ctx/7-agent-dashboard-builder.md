# Task 7 — Agent Dashboard Builder

## Task
Build Agent Dashboard with Earnings, Add Business, Referrals, and Payout tabs

## Work Completed

### Files Created
- `/src/components/agent-dashboard.tsx` — Full agent dashboard component with 4 tabs

### Files Modified
- `/src/app/api/listings/route.ts` — Added referredByAgentId support in GET filter and POST create
- `/src/app/page.tsx` — Added AgentDashboard import and agent role routing

### Component Details

**Tab 1: Earnings Overview**
- Gold GlassCard showing total earnings (₹ symbol), pending payout
- "Request Payout" button that opens a Dialog with UPI ID input and amount field
- POST /api/payouts for payout requests
- Two stat cards side by side: Listing Commissions, Banner Commissions (count + amount)
- Recent Earnings list (last 10 agent transactions from /api/transactions?agentId={userId})

**Tab 2: Add Business**
- Form with: Business Name, Category (dropdown), Description, WhatsApp Number, City (dropdown), Images (MultiMediaUploader)
- "Referred by Me" checkbox (checked by default, uses Checkbox component from shadcn/ui)
- On submit: POST /api/listings with referredByAgentId set to agent's userId
- After creation: POST /api/transactions with agent's ID as both userId and agentId

**Tab 3: My Referrals**
- Table: Business Name, Category, Status (Approved/Pending with badges), Commission Earned
- Fetches from /api/listings?referredByAgentId={userId}

**Tab 4: Payout History**
- Table: Amount, UPI ID, Status, Date, Note
- Status badges: pending (yellow), approved (green), rejected (red), paid (blue)
- Fetches from /api/payouts?userId={userId}

### Styling
- Royal Glassmorphism: GlassCard component with gold variant
- Colors: Gold #D4AF37, Royal Blue #4169E1
- Desktop: vertical sidebar tabs | Mobile: horizontal scrollable tabs
- framer-motion animations throughout
- Toast notifications via sonner

### API Changes
- GET /api/listings now supports `referredByAgentId` query parameter
- POST /api/listings now saves `referredByAgentId` field
- Agent referral listings show both approved and pending status

### Integration
- page.tsx ProtectedDashboard checks `user?.role === 'agent'` and renders `<AgentDashboard />` instead of `<DashboardView />`

### Lint Status
- All lint checks pass cleanly
