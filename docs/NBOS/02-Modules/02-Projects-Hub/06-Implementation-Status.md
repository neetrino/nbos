# Projects Hub — implementation status

Tracks **shipped runtime** vs `01-Project-Hub-Overview.md` and delivery canon. Broader migration history: `06-Projects-Hub-Cleanup-Register.md`.

## Shipped (web + API) — Project Hub list views

- **API:** `GET /projects?hubView=` `incoming` / `active` / `closed` on non-trash scope. Trash + `hubView` is ignored. No `Project.status` column.
- **Rules:** Incoming = no Product/Extension. Active = open delivery (`deliveryResolution` null and legacy status not `DONE`/`LOST`) or live maintenance (`MAINTENANCE_ONLY` / `DEV_AND_MAINTENANCE` + `PENDING`/`ACTIVE`). Closed = has children, no open delivery, no live maintenance.
- **Web:** Hub tabs `All | Incoming | Active | Closed | Trash`; default tab Active.

## Shipped (web + API) — Project Trash (Profile A)

- **Schema:** `projects.trashed_at`; legacy `is_archived` **dropped** (`20260612200000`).
- **API:** `GET /projects?scope=active|trash` (default active); `DELETE /projects/:id` → Trash; `POST /projects/:id/restore`; `DELETE /projects/:id/permanent`.
- **Web:** Hub directory **Trash** tab; project detail — Move to Trash / Restore / **Delete permanently**; delivery board and portfolio/shells exclude trashed projects.
- **Automated purge:** past retention via unified platform purge (relation guards on Project).

## Shipped — Product / Extension (Profile A-lite)

- **No hard DELETE** on Product/Extension — terminal delivery status (`DONE` / `CANCELLED` / cancel flows) only.
- `deliveryLifecycle` projection on list/detail APIs.

## Intentional placeholders / next slices

- Delivery stage-gate / board UX gaps — see Cleanup Register.

## MVP assumptions (Trash)

- **Project** = recoverable Trash (`trashedAt`). **Product/Extension** = operational terminal states, not vault-style Trash.

## API routes (lifecycle)

- `projects` — list `scope` + `hubView`; `DELETE` → Trash; `POST :id/restore`; `DELETE :id/permanent`.

## Related code

- API: `apps/api/src/modules/projects/projects.service.ts`, `projects.controller.ts`
- Web: `apps/web/src/features/projects/`, `apps/web/src/lib/api/projects.ts`
