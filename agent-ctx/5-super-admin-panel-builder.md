# Task 5: Super Admin Panel Builder

## Task
Add Franchisee, Agent, Commission Engine, Financial Dashboard, and Location Manager tabs to Super Admin Panel

## Work Completed
- Added 5 new super_admin-only tabs to admin-view.tsx
- All tabs are gated behind `isSuperAdmin` check
- New tab keys: franchisee, agent-mgmt, commission, financial, locations
- Tabs appear BEFORE existing tabs in the TabsList

## Changes Made
1. **Lucide imports**: Added Landmark, UserPlus, Percent, Wallet, MapPin, IndianRupee, CreditCard, ArrowRightLeft, FileCheck, Pencil
2. **Interfaces**: Extended AdminRequestItem, added PlatformSettingItem, TransactionItem, PayoutRequestItem, LocationItem, AgentUser
3. **State variables**: 25+ new state variables across 5 tabs
4. **Fetch hooks**: 7 new useCallback fetch functions (franchisee, agent requests, approved agents, platform settings, transactions, payouts, locations)
5. **Action handlers**: 7 new handlers (franchisee approve/reject, agent approve/reject, save platform setting, payout approve/reject/paid, add/edit/delete location)
6. **TabsTrigger**: 5 new tab triggers with icons (Landmark, UserPlus, Percent, Wallet, MapPin)
7. **TabsContent**: 5 full tab content sections with tables, forms, dialogs, KPI cards

## API Endpoints Used
- GET /api/admin-requests?type=city_admin (Franchisee tab)
- GET /api/admin-requests?type=agent (Agent tab)
- PATCH /api/admin-requests/[id] (Approve/Reject both tabs)
- GET /api/admin/users?role=agent (Agent tab - approved agents)
- GET /api/platform-settings (Commission tab)
- PUT /api/platform-settings (Commission tab - save)
- GET /api/transactions (Financial tab)
- GET /api/payouts (Financial tab)
- PATCH /api/payouts (Financial tab - approve/reject/paid)
- GET /api/locations (Locations tab)
- POST /api/locations (Locations tab - add)
- PUT /api/locations (Locations tab - edit)
- DELETE /api/locations?id= (Locations tab - delete)

## Lint Status
All lint checks pass cleanly.
