# Google Workspace Integration v2

> Google Docs and Sheets integration is important, but it is version 2, not first release.

## Decision

First release focuses on native NBOS documents.

Google integration comes later as v2:

```text
Documents first
Google Workspace integration second
AI Assistant later as separate platform module
```

Reason:

- native document workflow must be useful on its own;
- Google OAuth, scopes, sync and permission mapping add real complexity;
- Google Docs/Sheets should be integrated cleanly, not rushed;
- Documents should not become blocked by external integration.

## Product role

Google Docs / Sheets should be treated as external editable documents inside the Documents module.

NBOS should:

- store metadata;
- show the document in the right section;
- make it searchable where possible;
- show owner/status/tags;
- open it in Google for editing;
- optionally show preview/embed if safe and available.

NBOS should not:

- rebuild Google Docs editor;
- rebuild Google Sheets;
- parse every spreadsheet formula;
- pretend it owns Google document content;
- make Google a hard dependency for native documents.

## Supported v2 types

```text
google_doc
google_sheet
```

Possible later:

```text
google_slide
google_drive_file
```

## User flows

### Link existing Google document

```text
New -> Link Google Document
  -> paste URL or choose from Google picker
  -> NBOS reads metadata
  -> user selects section/tags/owner
  -> document appears in Documents
```

### Open and edit

```text
Open document in NBOS
  -> show metadata and preview if available
  -> click Open in Google
  -> edit in Google Docs / Sheets
```

### Search

Search can use:

- title;
- description;
- tags;
- section;
- synced plain text export if implemented;
- last synced metadata.

If content export is unavailable, search should still find by metadata.

## Data model additions

`ExternalDocumentLink` should support:

```text
provider = google_docs | google_sheets
external_id
url
title
mime_type
last_synced_at
sync_status
last_sync_error
```

Optional:

```text
exported_plain_text
exported_html_file_asset_id
exported_pdf_file_asset_id
```

## Google account connection

Google account connection should belong to an integration/auth layer, not raw Documents tables.

Documents uses the connection to:

- read metadata;
- open picker;
- optionally export content for search;
- validate access where possible.

Tokens and secrets must not be stored in Documents. They belong to secure credential/integration storage.

## Permissions mapping

Google permissions and NBOS permissions are different systems.

Rules:

1. NBOS controls visibility inside NBOS.
2. Google controls actual Google document access.
3. If user can see a Google document in NBOS but lacks Google permission, show "No Google access" and offer request/open handling.
4. Do not assume NBOS can grant Google access unless explicitly implemented.
5. Do not leak Google document previews to NBOS users without permitted access.

## Sync strategy

Sync should be async and resilient.

Use cases:

- metadata sync;
- title update;
- thumbnail/preview update;
- optional export text for search;
- error tracking.

Implementation direction:

```text
Google sync job -> BullMQ -> provider adapter -> update ExternalDocumentLink metadata
```

## Scope discipline

Google integration must request minimal scopes needed for approved functionality.

Do not request broad Drive access if the product only needs picking/linking specific documents.

Exact scopes must be approved before implementation.

## First version of Google integration can be small

Acceptable v2 first slice:

- connect Google account;
- link existing Google Doc/Sheet by URL;
- store metadata;
- open in Google;
- show sync status;
- no deep content sync yet.

Then later:

- picker;
- preview/embed;
- exported text search;
- PDF snapshot;
- Google permission helper.

## Non-goals

Google v2 does not include:

- editing Google Docs inside TipTap;
- converting every Google Doc to native NBOS document automatically;
- full Drive file browser;
- spreadsheet engine;
- bidirectional document content sync;
- complex Google sharing management.

## Relationship with Drive

Google linked documents are not R2 files unless exported snapshots are created.

If NBOS exports a Google Doc to PDF/HTML for snapshot/search, that exported file should be stored through Drive File Asset.

## Failure states

UI must handle:

- Google account disconnected;
- missing permission;
- deleted external document;
- URL invalid;
- sync failed;
- export too large;
- provider rate limit.

Failure should not break the Documents module.
