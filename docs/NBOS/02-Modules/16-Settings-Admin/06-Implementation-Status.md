# Settings / Admin — implementation status (platform lifecycle)

Tracks **global Trash admin** shipped in Phase 7. Full Settings canon: `00-Settings-Admin-Overview.md`; other gaps: `99-Settings-Admin-Cleanup-Register.md`.

## Shipped — Trash inventory & retention (Phase 7.2–7.4)

- **Web:** Settings → **Trash inventory** (`/settings/trash-inventory`) — per-module counts, retention days, purge-eligible counts, links to module Trash views.
- **API inventory:** `GET /platform/lifecycle/trash-inventory` (`COMPANY VIEW`).
- **Retention rules:** `GET /platform/lifecycle/retention-rules` — registry + env `PLATFORM_TRASH_RETENTION_DAYS_*`.
- **Unified purge:** `POST /platform/lifecycle/purge/run` (`COMPANY EDIT`); scheduler `POST /scheduler/platform-trash-purge`.
- **Purge scope:** Credentials, Drive files, Mail threads, Profile A entities (Contact, Company, Lead, Deal, Partner, Project) with relation guards.
- **Audit:** `platform.trash_retention_purge_run` + per-entity `*.retention_purged` events.

## Intentional placeholders / next slices

- Admin UI to **edit** retention per entity (env-only today).
- Per-module **permanent-delete UI** from inventory (Profile A API shipped; web controls backlog).
- Broader Settings RBAC/audit gaps — Cleanup Register.

## Related code

- API: `apps/api/src/modules/platform-lifecycle/`
- Web: `apps/web/src/features/settings/components/PlatformTrashInventoryPanel.tsx`
- Index: `docs/NBOS/03-Business-Logic/10-Platform-Lifecycle-Implementation-Status.md`
