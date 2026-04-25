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

### 1.1. Что важно не потерять

Текущая реализация всё равно полезна как technical spike:

- R2 / S3-compatible client уже подключён;
- presigned URL pattern правильный;
- upload/download через browser напрямую в R2 можно сохранить;
- Drive уже зарегистрирован как backend module;
- UI page уже существует и может быть переработана, а не создана с нуля.

Но текущая модель должна стать storage adapter, а не бизнес-моделью Drive.

---

## 2. Already Compatible

| Area                           | Status    | Notes                                                    |
| ------------------------------ | --------- | -------------------------------------------------------- |
| R2 / S3-compatible storage     | `PARTIAL` | Можно сохранить как storage backend                      |
| Presigned upload/download URLs | `PARTIAL` | Правильная техника, но нужна upload session + File Asset |
| Project file listing           | `PARTIAL` | Может стать Project Library view, но не source of truth  |
| Drive sidebar in UI            | `PARTIAL` | Можно развить в Libraries navigation                     |

---

## 3. Runtime Gaps By Layer

### 3.1. Database / Prisma

| Gap                         | Status    | Needed                                                          |
| --------------------------- | --------- | --------------------------------------------------------------- |
| `FileAsset` model           | `MISSING` | Central file metadata, status, visibility, purpose              |
| `FileVersion` model         | `MISSING` | Version history with storage key and checksum                   |
| `FileLink` model            | `MISSING` | Links to Deal/Product/Invoice/Task/Work Space/etc.              |
| `FilePermission` model      | `MISSING` | Explicit grants and restrictions                                |
| `FileAuditEvent` model      | `MISSING` | File-specific audit, or strict convention on existing AuditLog  |
| `ExportJob` model           | `MISSING` | ZIP/backup/export lifecycle                                     |
| `CleanupCandidate` model    | `MISSING` | Cleanup review queue                                            |
| File relations on core data | `MISSING` | Employee uploaded files, Project/Product/Deal/Task linked files |

### 3.2. Backend API

| Gap                  | Status    | Needed                                                |
| -------------------- | --------- | ----------------------------------------------------- |
| Upload session       | `MISSING` | Create metadata before/after R2 upload safely         |
| Entity-aware upload  | `MISSING` | `entity_type`, `entity_id`, `purpose`, `visibility`   |
| File list by library | `MISSING` | Query files by logical library, not only project path |
| File detail          | `MISSING` | Metadata, versions, links, audit, permissions         |
| Version upload       | `MISSING` | Add version to existing File Asset                    |
| Link/unlink API      | `MISSING` | Connect file to additional entities without copying   |
| Safe delete API      | `MISSING` | Unlink/archive/soft-delete/hard-delete separation     |
| Export API           | `MISSING` | Create export job, generate ZIP + manifest            |
| Cleanup API          | `MISSING` | Find candidates, approve archive/delete               |
| Permission resolver  | `MISSING` | Entity-aware access check                             |

### 3.3. Frontend UI

| Gap                  | Status    | Needed                                                   |
| -------------------- | --------- | -------------------------------------------------------- |
| Libraries navigation | `MISSING` | Deals, Projects, Products, Clients, Finance, Partners... |
| File detail drawer   | `MISSING` | Links, versions, permissions, audit                      |
| Entity quick attach  | `MISSING` | Reusable upload component for cards                      |
| Purpose selector     | `MISSING` | Offer, Proof, Design, Delivery, Task Attachment, etc.    |
| Contextual file tabs | `MISSING` | Files tab in Product, Client Portfolio, Finance cards    |
| Export UI            | `MISSING` | Export by project/client/purpose/period                  |
| Cleanup dashboard    | `MISSING` | Orphans, old task files, drafts, storage usage           |
| Preview support      | `MISSING` | PDF/image/video/code previews                            |
| Permission badges    | `MISSING` | Finance restricted, client visible, partner visible      |
| Last selected view   | `MISSING` | Remember grid/list/table per user where useful           |

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

Recommended initial Prisma shape:

