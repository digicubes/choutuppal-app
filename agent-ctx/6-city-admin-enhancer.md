# Task 6: City Admin Dashboard Enhancement

## Summary
Enhanced the City Admin (Franchisee) Dashboard with 4 major improvements: Revenue Overview, Agent Management, Payout Flow, and Content Management.

## Changes Made

### File: `src/components/city-admin-dashboard.tsx`
- Complete rewrite from 1367 lines to enhanced version
- Added `RoyalCard` component for Royal Glassmorphism styling
- Added new imports: `useMemo`, Recharts components, new Lucide icons
- Added `PendingAgentRequest` interface
- Added state for pending agent requests and processing states

### Key Enhancements

1. **Revenue Tab**: 4 stat cards, commission breakdown with visual explanation, Recharts area chart for monthly trends, enhanced transactions table with buyer/agent commission columns

2. **Agents Tab**: Card-based grid layout, pending agent approval/reject section, detailed agent dialog

3. **Payouts Tab**: 3 summary cards, fixed status badge colors (approved=blue, paid=green), enhanced payout dialog with "Withdraw All" and "Use saved UPI"

4. **Content Tab**: City filtering preserved, city badge indicators added

## Lint Status: PASS
## Dev Server: Compiled successfully
