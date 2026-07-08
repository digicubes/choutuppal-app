# Task 2: use-domain-routing hook

## Summary
Created `src/hooks/use-domain-routing.ts` — a custom React hook that manages domain routing settings stored in LocalStorage, extending the existing `city-routing.ts` and `store.ts` system with subdomain mapping CRUD.

## What was implemented

### Types
- `SubdomainMapping` — with `id`, `cityName`, `subdomainPrefix`
- `DomainRoutingSettings` — composite of `baseDomain`, `isCustomDomainActive`, `subdomainMappings`

### LocalStorage Keys
- Reads `baseDomain` and `isCustomDomainActive` from `mana_routing_config` (via `getRoutingConfig`)
- Stores `subdomainMappings` in separate `mana_subdomain_mappings` key

### Hook Return Values
- **State**: `baseDomain`, `isCustomDomainActive`, `subdomainMappings`, `isLoaded`
- **Actions**: `saveBaseDomain`, `toggleCustomDomain`, `addMapping`, `updateMapping`, `deleteMapping`
- **Routing helper**: `getCityUrl(citySlug)` — returns subdomain URL or path-based URL per spec

### Hydration Safety
- Uses `useSyncExternalStore` pattern (React 19 compatible, passes strict lint rules)
- `isLoaded` starts as `false`, becomes `true` after lazy localStorage hydration
- `getServerSnapshot` returns defaults for SSR
- `getSnapshot` lazily hydrates on first client call

### Implementation Details
- `saveBaseDomain` and `toggleCustomDomain` sync to `mana_routing_config` via `saveRoutingConfig`
- Auto-generates `subdomainPrefix` from `cityName`: lowercase, spaces→hyphens, special chars removed
- Validates `subdomainPrefix`: lowercase alphanumeric + hyphens, 2–50 chars
- Module-level external store with listener pattern for `useSyncExternalStore`

### Lint Status
- Passes ESLint cleanly (0 errors, 0 warnings)
- Pre-existing errors in `super-admin-settings.tsx` are unrelated