```prisma
model FileAsset {
  id              String   @id @default(uuid())
  displayName     String   @map("display_name")
  originalName    String?  @map("original_name")
  fileType        String   @map("file_type")
  purpose         String?
  sourceModule    String?  @map("source_module")
  status          String   @default("ACTIVE")
  visibility      String   @default("INTERNAL")
  confidentiality String   @default("NORMAL")
  storageProvider String   @default("R2") @map("storage_provider")
  storageKey      String?  @map("storage_key")
  mimeType        String?  @map("mime_type")
  sizeBytes       BigInt?  @map("size_bytes")
  checksum        String?
  ownerId         String?  @map("owner_id")
  currentVersionId String? @map("current_version_id")
  deletedAt       DateTime? @map("deleted_at")
  archivedAt      DateTime? @map("archived_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
}
```

This shape should be converted to enums when implementation starts. Strings are shown here only to explain the minimum fields.

### Phase 2 - Upload API

1. Replace direct project upload with upload session.
2. Support `source_entity_type` and `source_entity_id`.
3. Create FileAsset after successful upload.
4. Create FileLink automatically.
5. Add checksum and duplicate detection.
6. Write audit events.

Recommended endpoint family:

| Endpoint                                   | Purpose                                                  |
| ------------------------------------------ | -------------------------------------------------------- |
| `POST /drive/upload-sessions`              | Create upload URL with entity context                    |
| `POST /drive/upload-sessions/:id/complete` | Confirm upload and create FileAsset/FileVersion/FileLink |
| `GET /drive/files/:id`                     | File detail                                              |
| `GET /drive/libraries/:libraryKey`         | Logical library listing                                  |
| `POST /drive/files/:id/versions`           | Upload new version                                       |
| `POST /drive/files/:id/links`              | Link file to another entity                              |
| `DELETE /drive/files/:id/links/:linkId`    | Unlink from context                                      |
| `POST /drive/files/:id/archive`            | Archive                                                  |
| `POST /drive/files/:id/delete`             | Soft delete                                              |
| `POST /drive/exports`                      | Create export job                                        |
| `GET /drive/cleanup/candidates`            | Review cleanup candidates                                |

The old endpoints can remain temporarily as legacy wrappers:

- `GET /drive/:projectId`
- `POST /drive/:projectId/upload-url`
- `GET /drive/:projectId/download-url`

But they should call the new service layer or be marked deprecated.

### Phase 3 - Libraries UI

1. Replace project-only Drive UI with Libraries navigation.
2. Add Project/Product/Client/Finance/Partner/Work Space views.
3. Add file detail drawer.
4. Add links list on file detail.
5. Add version history.
6. Add filters by purpose/type/entity/date/uploader.

Recommended Drive page layout:

```text
Drive
  Sidebar:
    All Files
    Deals
    Projects
    Products
    Clients
    Finance
    Partners
    Tasks
    Work Spaces
    Support
    Company Library
    Personal
    Storage Admin

  Main:
    Library header
    Filters
    Grid/List/Table
    File detail drawer
```

The current page can be refactored from `ProjectFolder[]` to `Library[]`.

### Phase 4 - Module Integrations

1. CRM Offer Materials use Drive.
2. Deal Won links approved offer to Project/Product/Client.
3. Tasks attachments use Drive.
4. Work Space Library uses Drive.
5. Finance documents use Drive with restricted permissions.
6. Support Ticket attachments use Drive.
7. Partner Agreements use Drive.
8. Client Portfolio Files tab uses Drive.

Integration order should be:

1. `CRM Offer Materials` first, because Deal gates depend on it.
2. `Product / Project Library` second, because Deal Won handoff depends on it.
3. `Tasks + Work Space` third, because they produce the most file noise.
4. `Finance` fourth, because it needs stricter permissions.
5. `Clients / Partners / Support` after core file model is stable.

### Phase 5 - Export And Cleanup

1. Add Export Jobs.
2. Add ZIP generation.
3. Add export manifest.
4. Add cleanup candidates.
5. Add task attachment cleanup rules.
6. Add archive/trash/purge lifecycle.
7. Add admin storage dashboard.

Cleanup must never start from R2 object listing alone. It must start from DB metadata and only then verify physical storage.

---

## 6. Current Code References

Runtime areas to refactor:

- `apps/api/src/modules/drive/drive.service.ts`
- `apps/api/src/modules/drive/drive.controller.ts`
- `apps/web/src/lib/api/drive.ts`
- `apps/web/src/app/(app)/drive/page.tsx`
- `packages/database/prisma/schema.prisma`

These files currently implement project-folder behavior and should be treated as `PARTIAL`, not final Drive architecture.

---

## 7. Detailed Code Findings

### 7.1. Backend service

