# Drive module — implementation status (lifecycle slice)

Tracks **Trash / Purge** vs `04-Upload-Versioning-and-Lifecycle.md` and `07-Drive-Cleanup-Register.md`. Full Drive surface area remains in the Cleanup Register.

## Shipped (web + API) — Profile B Trash

- **Unified Trash:** `status=DELETED` + `deletedAt`; legacy `ARCHIVED` migrated to trash (`20260612160000`).
- **API:** move to Trash / unified restore; trash list via recoverable-trash where; scope-aware library queries.
- **Web:** single Trash view (Archive+Trash collapsed); Move to Trash / Restore.
- **Physical purge:** R2 delete + DB row purge past retention (`drive-trash-retention-purge.ops`).
- **Admin:** Drive Insights cleanup dashboard — review + confirmed apply (`Phase 6.5`).
- **Platform inventory:** `drive_file` category in `GET /platform/lifecycle/trash-inventory`.

## Intentional placeholders / next slices

- Per-file `allowed-actions` in list menu — partial (detail sheet wired).
- Rich preview / extended export types — Cleanup Register backlog.

## API / jobs (lifecycle)

- Trash mutations on `fileAsset`; `POST /scheduler/platform-trash-purge` includes Drive batch.

## Related code

- API: `apps/api/src/modules/drive/`, `drive-trash-retention-purge.ops.ts`, `drive-cleanup-ui.ts`
- Web: `apps/web/src/features/drive/`
