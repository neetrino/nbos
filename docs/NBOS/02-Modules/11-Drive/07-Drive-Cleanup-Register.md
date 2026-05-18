# Drive Cleanup Register

> Что уже совпадает с новым Drive-каноном, что устарело в документации/коде, и что нужно переделать при реализации.

## 1. Current State Summary

**2026-05-18:** Drive runtime — DB-backed `FileAsset` + `FileLink` + scoped `DriveFolder` trees, главный UI в `DriveWorkspace` (System Library / Company / Personal / Shared with me).

**Shipped:**

- Upload sessions → presigned R2 → `FileAsset` + `FileLink` + optional `DriveFolderItem`;
- storage home для **новых** загрузок: `nbos/tenants/{organizationId}/files/...` (`NBOS_TENANT_ORGANIZATION_ID` в env API);
- scoped folders: `DriveFolder.scopeEntityType` / `scopeEntityId` для Library-сущностей;
- Project Library hub: Folders (PROJECT tree + project shell files), виртуальные секции Deals / Products (+ nested Extensions) / Client (Company + Contact) / Tasks / Finance;
- Company/Personal folder trees: create, rename, move placement, copy `FileAsset`, remove placement;
- library actions UX: folder vs FileLink capabilities, scoped move/copy picker, unlink;
- TASK / WORKSPACE library: deep links, pinned rows, entity root merge, entry from Work Space;
- Deal Won auto-`FileLink` policy (`DriveDealWonLinksService`);
- file grants API (`FileAssetGrant`), version upload, archive/batch restore;
- ZIP export job (selection → async/sync job, manifest);
- maintenance: `GET cleanup-summary`, purge failed/expired upload sessions;
- entity-level RBAC scope на list/get (`OWN` / `DEPARTMENT` / `ALL`).

**Still backlog:** полная матрица Share/Move/Copy по канону §3 permissions, расширенные export types / TTL / cancel, cleanup candidates dashboard, rich preview, reusable card upload widget.

**Legacy (сохранено, не source of truth):** `GET /drive/:projectId` R2 prefix listing (`Drive/projects/{projectId}/...`) — для старых объектов; новые файлы не используют этот путь.

### 1.0. Architecture alignment (2026-05-18)

Сверка с [`08-Drive-Navigation-Project-Hub-and-Folders.md`](./08-Drive-Navigation-Project-Hub-and-Folders.md) и [`06-Drive-Storage-Export-and-Cleanup.md`](./06-Drive-Storage-Export-and-Cleanup.md):

| Topic           | Target                                    | Status (2026-05-18)                                                           |
| --------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| Three UI spaces | System Library / Company / Personal       | **DONE** — `DriveWorkspace` + space tabs                                      |
| Scoped folders  | `DEAL`, `PROJECT`, `TASK`, … per entity   | **DONE** — `scopeEntityType` / `scopeEntityId` on `DriveFolder`               |
| Project hub     | Virtual sections + PROJECT tree           | **DONE** — hub nav + Client + Extensions under Products                       |
| R2 layout       | `nbos/tenants/{organizationId}/files/...` | **DONE** for new uploads; legacy `Drive/uploads/...` may remain until removed |
| TASK/WORKSPACE  | Library entry + deep links                | **DONE** — see `drive-deep-link.ts`, pinned rows                              |
| Library actions | Folder vs link semantics                  | **DONE** — `drive-action-capabilities.ts`                                     |

`DriveFolder` / `DriveFolderItem` for Company/Personal and scoped Library entities: **shipped**.

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

| Gap                         | Status    | Needed                                                                        |
| --------------------------- | --------- | ----------------------------------------------------------------------------- |
| `FileAsset` model           | `DONE`    | Central file metadata, status, visibility, purpose                            |
| `FileVersion` model         | `DONE`    | Version metadata with storage key and checksum                                |
| `FileLink` model            | `DONE`    | Links to Deal/Product/Invoice/Task/Work Space/etc.                            |
| `FilePermission` model      | `MISSING` | Explicit grants and restrictions                                              |
| `DriveFolder` model         | `DONE`    | Company/Personal + scoped Library (`scopeEntityType` / `scopeEntityId`)       |
| `FolderPlacement` model     | `DONE`    | `DriveFolderItem` for file/folder placement (Company/Personal + scoped trees) |
| `FileAssetGrant` model      | `DONE`    | Per-employee grants on `FileAsset`                                            |
| `DriveZipExportJob` model   | `PARTIAL` | Selection ZIP + manifest; not full export catalog from doc 06 §5              |
| `FileUploadSession` model   | `DONE`    | Presign → complete → `FileAsset`                                              |
| `FileAuditEvent` model      | `PARTIAL` | File-specific creation/archive audit events exist                             |
| `ExportJob` model           | `MISSING` | ZIP/backup/export lifecycle                                                   |
| `CleanupCandidate` model    | `MISSING` | Cleanup review queue                                                          |
| File relations on core data | `MISSING` | Employee uploaded files, Project/Product/Deal/Task linked files               |