Current file: `apps/api/src/modules/drive/drive.service.ts`.

Findings:

- `DriveService` depends only on `ConfigService`, not database.
- `listFiles(projectId, prefix)` lists R2 objects by prefix.
- `getUploadUrl(projectId, fileName, contentType)` creates key directly as `Drive/projects/{projectId}/{fileName}`.
- `getDownloadUrl(projectId, filePath)` creates presigned URL without checking FileAsset ownership or links.
- `deleteFile(projectId, filePath)` physically deletes R2 object immediately.
- `getProjectStructure(projectId)` builds folder tree from R2 keys.

Required change:

- split into `StorageAdapter` and `DriveDomainService`;
- keep R2 logic in adapter;
- move business logic to DB-backed service;
- replace physical delete with unlink/archive/soft-delete flow;
- generate storage keys from canonical path policy;
- add audit writes for every meaningful action.

### 7.2. Backend controller

Current file: `apps/api/src/modules/drive/drive.controller.ts`.

Findings:

- route shape assumes every Drive operation belongs to one `projectId`;
- permissions are only `DRIVE VIEW/ADD/DELETE`;
- no entity context in upload;
- no purpose/visibility/confidentiality;
- no file detail, versioning, links, export, cleanup.

Required change:

- introduce entity-aware endpoints;
- keep legacy project endpoints only during migration;
- add request DTOs for upload session and file links;
- pass current user into service for audit and permission checks;
- add entity-level access guard/resolver.

### 7.3. Frontend API client

Current file: `apps/web/src/lib/api/drive.ts`.

Findings:

- client types describe R2 entries, not File Assets;
- methods are project-scoped;
- no metadata, links, versions, audit or library query.

Required change:

- create types `FileAsset`, `FileVersion`, `FileLink`, `LibraryKey`, `UploadSession`;
- replace `listFiles(projectId)` with `listLibraryFiles(query)`;
- add upload session complete flow;
- add link/unlink/version/export/cleanup methods.

### 7.4. Frontend page

Current file: `apps/web/src/app/(app)/drive/page.tsx`.

Findings:

- sidebar loads projects and displays them as folders;
- `All Files` is empty and not a real all-files query;
- upload is only allowed after selecting project;
- no entity context;
- no file drawer;
- no version history;
- no purpose;
- no cleanup/export.

Required change:

- replace project sidebar with Library navigation;
- add context filters and search;
- add reusable `FileGrid`, `FileTable`, `FileDetailDrawer`;
- add `UploadFileDialog` with purpose and visibility;
- add Storage Admin view for cleanup/export.

### 7.5. Prisma schema

Current file: `packages/database/prisma/schema.prisma`.

Findings:

- no Drive/File models exist;
- existing `AuditLog` can record file actions, but file-specific audit may need richer fields;
- `TaskLink` already shows pattern for polymorphic entity links; `FileLink` can follow similar pattern;
- core entities have no reverse file relations.

Required change:

- add Drive enums and models near Credentials/Domains or a new Drive section;
- add Employee relation for uploaded/owned files;
- add indexes on `entityType/entityId`, `purpose`, `status`, `createdAt`, `checksum`;
- decide whether to reuse `AuditLog` or add `FileAuditEvent`.

---

## 8. Migration Strategy

Existing R2 files are under:

```text
Drive/projects/{projectId}/...
```

Migration should not move physical files immediately.

Recommended migration:

1. Add DB models.
2. Scan current R2 objects.
3. Create `FileAsset` records with `storage_key` pointing to existing objects.
4. Create `FileLink` to Project based on `{projectId}`.
5. Mark `purpose = UNKNOWN_LEGACY`.
6. Show these files in Project Library.
7. Later allow manual bulk tagging/cleanup.
8. Only after stable operation, optionally move/copy files to new physical path policy.

This avoids breaking existing uploaded files.

---

## 9. Implementation Priority

Recommended practical order:

1. Data foundation + migration of existing R2 project files.
2. Upload session + FileAsset creation.
3. Project Library view using DB, not R2 listing.
4. Deal Offer Materials integration.
5. Product Library + Deal Won auto-links.
6. Task/Work Space attachments.
7. Safe delete/archive.
8. Export by Project/Product/Client/Offer.
9. Cleanup candidates for task-only and orphan files.
10. Finance restricted documents.

This gives business value quickly while moving safely away from the old folder-only model.
