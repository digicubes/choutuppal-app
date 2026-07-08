# Task 3 - Social API Routes - Work Record

## Agent: social-api-builder
## Task: Create all social feature API routes

## Files Created

1. `/src/app/api/social/posts/route.ts` - Posts feed (GET) and create (POST)
2. `/src/app/api/social/posts/[id]/route.ts` - Single post (GET), soft delete (DELETE), pin/unpin (PATCH)
3. `/src/app/api/social/comments/route.ts` - Create comment (POST)
4. `/src/app/api/social/likes/route.ts` - Check like (GET), toggle like (POST)
5. `/src/app/api/social/follows/route.ts` - Check follow (GET), toggle follow (POST)
6. `/src/app/api/social/profiles/route.ts` - Get profiles (GET), upsert profile (POST)
7. `/src/app/api/social/verification/route.ts` - List requests (GET), apply (POST)
8. `/src/app/api/social/verification/[id]/route.ts` - Approve/reject (PATCH)

## Key Design Decisions

- All count operations (likes, comments, followers) use Prisma `$transaction` for atomicity
- Like and follow endpoints use "toggle" pattern — single endpoint for both create/delete
- Profile auto-creation on post creation and follow operations ensures no orphan data
- Verification approval auto-updates profile (isPublicFigure, isVerified, publicFigureCategory)
- Posts feed orders by isPinned DESC then createdAt DESC
- Soft delete uses isDeleted flag, all queries filter out deleted posts
- Ownership/admin checks for DELETE and PATCH on posts
- SQLite-compatible: uses findUnique + create/update pattern instead of native upsert

## Verification

- ESLint passes with no errors
- All 8 route files compile successfully
- Dev server shows no errors related to these routes
