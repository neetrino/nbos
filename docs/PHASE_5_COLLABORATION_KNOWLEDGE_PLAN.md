# Phase 5 Collaboration / Knowledge Plan

> Implementation plan for Phase 5 after Phase 4 delivery runtime closure.

## 1. Decision

Phase 5 starts with **Drive + Documents** because the platform now needs a reliable knowledge and file layer before deeper Credentials, Messenger, Mail, Notifications, Calendar and Technical Infrastructure work.

`Documents` is a standalone module. It is not Drive, not a Google Docs clone and not a heavy approval system.

```text
Documents = daily workspace for native company documents.
Drive = file infrastructure and File Asset metadata.
R2 = binary object storage.
PostgreSQL = source of truth for native document content and metadata.
```

## 2. Current Phase 5 State

Already started:

- Drive has DB-backed `FileAsset`, `FileVersion`, `FileLink` and `FileAuditEvent` foundation.
- Drive metadata API can create/list/detail/link/unlink/archive file assets.
- Legacy R2 project-folder browser still exists as a compatibility/storage layer.

Not started yet:

- Documents runtime module.
- Documents route/sidebar entry.
- Documents schema, API, RBAC, search, editor and viewer.
- Documents attachment flow on top of Drive File Assets.

## 3. Implementation Order

### Slice 1. Drive Upload And Library Foundation

Goal: make Drive usable as business file infrastructure, not only as R2 folder browser.

Scope:

- upload-session flow;
- complete-upload endpoint that creates `FileAsset`, version and optional `FileLink`;
- file list by entity context;
- first logical library query for Project/Product/Task/Support/Company contexts;
- no global Drive redesign yet.

Done when:

- modules can safely attach files through Drive metadata;
- R2 key is storage detail, not business truth;
- old project-folder endpoints remain compatible.

**Implemented (2026-04-29):** `FileUploadSession` + `POST /drive/upload-sessions` (DB row then presign), `PUT` to R2, `POST .../complete` (`HeadObject` + transactional `FileAsset` + link), `POST .../fail`, `GET /drive/library?contextType=&contextId=`; `DriveR2Client` extracted for R2 access.

### Slice 2. Documents Data Foundation

Goal: create the standalone Documents runtime boundary.

Scope:

- Prisma models: `Document`, `DocumentSection`, `DocumentTag`, `DocumentAttachment`, `DocumentActivityEvent`, `ExternalDocumentLink`;
- first API module with list/detail/create/update/archive;
- default sections seed or ensure logic;
- backend `documents.*` permission boundary;
- activity events for meaningful actions.

Done when:

- native document metadata and content can be stored in PostgreSQL;
- Documents can exist without Google integration;
- search cannot leak restricted records.

**Implemented (2026-04-29):** Prisma models for Document, Section, Tag, TagLink, Attachment, Activity, ExternalLink; migration; `DocumentsModule` REST (`/api/documents`, sections/tags, CRUD, archive); `DOCUMENTS` RBAC module in `seed-rbac.ts`; default sections via `document_sections.count` gate; web `documentsApi`.

### Slice 3. Documents UI Shell

Goal: make `/documents` visible and useful before editor depth.

Scope:

- sidebar item and `/documents` route;
- Documents Home with search placeholder, sections, recent/my drafts blocks;
- section page and dense document list;
- create flow with title + section only;
- empty/loading/error states.

Done when:

- user can open Documents, see sections and create/read basic records;
- UI language uses `Documents`, `Sections`, `Draft`, `Published`, `Archive`.

**Implemented (2026-04-29):** Web `/documents` home (sections, recent, my drafts, search placeholder), `/documents/sections/[sectionId]`, `/documents/[id]` read-only shell with activity + archive, `CreateDocumentDialog`, sidebar `Documents` with `DOCUMENTS` VIEW.

### Slice 4. Native Editor And Viewer

Goal: make native Documents usable for daily work.

Scope:

- TipTap editor for headings, text, lists, checklist, links, code, quote and tables if practical;
- viewer mode over trusted rendered content;
- `content_json`, derived `plain_text` and optional `content_html`;
- save state and safe autosave/debounce;
- publish/archive/restore actions.

Done when:

- user can create, edit, publish, read and archive native documents;
- autosave does not create noisy activity history;
- malformed content and save failures are visible.

**Implemented (2026-04-29):** TipTap on `/documents/[id]` (Read/Edit tabs when permitted), StarterKit + tasks + tables + links + placeholder, debounced silent PATCH with `recordActivity: false`, manual Save records activity, Publish sends content + `PUBLISHED`, `DocumentHtmlViewer` with DOMPurify, API skips `DocumentActivityEvent` for content-only silent updates.

### Slice 5. Attachments Through Drive

Goal: connect Documents to Drive without storing binary data in Documents.

Scope:

- attach existing/new Drive File Asset to a document;
- `DocumentAttachment` records with purpose and sort order;
- TipTap image nodes reference `fileAssetId`;
- controlled view/download path;
- restricted attachment state when Drive access is missing.

Done when:

- no base64 images in document content;
- no binary DOCX/XLSX/PDF in PostgreSQL;
- Documents only shows files linked to Documents.

**Implemented (2026-04-29):** `POST/DELETE /api/documents/:id/attachments` (requires existing `FileLink` `DOCUMENT`+doc id from upload session), `GET /api/drive/files/:id/preview-url` (+ optional `forDocumentId` document-scoped gate), `DOCUMENT` in Drive library context, web `documentImage` TipTap node + image toolbar (needs `DRIVE` ADD), attachments panel, HTML viewer resolves `img[data-nbos-file]`.

### Slice 6. Documents Access, Activity And Search Depth

Goal: make Documents safe enough for real team use.

Scope:

- section-level access;
- document-level overrides;
- owner/currentness metadata;
- PostgreSQL search over title, section, tags and plain text;
- activity tab for created/updated/published/moved/archived/access changes.

Done when:

- backend enforces every read/edit/archive/export path;
- search applies permissions before returning titles/snippets;
- sensitive access changes can be routed to global audit.

**Partial (2026-04-29):** Multi-field `search` on `GET /api/documents` with optional `searchSnippet` in JSON; list includes tag names; web search on home + section pages; document detail shows owner/last-editor ids and richer activity lines. **Shipped:** PostgreSQL generated `search_vector` + GIN; list search uses ranked `websearch_to_tsquery` combined with ILIKE on title/description/plain text/section/tags and **attachment-linked `file_assets` display/original names** (active, not deleted). **Shipped:** `document_sections.default_list_scope` and `documents.list_scope_override` (`ALL` / `OWN` / `DEPARTMENT`); list/detail/search/attachments/archive enforce RBAC `DOCUMENTS_VIEW` scope intersected with effective list scope; optional PATCH `listScopeOverride` + `access_changed` activity. **Shipped:** `DOCUMENTS_VIEW_ACTIVITY` permission (seed mirrors `DOCUMENTS_VIEW` scope per role); document detail omits activity when denied (`activityRevealed`); global `audit_logs` row on `access_changed`. **Shipped:** `DOCUMENTS` `MANAGE_SECTIONS` (seed mirrors `DOCUMENTS` EDIT scope per role); `PATCH /api/documents/sections/:sectionId` for `defaultListScope`; web section page “Section visibility” card; global audit `document_section_list_scope_changed`. **Shipped:** document activity cursor pagination — `GET /api/documents/:id/activity?cursor=&limit=`, detail `activityNextCursor` after first page, web “Load older activity”.

## 4. Explicit Non-Goals For First Release

Do not implement in Phase 5 first release:

- Google Docs / Sheets sync;
- AI writing assistant;
- collaborative live cursors;
- track changes;
- complex review/approval workflow;
- spreadsheet editor;
- public anonymous sharing;
- arbitrary Google Drive browser;
- secrets inside Documents or Drive.

## 5. Professional Development Rules

- Read `docs/NBOS/02-Modules/20-Documents/*`, `docs/NBOS/02-Modules/11-Drive/*` and technical decisions before each schema-affecting slice.
- Keep Documents and Drive responsibilities separate.
- Use PostgreSQL as the source of truth for native document content and metadata.
- Use Drive File Assets for all images/files/exports.
- Implement backend permission checks before trusting UI visibility.
- Ship in cohesive slices with tests, docs updates and one commit per slice.
