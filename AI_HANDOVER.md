# AI Handover Context & Knowledge Base
**Project:** BICS SUST Library Management System (Next.js 15/16 Canary + Supabase)
**Last Updated:** May 2026

Welcome to the BICS SUST LMS! This document is meant to provide you, the next AI agent, with a significant head start. Please read this carefully before modifying the codebase.

## 🚨 Critical Architecture Rules & Constraints
1. **Next.js Versioning & Caching (`use cache`)**
   - This project uses highly experimental Next.js 15/16 features, specifically the `"use cache"` directive and `cacheLife`.
   - **Cache Invalidation:** The old Next.js App Router caching (`revalidateTag` without a second argument) is DEPRECATED and causes spammy warnings/bugs. 
   - We now rely **exclusively on `updateTag(tag)`** from `"next/cache"` for instant read-your-writes invalidation. 
   - All invalidation logic lives in `server/cache-invalidation.ts`. If you add a new cache tag, make sure you update this file.
2. **Server Actions vs Client Components**
   - We heavily utilize Server Actions (in `server/transaction-actions.ts`, `server/library-actions.ts`).
   - Complex UI state (like `useTransition`, `useRouter`, `useSearchParams`) must be handled in designated `*Client.tsx` components.
   - All server operations use Supabase service-role clients or authenticated clients depending on the `getCaller()` context. Do not bypass auth checks for moderator/admin routes.

## 🎨 UI/UX & Design Guidelines (Strict)
1. **Mobile-First & Density:**
   - The UI is designed for high density, especially for the admin/moderator dashboards. 
   - Use `text-xs` for tables and lists, use `rounded-sm` (not `rounded-lg` or `rounded-xl`), and keep buttons compact.
   - For mobile constraints, we enforce a strict minimal horizontal margin strategy (`mx-1` or `px-2`) on mobile wrappers so horizontal space is not wasted.
2. **Animations (NO AOS):**
   - We **completely purged the `aos` library** from the dashboard. Do NOT reinstall or use AOS.
   - Rely strictly on Tailwind CSS transitions: `transition-colors duration-200` or `duration-300`.
   - For entry animations, if required, use standard Tailwind classes (e.g., `animate-in fade-in slide-in-from-bottom-2 duration-300`).
3. **Dynamic URLs (Query Params):**
   - Tab interfaces and interactive states must persist in the URL query string.
   - Example: The `/dashboard/transactions` tab uses `?tab=pending|active|history|pdf`.
   - Use `useSearchParams` and `router.replace(url, { scroll: false })` to sync state without reloading the page.

## 🐛 Recently Fixed Bugs & "Gotchas"
- **QR Code / Book ID System:** Book copy IDs are no longer restricted to 8 characters. We use a 6-character hex `short_id` for uniqueness. The Borrow scanner UI (`BorrowClient.tsx`) was updated to allow an input `maxLength` of 16 to accommodate physical scanner quirks.
- **URL Parameter Sync in Borrow Page:** The copy ID scanned automatically syncs with the URL `?copyId=...` to support deep linking directly to a book checkout.
- **Transactions History Missing PDFs:** The `historyTransactions` table initially only rendered Book Borrows/Returns. We had to specifically map `pdfSubmissions` (filtered by `approved` or `rejected`) into fake `Transaction`-like objects so they render beautifully inside the standard History tab.
- **User Profile Linking:** Within the transaction tables, we wrap the `tx.user.full_name` inside a Next.js `<Link>` pointing to `/dashboard/users/${tx.user.id}`. Maintain this pattern for any new tables created.

## 📂 Key Files to Know
- `types/library.ts`: Contains the source-of-truth TypeScript interfaces (`Transaction`, `PdfSubmission`, `Book`, `Copy`). Always check here if you need to map data!
- `server/cache-invalidation.ts`: The central hub for Next.js cache purging.
- `app/dashboard/(moderator-only)/transactions/TransactionsClient.tsx`: The heaviest client file managing the complex 4-tab admin interface for library actions.
- `app/dashboard/borrow/BorrowClient.tsx` & `ReturnClient.tsx`: The interfaces handling live physical QR scanning.

## 🚀 What To Do Next
1. When receiving a new task, always verify whether you need to touch Server Actions, Client UI, or Database schema.
2. If the user reports UI bugs on mobile, always check your Tailwind breakpoints (`sm:`, `md:`, `lg:`). The design must look perfect on small mobile screens.
3. If the user complains about "stale data" or things "not updating", check `server/cache-invalidation.ts` to ensure `updateTag()` is covering the tag they are fetching.

*Good luck, and build something awesome!*
