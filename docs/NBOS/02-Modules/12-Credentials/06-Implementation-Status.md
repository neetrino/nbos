# Credentials module — implementation status

Tracks **shipped runtime** vs `01-Credentials-Vault.md` and UX canon. Full cleanup matrix: `99-Credentials-Cleanup-Register.md`.

## Shipped (web + API) — Trash / folders (Profile C)

- **Trash column:** `credentials.trashed_at` (renamed from `archived_at`, `20260612200000`).
- **Vault context:** flat Trash view — `scope=active|trash` on list API; transitional `includeArchived` deprecated.
- **Trash side-effects:** folder memberships + favorites cleared on move to Trash (single + bulk).
- **Folders:** Model 6 empty-only delete; Model 5 `POST …/folders/:id/remove-grouping`; `credential_folders.archived_at` dropped.
- **Restore:** returns credential to vault **unfiled** (no auto-folder).
- **Permanent delete:** `DELETE …/permanent` for trashed rows only + name confirmation + audit.
- **Retention purge:** `credential.retention_purged` via scheduler / unified platform purge (30d TTL, env overrides).

## Shipped (security — partial)

- Tiered reveal/copy, vault session, export step-up, RBAC visibility — see Cleanup Register §Runtime.
- **Offboarding access revoke:** on `POST /employees/:id/offboard` — revokes credential `ResourceAccessGrant`, clears `allowedEmployees` (SECRET), removes vault favorites; audit `credential.access_revoked` per affected credential (`credential-offboarding-revoke.ops.ts`).

## Intentional placeholders / next slices

- Emergency access, access requests; offboarding rotation task automation — Cleanup Register.
- Admin cleanup dashboard for credentials — optional; platform trash inventory covers counts.

## MVP assumptions (Trash)

- UI/API wording **Trash** (not Archive). Provider catalog `archivedAt` is separate (catalog deactivate).

## API routes (lifecycle)

- `credentials` — `?scope=active|trash`; archive/restore mutations; `DELETE …/permanent` (trashed only).
- `credentials/folders` — empty-only delete; remove-grouping.

## Related code

- API: `apps/api/src/modules/credentials/`
- Web: `apps/web/src/features/credentials/`, `apps/web/src/lib/api/credentials.ts`