### 3.2. Backend API

| Gap                  | Status    | Needed                                                                                                                                                                                                         |
| -------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upload session       | `DONE`    | `POST /drive/upload-sessions`, presign, complete, fail, `HeadObject` gate                                                                                                                                      |
| Entity-aware upload  | `PARTIAL` | Session + storage home path resolver; reusable upload on CRM/Product **cards** still missing                                                                                                                   |
| File list by library | `DONE`    | `GET /drive/library`, `GET /drive/files` with entity filters; Project hub sections via `GET /drive/project-hub/:projectId`                                                                                     |
| Scoped folders API   | `DONE`    | `GET/POST /drive/folders` with `scopeEntityType` / `scopeEntityId`; listFolder scope guard                                                                                                                     |
| Folder placement API | `DONE`    | add/move/copy/remove placement; copy creates new `FileAsset` in R2 storage home                                                                                                                                |
| File detail          | `DONE`    | Metadata, versions, active links and recent audit are exposed in Drive UI                                                                                                                                      |
| Version upload       | `DONE`    | Existing R2 File Asset can receive a new current version                                                                                                                                                       |
| Link/unlink API      | `DONE`    | Connect file to additional entities without copying                                                                                                                                                            |
| Safe delete API      | `PARTIAL` | Unlink/archive exists; soft-delete/hard-delete later                                                                                                                                                           |
| Folder move/copy API | `PARTIAL` | Move/copy placement + copy `FileAsset` shipped; full Share/Move/Copy matrix + trash lifecycle per doc 03 **MISSING**                                                                                           |
| Export API           | `PARTIAL` | `POST /drive/zip-exports` (selection ZIP + manifest); typed exports (Project/Product/Client/…) **MISSING**                                                                                                     |
| Cleanup API          | `PARTIAL` | Upload-session purge (`cleanup-summary`, `cleanup/purge/:kind`); orphan/candidate review queue **MISSING**                                                                                                     |
| Deal Won link policy | `DONE`    | `DriveDealWonLinksService` — auto `FileLink` to PROJECT/PRODUCT/CONTACT/COMPANY/EXTENSION                                                                                                                      |
| Permission resolver  | `PARTIAL` | **2026-05-06:** Drive DB-backed file APIs now enforce entity-level RBAC scope (`OWN/DEPARTMENT/ALL`) via file owner/creator + department colleagues; project/entity graph-depth resolver can be expanded later |

### 3.3. Frontend UI

| Gap                  | Status    | Needed                                                                                                                                    |
| -------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Libraries navigation | `DONE`    | `DriveWorkspace` — System Library grid, entity scoped folder trees, Company/Personal trees, filters, bulk archive/restore                 |
| Project hub UI       | `DONE`    | Folders + Deals / Products (+ Extensions) / Client / Tasks / Finance virtual sections (`DriveProjectHubNav`)                              |
| Library actions UX   | `DONE`    | Capabilities by context (hub virtual vs folder vs link); scoped folder picker for move/copy; unlink                                       |
| TASK/WORKSPACE entry | `DONE`    | Deep links, pinned library rows, Work Space → Drive buttons                                                                               |
| File detail drawer   | `DONE`    | Links, versions, visibility/confidentiality badges, audit                                                                                 |
| Entity quick attach  | `MISSING` | Reusable upload component for cards                                                                                                       |
| Purpose selector     | `MISSING` | Offer, Proof, Design, Delivery, Task Attachment, etc.                                                                                     |
| Contextual file tabs | `MISSING` | Files tab in Product, Client Portfolio, Finance cards                                                                                     |
| Export UI            | `MISSING` | Export by project/client/purpose/period                                                                                                   |
| Cleanup dashboard    | `MISSING` | Orphans, old task files, drafts, storage usage                                                                                            |
| Preview support      | `MISSING` | PDF/image/video/code previews                                                                                                             |
| Permission badges    | `DONE`    | Visibility/confidentiality badges in detail/list                                                                                          |
| Last selected view   | `PARTIAL` | Main Drive page remembers cards/list/table view in local browser storage; per-user server preference can be added later if needed         |
| Compact first screen | `PARTIAL` | Drive top area is compact and insights are hidden behind an action; heavy analytics should move to a dedicated Insights/Analytics surface |

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
2. Split navigation into System Libraries, Company Drive, Personal Drive, Shared with me and Maintenance.
3. Add file detail drawer.
4. Add links list on file detail.
5. Add version history.
6. Add filters by purpose/type/entity/date/uploader.
7. Keep the default Drive screen focused on folders/files; large explanations and analytics must be hidden behind actions or moved to an Insights tab.

Recommended Drive page layout:

```text
Drive
  Sidebar:
    System Libraries
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
    Free Drive
      Company Drive
      Personal Drive
      Shared with me
    Maintenance
      Archive
      Storage Admin

  Main:
    Compact library header
    Filters
    Grid/List/Table
    File detail drawer on demand
    Insights/Analytics on demand
```

The current page can be refactored from `ProjectFolder[]` to `Library[]`.

### Phase 3.5 - User Folder System

1. Add `DriveFolder` for user-created folders in `COMPANY` and `PERSONAL` spaces.
2. Add `FolderPlacement` for file/folder location inside user-created folders.
3. System Libraries are not folders and cannot be moved/deleted by users.
4. Move changes placement only.
5. Share grants access to the same `FileAsset`.
6. Copy creates a new independent `FileAsset` with copied-from metadata.
7. Remove from folder removes only placement.
8. Move to Trash hides the FileAsset everywhere when allowed.
9. Delete forever is only from Trash / cleanup with audit and retention checks.
10. Business-linked approved, finance-sensitive, legal-sensitive or project-critical files are protected from ordinary delete.

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

Primary runtime (2026-05-18):

| Area          | Paths                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| API core      | `drive.service.ts`, `drive.controller.ts`, `drive-upload-session.service.ts`                            |
| Folders / hub | `drive-folder.service.ts`, `drive-project-hub.service.ts`, `drive-folder-scope.ts`                      |
| Storage home  | `drive-storage-home-*.ts`, `drive-tenant.ts`, `drive-upload-path.ts`                                    |
| Policies      | `drive-deal-won-links.service.ts`, `drive-asset-access.where.ts`, `drive-action-capabilities.ts` (web)  |
| Export        | `drive-zip-export.service.ts`, `drive-export-zip.worker.ts`                                             |
| Web UI        | `apps/web/src/features/drive/DriveWorkspace.tsx`, `DriveProjectHubNav.tsx`, `drive-project-hub-view.ts` |
| Schema        | `packages/database/prisma/schema/drive.prisma`                                                          |

**Legacy adapter (keep until R2 migration):** `DriveService.listFiles` / `getProjectStructure` — R2 prefix `Drive/projects/{projectId}/`.

---

## 7. Detailed Code Findings

> **Note:** §7.1–7.5 describe the **pre-2025 DB migration spike** baseline. Current runtime matches §1 and §3; do not use §7 alone for implementation status.

### 7.1. Backend service (historical baseline)

File: `apps/api/src/modules/drive/drive.service.ts`.

**Was (spike):** R2-only project prefix browser, no DB.

**Now (2026-05-18):** DB-backed `listFileAssets`, grants, versions, archive, ZIP export helper, entity RBAC; R2 list/delete methods retained as **legacy** for old `Drive/projects/` keys. New uploads go through `DriveUploadSessionService` + storage home builder.

### 7.2. Backend controller (historical baseline)

**Was:** project-only routes.

**Now:** upload sessions, files CRUD, folders (scoped), library, project-hub summary, zip-exports, cleanup-summary, grants, legacy `GET :projectId` R2 listing.

### 7.3. Frontend API client (historical baseline)

**Now:** `apps/web/src/lib/api/drive.ts` — `FileAsset`, upload sessions, folders, library, project-hub, zip-exports, grants; legacy R2 project methods optional.

### 7.4. Frontend page (historical baseline)

**Now:** `drive/page.tsx` hosts `DriveWorkspace` — full libraries cockpit (see §1). Not project-only sidebar.

### 7.5. Prisma schema (historical baseline)

**Now:** `packages/database/prisma/schema/drive.prisma` — `FileAsset`, `FileVersion`, `FileLink`, `DriveFolder`, `DriveFolderItem`, `FileUploadSession`, `FileAuditEvent`, `FileAssetGrant`, `DriveZipExportJob`.

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

**Completed through 2026-05-18 (Drive slice):** items 1–3, 5–7 (partial export), hub/scoped folders/storage home/TASK library UX — see §1.

**Next recommended order:**

1. Reusable upload + purpose selector on CRM/Product/Task cards (module integrations §4).
2. Full Share/Move/Copy permission matrix (`03-Permissions-Sharing-and-Audit.md`).
3. Export catalog (Project/Product/Client/Offer types, TTL, cancel) per doc 06 §5.
4. Cleanup candidates dashboard (DB-first orphan review, not R2 listing).
5. Rich preview (PDF/image/video).
6. Optional: migrate legacy `Drive/projects/` R2 keys to storage home (bulk, separate migration).

---

## 10. Documentation: Mail module

| Область            | Статус | Примечание                                                                                         |
| ------------------ | ------ | -------------------------------------------------------------------------------------------------- |
| Cross-link to Mail | `OK`   | **2026-04-30:** `05-Drive-Module-Integrations.md` — **§13 Mail** (`FileAsset` / email attachments) |
