# Document Types And Data Model

> Documents data canon - simple enough for daily use, structured enough to extend later.

## Purpose

This document defines what a document is in NBOS, which document types exist and which data must be stored.

The model must support a strong first version with TipTap native documents and must leave a clean path for Google Docs / Sheets later.

## Document type canon

### `native`

Native NBOS document edited directly in Documents.

Use for:

- регламенты;
- инструкции;
- SOP;
- onboarding;
- internal knowledge articles;
- training text;
- checklists;
- company rules.

Source of truth:

```text
PostgreSQL document content
```

Editor:

```text
TipTap
```

### `uploaded_file`

A file stored through Drive / R2 and shown in Documents.

Use for:

- DOCX;
- XLSX;
- PDF;
- presentations;
- scans;
- old archive files;
- templates that are still file-based.

Source of truth:

```text
Drive File Asset -> R2 object
```

Documents stores metadata and links, not binary file content.

### `external_link`

A manually added link to an external resource.

Use for:

- external documentation;
- vendor pages;
- shared public documents;
- links that do not need deep integration.

### `google_doc` and `google_sheet`

Google Workspace documents connected in v2.

Use for:

- complex collaborative Google Docs;
- spreadsheets with formulas;
- tables that should stay in Google Sheets;
- documents already actively used by the team in Google Workspace.

First release must prepare the model for these types, but implementation comes later.

## Core entity: Document

```text
Document
  id
  type
  title
  slug
  description
  section_id
  parent_id
  status
  owner_id
  created_by
  updated_by
  published_by
  created_at
  updated_at
  published_at
  archived_at
  content_json
  content_html
  plain_text
  search_vector
  cover_file_asset_id
  external_link_id
  visibility
```

### Field notes

| Field                 | Meaning                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| `type`                | `native`, `uploaded_file`, `external_link`, `google_doc`, `google_sheet` |
| `status`              | `draft`, `published`, `archived`                                         |
| `section_id`          | Main section where the document is listed                                |
| `parent_id`           | Optional hierarchy inside section                                        |
| `owner_id`            | Responsible person for content freshness                                 |
| `content_json`        | TipTap JSON for native documents                                         |
| `content_html`        | Rendered HTML for fast viewer mode                                       |
| `plain_text`          | Extracted text for search                                                |
| `search_vector`       | PostgreSQL search vector if used                                         |
| `cover_file_asset_id` | Optional cover/thumbnail from Drive File Asset                           |
| `external_link_id`    | Used for uploaded/external/Google documents                              |

`content_json`, `content_html` and `plain_text` are required only for `native` documents.

## Core entity: DocumentSection

```text
DocumentSection
  id
  name
  slug
  description
  parent_id
  icon
  sort_order
  default_visibility
  created_by
  updated_by
  created_at
  updated_at
  archived_at
```

Sections are logical structure for users. They should feel like folders, but permissions and metadata remain database-driven.

Recommended default sections:

- Company Rules;
- SOP / Processes;
- Sales;
- Delivery;
- Support;
- Finance;
- HR / Onboarding;
- Technical;
- Templates;
- Archive.

## Core entity: DocumentTag

```text
DocumentTag
  id
  name
  slug
  color
  created_at
```

Tags are optional. They improve search and grouping, but the system should not depend on perfect tagging.

## Core entity: DocumentAttachment

```text
DocumentAttachment
  id
  document_id
  file_asset_id
  purpose
  sort_order
  created_by
  created_at
```

Purpose examples:

```text
inline_image
attachment
cover
source_file
export
```

The actual file belongs to Drive.

## Core entity: ExternalDocumentLink

```text
ExternalDocumentLink
  id
  provider
  url
  external_id
  title
  mime_type
  last_synced_at
  created_by
  created_at
  updated_at
```

Provider examples:

```text
manual_url
google_docs
google_sheets
google_drive
```

For first release only `manual_url` may be implemented. Google providers are v2.

## Core entity: DocumentActivityEvent

```text
DocumentActivityEvent
  id
  document_id
  actor_id
  action
  metadata
  created_at
```

Actions:

```text
created
updated
published
renamed
moved
archived
restored
attachment_added
attachment_removed
access_changed
external_link_changed
```

Activity is not a full version history. It is a useful operational log.

## Status model

| Status      | Meaning                                                  |
| ----------- | -------------------------------------------------------- |
| `draft`     | Document is being prepared or edited                     |
| `published` | Document is ready for normal team use                    |
| `archived`  | Document is hidden from normal lists but still preserved |

First release does not need `in_review`, `approved`, `rejected` or complex workflow.

If needed later, the model can extend to:

```text
draft -> review -> published -> archived
```

## Storage rule

For `native` documents:

```text
content_json lives in PostgreSQL.
content_html is derived for display.
plain_text is derived for search.
images/files live in Drive/R2.
```

For `uploaded_file`:

```text
file binary lives in R2 through Drive File Asset.
Document stores metadata, search text if extracted, and link to FileAsset.
```

For `google_doc` / `google_sheet`:

```text
content lives in Google.
NBOS stores link metadata and optional searchable exported text later.
```

## Optional future-proof fields

To keep future migration easy, implementation may include:

```text
content_storage = db | r2 | external
content_object_key = nullable
```

Default for native documents:

```text
content_storage = db
```

Do not use R2 for normal native document content unless document size proves a real operational problem.

## Data model safeguards

1. Do not store uploaded images as base64 inside TipTap JSON.
2. Do not store binary DOCX/XLSX/PDF in PostgreSQL.
3. Do not create a new historical version on every autosave.
4. Do not rely on R2 path as permission truth.
5. Do not expose documents without backend permission checks.
6. Do not make tags required for normal work.
7. Do not make Google integration a hard dependency for native documents.
