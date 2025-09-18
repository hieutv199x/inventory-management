# 9Connect — Project Overview

9Connect is a Next.js-based operations hub to manage TikTok Shop orders, fulfillment, finance touch points, and internal workflows. It adds domain features on top of a Tailwind/Next.js admin template.

What’s included
- Orders Management
  - Server-driven pagination, filters (shop, status/customStatus, date range), and keyword search
  - Status insight cards with backend counts and 1-click filtering
  - View order details; sync latest order detail
  - Add tracking (per package/provider), split orders into multiple packages
  - Custom internal statuses (e.g., DELIVERED, SPLITTED)
  - Unsettled transactions estimate display
- Logistics Integration
  - Shipping providers discovery via TikTok Logistics API
  - Response caching by shopId with Vercel-friendly headers (s-maxage, SWR)
- Bank Management
  - CSV import, assign to shops, audit history, details modal
  - Role-based actions (ADMIN/ACCOUNTANT) and debounced search with pagination
- Internationalization (en/vi) via LanguageContext
- Toast notifications, theme, loading overlay, and sidebar layout

Key app routes
- Orders: src/app/(admin)/orders/page.tsx
  - Uses httpClient to hit /orders endpoints and status-counts API
  - Status cards are clickable to set filter by status
- Bank: src/app/(admin)/(bank)/bank/page.tsx
  - CSV import, assign to shop, delete and details modals
- Layout: src/app/layout.tsx
  - Providers: Auth, Language, Theme, Loading, Sidebar + react-hot-toast

Important API routes
- TikTok Fulfillment (shipping providers)
  - src/app/api/tiktok/Fulfillment/shipping-provider/route.ts
  - Returns providers per shop (resolved via orderId); in-memory cache by shopId + Cache-Control s-maxage/SWR for Vercel
- Orders status counts
  - src/app/api/orders/status-counts/route.ts (if present)
  - Aggregates counts per TikTok status using current filters (shopId, time, keyword, customStatus)

SDKs (auto-generated)
- TikTok Shop SDK models: src/nodejs_sdk/...
- Amazon SP-API modules: src/amazon_sdk/...

Environment variables
- TIKTOK_BASE_URL: Optional TikTok API base URL
- TIKTOK_SHIPPING_PROVIDER_CACHE_TTL_S: Cache TTL for shipping providers (seconds, default 300)
- Prisma DATABASE_URL and usual Next.js envs

Local development
- Node 18+ (20+ recommended)
- npm install
- npm run dev
- Optional seed users: npx prisma db push && ts-node prisma/seed.ts

Deployment (Vercel)
- API responses use Cache-Control with s-maxage and stale-while-revalidate
- For best caching of shipping providers, call with shopId:
  - /api/tiktok/Fulfillment/shipping-provider?shopId=SHOP_ID
- In-memory cache is per instance; consider Redis/Vercel KV for multi-region consistency
