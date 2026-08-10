# Internal Messenger Implementation Progress

## Current Phase

Phase 6+ — Unified API cutover + L1/L2 Internal Messenger UI (complete for Internal zone)

## Completed

### Phase 3 — Unified schema foundation

- Unified Prisma models and additive migration

### Phase 4 — Live security hardening

- Legacy channel/DM ACL, WS permission checks, Drive LINK attach validation

### Phase 5 — Backfill + parity verification

- Mapping, idempotent backfill, parity verifier, CLI (`pnpm messenger:backfill:*`)

### Phase 6 — Unified conversation cutover (this slice)

- Entity ACL via project/product/deal/task participation graphs
- Canonical `ensure` for PROJECT_GENERAL / PRODUCT / DEAL / TASK / DIRECT
- REST:
  - `GET /messenger/internal/entities?tab=`
  - `GET /messenger/internal/conversations`
  - `POST /messenger/conversations/ensure`
  - `GET|POST /messenger/conversations/:id/...`
  - `GET /messenger/internal/search`
- WS: subscribe/typing/message/peer_read on conversation rooms
- Legacy channel/DM dual-write into unified when ids match backfill
- Web `/messenger`: Internal tabs All | Deal | Project | Dev | Tasks + L1 entities + L2 topics + active chat

## Explicitly Not Completed

- removal of legacy channel/DM tables
- External Messenger (CRM Inbox / WhatsApp) — placeholder zone only
- Favorites / Collections
- production apply of migration/backfill on deployed environments
- Task card / Product page embedded chat panels (API ready via ensure)

## Migration Safety

- Legacy tables remain for dual-compat; live Internal UI reads/writes unified tables
- Ensure is lazy (no bulk invent of Product/Deal/Task chats)
