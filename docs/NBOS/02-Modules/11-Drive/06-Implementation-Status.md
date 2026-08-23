# Drive module — implementation status (lifecycle slice)

Tracks **Trash / Purge** vs `04-Upload-Versioning-and-Lifecycle.md` and `07-Drive-Cleanup-Register.md`. Full Drive surface area remains in the Cleanup Register.

## Shipped (web + API) — Profile B Trash

- **Unified Trash:** `status=DELETED` + `deletedAt`; legacy `ARCHIVED` migrated to trash (`20260612160000`).
- **API:** move to Trash / unified restore; trash list via recoverable-trash where; scope-aware library queries.
- **Web:** single Trash view (Archive+Trash collapsed); Move to Trash / Restore.
- **Physical purge:** R2 delete + DB row purge past retention (`drive-trash-retention-purge.ops`).
- **Admin:** Drive Insights cleanup dashboard — review + confirmed apply (`Phase 6.5`).
- **Platform inventory:** `drive_file` category in `GET /platform/lifecycle/trash-inventory`.

## Durable artifact operation (2026-08-23)

Human upload sessions, version staging, `createGeneratedFileAsset`, External Agent
`tasks.attach_artifact`, and the Internal AI attach contract now persist a Drive
`FileArtifactOperation` before irreversible R2 upload. See
`04-Upload-Versioning-and-Lifecycle.md` §2.1 and
`../../21-AI-Platform/35-Post-Phase-1-Chat-3-Drive-Artifact-Lifecycle-Handoff.md`.

## Intentional placeholders / next slices

- Per-file `allowed-actions` in list menu — partial (detail sheet wired).
- Rich preview / extended export types — Cleanup Register backlog.

## API / jobs (lifecycle)

- Trash mutations on `fileAsset`; `POST /scheduler/platform-trash-purge` includes Drive batch.

## Related code

- API: `apps/api/src/modules/drive/`, `drive-trash-retention-purge.ops.ts`, `drive-cleanup-ui.ts`
- Web: `apps/web/src/features/drive/`
