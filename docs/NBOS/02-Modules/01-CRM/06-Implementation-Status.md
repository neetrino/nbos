# CRM module — implementation status

Tracks **shipped runtime** vs canon in `01-CRM-Overview.md`, pipelines, and stage gates. For legacy cleanup gaps see `06-CRM-Cleanup-Register.md`.

## Shipped (web + API) — lifecycle

- **Profile A Trash** on Lead and Deal: `trashed_at` columns (`20260612130000_crm_lead_deal_trash_lifecycle`).
- **API:** `GET /crm/leads`, `GET /crm/deals` with `?scope=active|trash` (default active); `DELETE :id` → move to Trash; `POST :id/restore`; `DELETE :id/permanent` → manual purge (trashed-only, relation guards, audit `lead|deal.permanently_deleted`).
- **Web:** Leads/Deals list views with scope switch; sheets — Move to Trash / Restore / **Delete permanently** (trash scope); trash rows read-only in sheets (no stage change).
- **Stats / pipeline:** trashed rows excluded from active pipeline and dashboard scope stats (R1).
- **Automated purge:** eligible past 30d via `POST /scheduler/platform-trash-purge` with Profile A relation guards + audit `*.retention_purged`.

## Shipped (other — partial)

- Lead/Deal CRUD, pipelines, stage gates, Deal Won handoff, marketing attribution fields — see `06-CRM-Cleanup-Register.md` §A.

## Intentional placeholders / next slices

- **Kanban trash column** — list-only trash view today; board trash tab optional later.
- Stage-gate / Won / Offers gaps — see Cleanup Register §B–C.

## MVP assumptions (Trash)

- Operational delete = **Trash-first** (`09-Entity-Lifecycle-Standard.md`). Hard purge via retention job or `DELETE …/permanent` (relation guards).

## API routes (lifecycle)

- `crm/leads`, `crm/deals` — list + `scope`; `DELETE` → Trash; `POST :id/restore`; `DELETE :id/permanent`.

## Related code

- API: `apps/api/src/modules/crm/leads/`, `apps/api/src/modules/crm/deals/`
- Web: `apps/web/src/features/crm/`, `apps/web/src/lib/api/leads.ts`, `deals.ts`
