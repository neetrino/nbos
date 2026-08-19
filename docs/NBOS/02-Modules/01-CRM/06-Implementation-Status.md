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

## Shipped — Lead intake attach and Lead merge

Canon: `07-Lead-and-Deal-Merge.md`. Runtime implements intake attach + Lead merge wizard. **Deal↔Deal merge is not a product feature** — not shipped, not planned.

- **Schema:** `Lead.mergedIntoId` (`20260819140000_crm_lead_merged_into`). No `MERGED` stage.
- **Intake attach:** `GET /crm/leads/duplicates` (phone / email / Instagram username / search). ATS exact-phone attach kept; lookup now excludes Spam, absorbed, and Trash. Meta ingest: if an open Lead already has this Instagram username (via its conversation), do not create a second Lead; a new dialog stays unlinked because Meta is 1:1. A Lead is created only when no open username match exists.
- **Manual create / phone-add:** yellow banner — Open / Attach / Create anyway; after adding a phone to a Lead that had none, offer merge (no auto-merge).
- **Lead merge:** `POST /crm/leads/:id/merge` wizard (search → survivor → conflicts → preview). Field picks; first-touch marketing (`createdAt`); notes append; ATS events move; Meta 1:1 reassign or unlink; extra contacts move; empty survivor Contact fills from absorbed (a different absorbed primary becomes extra). Absorbed → `mergedIntoId` + Profile A Trash. Audit `lead.merged`.
- **Blocks:** SQL / Deal on either side; already absorbed or trashed; Seller unless both `assignedTo` match; Marketing never. Head of Sales / CEO / Owner any.
- **Restore:** blocked when `mergedIntoId` is set (no un-merge in this slice).

Runtime notes (canon silent → safer):

- Frozen is not in `LeadStatusEnum`; attach treats only non-SQL / non-Spam as open.
- Owner is treated as CEO-equivalent for merge (not listed in canon §9).
- Lead has no files/links in the data model; merge does not move Drive assets.
- Status override cannot be Spam or SQL.
- Cross-channel without a shared phone / email / Instagram username still does not auto-attach.

## Out of scope / separate canon

- **Deal↔Deal merge** — consciously not built; duplicate Deals → Failed / Trash (existing flows).
- **Contact merge** — Clients canon (`../03-Clients/02-Contacts.md`); not a substitute for Lead merge.

## MVP assumptions (Trash)

- Operational delete = **Trash-first** (`09-Entity-Lifecycle-Standard.md`). Hard purge via retention job or `DELETE …/permanent` (relation guards).

## API routes (lifecycle + merge)

- `crm/leads`, `crm/deals` — list + `scope`; `DELETE` → Trash; `POST :id/restore`; `DELETE :id/permanent`.
- `GET /crm/leads/duplicates` — intake / phone-add / merge search candidates.
- `POST /crm/leads/:id/merge` — survivor path id; body `{ absorbedId, fieldChoices?, status? }`.

## Related code

- API: `apps/api/src/modules/crm/leads/`, `apps/api/src/modules/crm/deals/`
- Web: `apps/web/src/features/crm/`, `apps/web/src/lib/api/leads.ts`, `deals.ts`
