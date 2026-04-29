# Sections, Search And Daily UX

> Documents succeeds only if the team actually uses it every day.

## UX purpose

The module must make common document work fast:

- find a document;
- read it;
- edit it;
- add a new instruction;
- attach a file;
- move it to the right section;
- know if it is current.

If the module feels slower than searching in chat or Google Drive, people will stop using it.

## Main screens

### Documents Home

Home is the daily entry point.

It should show:

- search;
- recent documents;
- favorites;
- recently updated;
- my drafts;
- main sections;
- quick create button.

It should not feel like an empty file manager.

### Section page

Section page should show:

- section title and description;
- documents in this section;
- nested sections if used;
- filters by status/tag/owner;
- sort by recently updated, title, owner, status;
- quick create inside section.

### Document page

Document page has two modes:

```text
Viewer mode
Editor mode
```

Viewer mode is default for published documents.

Editor mode is entered through explicit edit action.

Document page should show:

- title;
- status;
- owner;
- updated_at / updated_by;
- section;
- content;
- attachments;
- activity;
- access summary;
- actions.

### Archive

Archived documents should be hidden from normal lists but searchable through archive view for users with permission.

## Navigation structure

Canonical sidebar item:

```text
Documents
```

Route:

```text
/documents
```

Suggested child routes:

```text
/documents
/documents/sections/:sectionSlug
/documents/:documentSlug
/documents/:documentSlug/edit
/documents/archive
/documents/settings
```

## Search

Search must be first-class.

Search input should be visible on Documents Home and easily available inside the module.

Search should cover:

- title;
- description;
- section;
- tags;
- plain text;
- attachments metadata if available;
- external document title if available.

Search result card should show:

- title;
- section;
- snippet;
- status;
- updated_at;
- owner;
- document type icon.

## Filters

Useful filters:

- section;
- status;
- owner;
- tag;
- type;
- updated date;
- favorites;
- my documents.

Filters must be helpful, not mandatory. Users should be able to find documents by typing.

## Favorites and recent

Documents should support:

```text
favorite document
recently opened documents
recently edited documents
```

This matters because many users repeatedly open the same rules, templates and instructions.

## Document creation flow

Create flow should be short:

```text
Click New Document
  -> choose section if not already inside one
  -> enter title
  -> start writing
```

Optional fields like description, tags and owner can be edited later.

Do not block document creation with a long form.

## Templates

First release may include simple templates:

- Empty document;
- Instruction;
- SOP;
- Checklist;
- Training material;
- Policy / rule;
- Meeting notes.

Templates should create structured TipTap content, not separate hard-coded document types.

## Viewer mode

Viewer mode should be optimized for reading:

- clean typography;
- table of contents for long documents if headings exist;
- clear attachments block;
- copy link action;
- edit button only if user has permission;
- last updated visible;
- no heavy toolbars;
- mobile-friendly layout.

## Editor mode

Editor mode should be optimized for writing:

- focused writing area;
- compact toolbar;
- metadata in side panel or collapsible area;
- clear save state;
- easy image/file upload;
- easy table editing;
- keyboard-friendly behavior;
- clean paste support.

## Empty states

Good empty states:

- No documents in this section yet;
- Create the first document;
- No results for search query;
- You do not have access to documents in this section;
- Google integration is not connected yet, v2.

Empty states should offer the next useful action when the user has permission.

## Document list display

Default list should be scannable:

| Column  | Purpose                       |
| ------- | ----------------------------- |
| Title   | Main document name            |
| Section | Where it belongs              |
| Type    | Native/file/link/Google later |
| Status  | Draft/published/archived      |
| Owner   | Responsible person            |
| Updated | Freshness                     |

Cards may be used for recent/favorite blocks, but the main document library should remain dense and easy to scan.

## Status UX

Status should be visible but not overcomplicated.

Rules:

- draft documents are visible to editors/owners and users with permission;
- published documents are normal team-facing documents;
- archived documents are hidden from normal browsing;
- status change should be explicit.

## Daily quality rules

1. The user should be able to create a document in less than one minute.
2. The user should be able to find a known document in less than a few seconds.
3. Reading should feel better than opening a raw file.
4. Editing should not require understanding technical formats.
5. The module should use team language, not CMS language.
6. Access problems should be clear: no access, archived, missing file, external link unavailable.
7. Long documents should remain navigable.
8. Attachments should be visible where users expect them.
