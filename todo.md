# Work Space — Product tab: TanStack Query + backend endpoint

## Goal

Replace interim `resolveProductWorkSpace` (GET list → POST ensure) and manual tab cache with TECH_CARD-standard server state.

## Plan

- [x] **1. Backend** — `GET /api/tasks/work-spaces/by-product/:productId` (VIEW, 404 if missing)
- [x] **2. Web API** — `tasksApi.getWorkSpaceByProductId`
- [x] **3. TanStack Query** — provider in app shell + `@tanstack/react-query` dependency
- [x] **4. Query layer** — `product-work-space-queries.ts` (keys, fetch bundle, 404 → ensure)
- [x] **5. Hook** — rewrite `useProductWorkSpaceTab` on `useQuery` + cache updates for tasks/sprints
- [x] **6. Cleanup** — remove `resolveProductWorkSpace` workaround from `work-space-utils.ts`
- [ ] **7. Follow-up (later)** — `workSpaceId` on `GET /products/:id`; standalone `/work-spaces/[id]` on Query; invalidate on task mutations

## Out of scope (this slice)

- Full tasks module migration to TanStack Query
- Changing `POST ensure` semantics on backend (legacy attach stays on ensure only)
