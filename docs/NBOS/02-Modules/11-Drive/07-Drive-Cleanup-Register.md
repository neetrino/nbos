# Drive Cleanup Register

> Что уже совпадает с новым Drive-каноном, что устарело в документации/коде, и что нужно переделать при реализации.

## 1. Current State Summary

Текущий runtime Drive реализован как простой R2 project folder browser:

- API работает с `Drive/projects/{projectId}/`;
- UI показывает список проектов слева;
- можно list/upload/download/delete files;
- нет database-backed `File Asset`;
- нет entity links;
- нет версий;
- нет purpose;
- нет logical libraries;
- нет cleanup/export/backup;
- permissions только module-level через `DRIVE VIEW/ADD/DELETE`.

Это полезный MVP-хвост, но не соответствует целевому Drive.

---

## 2. Already Compatible

| Area                           | Status    | Notes                                                    |
| ------------------------------ | --------- | -------------------------------------------------------- |
| R2 / S3-compatible storage     | `PARTIAL` | Можно сохранить как storage backend                      |
| Presigned upload/download URLs | `PARTIAL` | Правильная техника, но нужна upload session + File Asset |
| Project file listing           | `PARTIAL` | Может стать Project Library view, но не source of truth  |
| Drive sidebar in UI            | `PARTIAL` | Можно развить в Libraries navigation                     |

---

## 3. Runtime Gaps

| Gap                             | Status    | Needed                                               |
| ------------------------------- | --------- | ---------------------------------------------------- |
| `FileAsset` model               | `MISSING` | Add DB model                                         |
| `FileVersion` model             | `MISSING` | Versioning                                           |
| `FileLink` model                | `MISSING` | Links to Deal/Product/Invoice/Task/etc.              |
| `FileAuditEvent` model          | `MISSING` | Audit                                                |
| `ExportJob` model               | `MISSING` | ZIP/backup/export                                    |
| Purpose metadata                | `MISSING` | Offer, payment proof, task attachment, etc.          |
| Logical Libraries               | `MISSING` | Deal/Product/Client/Finance/Partner/Work Space views |
| Entity upload context           | `MISSING` | Upload from any card creates contextual link         |
| Task/Work Space retention       | `MISSING` | Cleanup for temporary task files                     |
| Finance restricted files        | `MISSING` | Confidential permissions                             |
| Partner/client portal readiness | `MISSING` | Visibility flags                                     |
| Safe delete/unlink/archive      | `MISSING` | Avoid deleting shared files                          |
| Backup/export manifest          | `MISSING` | Human usable backup                                  |
| Cleanup dashboard               | `MISSING` | Storage management                                   |

---

## 4. Docs Cleanup

Old `01-Drive-Overview.md` described Drive mostly as folders:

- Project folders;
- Client Library;
- Company Library;
- Personal Drive;
- Quick Attach.

This has been replaced by the new canon:

- File Asset;
- File Link;
- logical Libraries;
- R2 physical storage;
- export/backup;
- cleanup;
- module integrations.

Future docs should not describe Drive as only `Project Folders`.

---

## 5. Runtime Refactor Backlog

### Phase 1 - Data Foundation

1. Add `FileAsset`.
2. Add `FileVersion`.
3. Add `FileLink`.
4. Add `FileAuditEvent`.
5. Add enums for file type, purpose, visibility, status, confidentiality.
6. Add storage key naming policy.

### Phase 2 - Upload API

1. Replace direct project upload with upload session.
2. Support `source_entity_type` and `source_entity_id`.
3. Create FileAsset after successful upload.
4. Create FileLink automatically.
5. Add checksum and duplicate detection.
6. Write audit events.

### Phase 3 - Libraries UI

1. Replace project-only Drive UI with Libraries navigation.
2. Add Project/Product/Client/Finance/Partner/Work Space views.
3. Add file detail drawer.
4. Add links list on file detail.
5. Add version history.
6. Add filters by purpose/type/entity/date/uploader.

### Phase 4 - Module Integrations

1. CRM Offer Materials use Drive.
2. Deal Won links approved offer to Project/Product/Client.
3. Tasks attachments use Drive.
4. Work Space Library uses Drive.
5. Finance documents use Drive with restricted permissions.
6. Support Ticket attachments use Drive.
7. Partner Agreements use Drive.
8. Client Portfolio Files tab uses Drive.

### Phase 5 - Export And Cleanup

1. Add Export Jobs.
2. Add ZIP generation.
3. Add export manifest.
4. Add cleanup candidates.
5. Add task attachment cleanup rules.
6. Add archive/trash/purge lifecycle.
7. Add admin storage dashboard.

---

## 6. Current Code References

Runtime areas to refactor:

- `apps/api/src/modules/drive/drive.service.ts`
- `apps/api/src/modules/drive/drive.controller.ts`
- `apps/web/src/lib/api/drive.ts`
- `apps/web/src/app/(app)/drive/page.tsx`
- `packages/database/prisma/schema.prisma`

These files currently implement project-folder behavior and should be treated as `PARTIAL`, not final Drive architecture.
