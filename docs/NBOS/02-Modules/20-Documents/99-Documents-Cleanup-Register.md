# Documents Cleanup Register

> Documents - implementation and cleanup checklist for adding the module cleanly.

## Назначение

This register tracks what must be created or kept out of scope when implementing Documents.

Current canon:

- module name is `Documents / Документы`;
- first release is native NBOS documents with TipTap;
- content JSON lives in PostgreSQL;
- files and images go through Drive File Asset / R2;
- Google Docs / Sheets integration is v2;
- AI is not part of this module and will be designed later as a separate platform module;
- history is lightweight: updated fields and activity log, not heavy revision workflow.

---

## A. Canon decisions

### A1. Module name

Статус: `OWNER DECISION`

Canonical name:

```text
Documents / Документы
```

Not:

```text
Knowledge Base
Documentation
Wiki
```

Reason: the team naturally uses the word "documents", and the UI must use familiar language.

### A2. TipTap native editor

Статус: `OWNER DECISION`

Native documents use TipTap.

### A3. Storage split

Статус: `OWNER DECISION`

```text
Native content -> PostgreSQL
Files/images -> Drive/R2
```

### A4. Google later

Статус: `OWNER DECISION`

Google Docs / Sheets integration is version 2, not first release.

### A5. AI excluded from this canon

Статус: `OWNER DECISION`

AI Assistant will be discussed as a separate, large platform module and integrated into Documents later.

---

## B. Runtime missing

### B1. Documents module route is missing

Статус: `MISSING MODULE`

Need:

```text
/documents
```

### B2. Sidebar item is missing

Статус: `MISSING UI`

Need top-level sidebar item:

```text
Documents
```

### B3. Document data model is missing

Статус: `MISSING DATA MODEL`

Need:

- Document;
- DocumentSection;
- DocumentTag;
- DocumentAttachment;
- DocumentActivityEvent;
- ExternalDocumentLink.

### B4. TipTap editor is missing

Статус: `MISSING UI / MISSING EDITOR`

Need editor with:

- basic formatting;
- headings;
- lists;
- checklists;
- links;
- images;
- tables;
- attachments;
- save state.

### B5. Drive/R2 attachment flow is missing

Статус: `MISSING INTEGRATION`

Need upload flow through Drive File Asset, not direct raw R2 usage from Documents.

### B6. Search is missing

Статус: `MISSING SEARCH`

Need PostgreSQL search over:

- title;
- tags;
- section;
- plain_text.

### B7. Section-level access is missing

Статус: `MISSING RBAC`

Need backend access checks for view/edit/archive/manage.

### B8. Activity log is missing

Статус: `MISSING CODE`

Need simple document activity events.

### B9. Google integration is intentionally deferred

Статус: `DEFERRED V2`

Do not block first release on Google OAuth/sync.

### B10. AI integration is intentionally deferred

Статус: `DEFERRED FUTURE MODULE`

Do not implement AI inside Documents before AI Assistant module canon is approved.

---

## C. Implementation order

1. Add Documents sidebar item and route.
2. Add DB model for Document, Section, Tag, Attachment and Activity.
3. Add backend permissions and API.
4. Add Documents Home with search and section list.
5. Add section page and document list.
6. Add create flow.
7. Add TipTap editor and viewer mode.
8. Add save/autosave and `plain_text` extraction.
9. Add image/file upload through Drive File Asset.
10. Add document access UI and backend enforcement.
11. Add activity log.
12. Add archive/restore flow.
13. Add favorites/recent documents.
14. Add templates if time allows.
15. Add Google integration only after first release is stable.

## D. Non-goals for first release

Do not build:

- full Google Docs clone;
- spreadsheet editor;
- complex approval workflow;
- track changes;
- full revision diff;
- collaborative live cursors;
- public anonymous sharing;
- AI writing assistant;
- Google Drive browser;
- arbitrary file manager.

## E. Important safeguards

### E1. Do not expose all Drive files

Documents should show only documents and files linked to Documents.

### E2. Do not store binary files in DB

DOCX, XLSX, PDF, images and exports belong in R2 through Drive File Asset.

### E3. Do not store base64 images in TipTap JSON

TipTap image nodes must reference File Asset IDs.

### E4. Do not write activity on every keystroke

Autosave should be debounced and activity should be meaningful.

### E5. Do not leak restricted search results

Search must apply permissions before showing titles/snippets.

### E6. Keep UI simple

This module must be pleasant and fast. Avoid enterprise workflow clutter unless later approved.
