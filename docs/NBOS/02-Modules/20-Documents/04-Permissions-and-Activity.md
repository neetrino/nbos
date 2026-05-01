# Permissions And Activity

> Documents needs clear access control without becoming a heavy approval machine.

## Permission principle

Documents uses NBOS RBAC and backend enforcement.

Permissions must be checked in backend services, not only in UI.

Canonical permission prefix:

```text
documents.*
```

## Core permissions

| Permission                  | Meaning                               |
| --------------------------- | ------------------------------------- |
| `documents.view`            | View documents allowed by scope       |
| `documents.create`          | Create documents                      |
| `documents.edit`            | Edit documents allowed by scope       |
| `documents.delete`          | Delete or hard-delete if ever allowed |
| `documents.archive`         | Archive / restore documents           |
| `documents.manage_sections` | Create/edit/archive sections          |
| `documents.manage_access`   | Change document or section access     |
| `documents.view_activity`   | View document activity                |
| `documents.export`          | Export document content or files      |

Scopes:

```text
NONE
OWN
DEPARTMENT
ALL
```

## Access layers

Access can come from:

1. module permission;
2. section default access;
3. document-level override;
4. ownership;
5. admin/owner role.

Correct check:

```text
User has module permission
  -> scope allows this record
  -> section/document restrictions allow access
  -> action is permitted
```

## Section-level access

Most access should be managed at section level.

Examples:

- Finance documents visible only to finance/admin/owner;
- HR policies visible to all employees;
- Technical documents visible to technical team and owners;
- Sales scripts visible to sales and managers.

This keeps daily management simple.

## Document-level overrides

Document-level access should exist but not be the default habit.

Use overrides for:

- sensitive one-off document;
- temporary limited draft;
- executive-only policy;
- document shared with a specific group.

The UI should show when a document has custom access.

## Ownership

Each document should have an owner.

Owner means:

- responsible for content freshness;
- can be shown in document metadata;
- can receive future reminders if document becomes stale;
- not necessarily the only editor.

## Activity log

Activity log is lightweight operational history.

It answers:

- who created the document;
- who updated it;
- who moved it;
- who changed access;
- who archived/restored it;
- which attachments were added/removed.

It is not a full content version history.

## Activity events

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

For normal edit saves, the system may write only:

```text
updated
```

Do not write one activity event for every autosave tick.

## Audit boundary

Documents activity is normal operational log.

Use stronger global Audit Log only for sensitive actions:

- access changes in sensitive sections;
- export/download of restricted documents if required;
- hard delete;
- admin-level permission changes.

This keeps Documents useful without overloading the audit system.

## Archive and delete

Default behavior:

```text
Archive, not hard delete.
```

Hard delete should be admin-only or not available in normal UI.

Archived documents:

- hidden from normal browsing;
- preserved for search/archive;
- restorable by permitted users.

## Attachment permissions

Attachments must respect both:

```text
Document access
Drive File Asset access
```

If a user can view a document but cannot access an attachment, the UI should show a clear restricted state.

Do not expose raw R2 public URLs for protected files.

## Sharing

First release sharing can be simple:

- copy internal link;
- manage section/document access;
- optional notify users later through Notifications.

Public anonymous sharing is not part of first release.

## UX rules for permissions

Permission UI should be understandable:

- "Who can view";
- "Who can edit";
- "Inherits from section";
- "Custom access";
- "Only owner/admin can change access" when restricted.

Avoid exposing raw permission keys to normal users.

## Safeguards

1. Backend must enforce every read/edit/export.
2. Archived documents must not appear in normal lists.
3. Search results must not leak inaccessible titles or snippets.
4. Attachments must be served through controlled file endpoints.
5. Access changes should be visible in activity.
6. Sensitive section access changes should go to global audit.
