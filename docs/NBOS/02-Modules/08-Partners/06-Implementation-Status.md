# Partners module — implementation status

Tracks **shipped runtime** vs `00-Partners-Overview.md`. Accrual/payout gaps: `08-Partners-Cleanup-Register.md`.

## Shipped (web + API) — lifecycle

- **Profile A Trash:** `partners.trashed_at` (`20260612150000_partner_trash_lifecycle`).
- **API:** `GET /partners?scope=active|trash`; `DELETE :id` → Trash; `POST :id/restore`; `DELETE :id/permanent` (trashed-only, guards, audit); mutations blocked on trashed rows.
- **Web:** Partners list Trash scope; Move to Trash / Restore / **Delete permanently** in detail sheet.
- **Stats:** active partners only (`trashedAt IS NULL`).
- **Automated purge:** unified platform job + Profile A guards.

## Intentional placeholders / next slices

- Full accrual/payout/portal slices — see Cleanup Register and overview §8.

## API routes (lifecycle)

- `partners` — list `scope`; `DELETE` → Trash; `POST :id/restore`; `DELETE :id/permanent`.

## Related code

- API: `apps/api/src/modules/partners/`
- Web: `apps/web/src/features/partners/`, `apps/web/src/lib/api/partners.ts`
