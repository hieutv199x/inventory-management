# 9Connect – AI agent playbook

Use these repo-specific guardrails to stay productive and aligned with existing patterns.

## System map
- Next.js 15 app router + React 19 + Tailwind UI, backed by Prisma (MongoDB) domains in `prisma/schema.prisma`.
- App shell lives in `src/app/layout.tsx`, wiring Auth/Language/Theme/Loading/Sidebar providers + toast; feature areas live under `src/app/(admin)/**` (orders, bank, products, fraud, etc.).
- Routing/auth: `src/middleware.ts` lets `/signin` and static assets through; everything else expects a Bearer token or `session_*` cookie and redirects on 401.
- Persistence relies on ObjectId strings; respect `@@map` names when touching collections.

## Frontend patterns
- When editing any label or copy, immediately add/update both EN and VI entries in `src/context/LanguageContext.tsx` (same key namespace) before using `t(...)` in components.
- Always call APIs through `httpClient` (`src/lib/http-client.ts`) so auth headers, JSON/form-data switching, and 401 redirects work automatically.
- Orders UI logic (`src/components/Orders/OrderDetailModal.tsx`) groups items by productId+skuId+sellerSku+packageId+isCancelled, ignores price in grouping, joins distinct sale prices, and flags cancelled rows via `order.channelData.cancelledLineItems`.
- Use `formatTikTokTimestamp` (`src/utils/datetime`) for TikTok epoch values and guard missing data with `'N/A'` to match existing degradations.
- Dropdown feeds (e.g., `src/components/header/NotificationDropdown.tsx`) expect paginated `/notifications` + PATCH mark-as-read; reuse this pattern for new notification-like UIs.
- Use `next/image` with hosts from `next.config.ts`; set `unoptimized` when rendering arbitrary TikTok URLs.

## API & domain rules
- API routes live in `src/app/api/**/route.ts`, return `{ data, error }`, and add `Cache-Control: s-maxage`/`stale-while-revalidate` where responses are reused (see shipping provider route).
- Resolve requester/org context via `verifyToken`, `getUserWithShopAccess`, `validateShopAccess` in `src/lib/auth.ts`; use these helpers whenever you need the access token, current user, or shop permissions instead of reimplementing lookups.
- When adding new functions, make sure they remain multi-tenant aware by threading the active `organizationId` through data access, validation, and responses.
- `channelData` blobs are provider JSON strings—always `try/catch` parse and null-guard optional properties before use.
- TikTok shipping provider endpoint (`src/app/api/tiktok/Fulfillment/shipping-provider/route.ts`) caches responses per `shopId` in-memory; include `shopId` in calls to avoid cache misses.

## Data & workflows
- `npm run build` already generates Prisma client; after schema edits run `npm run prisma:generate` and re-verify relation names/`@@map`s.
- Common scripts (see `package.json` & `src/scripts`): `npm run prisma:push`, `npm run prisma:seed`, `npm run validate-schema`, `npm run migrate-data`, `npm run verify-migration`, plus targeted fixes like `npm run repair:orders-org`.
- Seeds/maintenance scripts use `tsx`; ensure Node 18+ (20 preferred) and `DATABASE_URL` + TikTok envs (`TIKTOK_BASE_URL`, `TIKTOK_SHIPPING_PROVIDER_CACHE_TTL_S`) are set.

## Localization & UX conventions
- Never hardcode UI strings—add keys (EN + VI) in `src/context/LanguageContext.tsx` and access them via `const { t } = useLanguage()` with namespaced keys (e.g., `orders.sla.pickup_cutoff`).
- Preserve graceful fallbacks: components expect missing data to show `'N/A'`, avoid crashes, and respect Tailwind utility styling already in place.

## Reference implementations
- Orders dashboard (`src/app/(admin)/orders/page.tsx`) demonstrates query param wiring, httpClient usage, status cards, and sync flows.
- Follow modal/detail ergonomics in `OrderDetailModal` for package grouping, copy-to-clipboard, and status badge coloring when creating new detail views.
