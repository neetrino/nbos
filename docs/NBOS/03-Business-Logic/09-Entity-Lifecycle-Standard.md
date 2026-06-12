# Entity Lifecycle Standard (Platform)

> **Version:** 1.0 · **Date:** 2026-06-12  
> **Status:** Canon — applies to all new Profile A/B/C modules and incremental migrations.

---

## Purpose

NBOS uses a single platform vocabulary for **recoverable deletion**, **permanent purge**, and **historical archive**. This document defines the framework, profiles, API contract, and anti–split-brain rules.

**Core pipeline for normal deletion:**

```text
Active → Trash → Purged
```

**Archive is not deletion.** Use _Archive_ only for historical storage (old versions, old policies, completed reference libraries).

---

## Terminology

| Term                        | Meaning                                                         | Use for                                                       |
| --------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------- |
| **Trash**                   | Recoverable deletion: removed from normal work, restorable      | Contact, Company, Lead, Deal, Project, Drive file, Credential |
| **Purge**                   | Final destruction; admin, job, or policy + audit + confirmation | Storage cleanup, GDPR, retention jobs                         |
| **Archive**                 | Historical retention; **not** soft-delete UX                    | Document versions, old policies, reference libraries          |
| **Void / Cancel / Reverse** | Business reversal without erasing history                       | Finance posted/confirmed records                              |
| **Inactive**                | Reference data no longer offered as active option               | System lists, roles, departments                              |

---

## Lifecycle Profiles

| Profile                    | Essence                                           | Stages                                     | Modules                                        |
| -------------------------- | ------------------------------------------------- | ------------------------------------------ | ---------------------------------------------- |
| **A — Business entity**    | Record with history; list + sheet, no folder tree | `active → trash → purged`                  | Contact, Company, Lead, Deal, Partner, Project |
| **B — File asset**         | File + storage; unlink separate from trash        | `active → trash → purged`                  | Drive FileAsset, DriveFolder                   |
| **C — Secret vault**       | Secret + collections; trash = flat secure view    | `active → trash → purged`                  | Credential (+ folders Model 6)                 |
| **D — Financial record**   | Audit trail critical                              | `draft → posted` + void/cancel             | Invoice, Order, Payment, Expense               |
| **E — Config / reference** | Lookup tables                                     | `active / inactive` or guarded hard delete | System lists, Roles, Departments               |
| **F — Ephemeral / inbox**  | Personal / temporary                              | hide or hard delete                        | Notifications, dashboard notes                 |
| **G — Historical archive** | Long-term reference, not delete UX                | `active/current → archived reference`      | Document versions, old policies                |

**Do not clone Credentials folder/vault UX into Profile A modules.**

---

## Platform API contract (Profiles A, B, C)

```text
GET     /entities?scope=active|trash     — default active
DELETE  /entities/:id                    → move to Trash (not prisma.delete)
POST    /entities/:id/restore            → restore from Trash
DELETE  /entities/:id/permanent          → purge (guards + audit) — later phases
```

### Target schema fields (Profile A business entities)

```text
trashedAt   DateTime?   — recoverable deletion
trashedById String?     — optional actor
purgedAt    DateTime?   — final removal (job/admin)
```

### Transitional naming

Runtime modules may still use `archivedAt` or `deletedAt`. **Do not blind-rename** without a dedicated migration.

| Runtime field                   | Target field        | Modules (transitional)         |
| ------------------------------- | ------------------- | ------------------------------ |
| `archivedAt`                    | `trashedAt`         | Credentials, some legacy flags |
| `deletedAt` + `status: DELETED` | trash timestamp     | Drive FileAsset                |
| `status: ARCHIVED`              | merge into Trash UX | Drive (until DB migration)     |

Shared helpers (`@nbos/shared`, `apps/api/src/common/lifecycle/`) accept a **timestamp field** parameter so queries stay consistent during migration.

---

## Rules R1–R5 (anti split-brain)

| #      | Rule                                                                                               |
| ------ | -------------------------------------------------------------------------------------------------- |
| **R1** | One `scope` per screen: list, counts, stats, sidebar — all use the same scope                      |
| **R2** | Switching `active → trash` resets navigation state (`folderId`, `projectId`, open sheet if needed) |
| **R3** | In trash, do not load active-only endpoints (folders, shells, child nav)                           |
| **R4** | Trash side-effects in **one transaction** + audit (e.g. remove folder memberships for Profile C)   |
| **R5** | Do not copy Credentials folder UX into Profile A modules                                           |

---

## Profile specifics

### A — Clients / CRM (reference)

- Same list + sheet in active and trash; scope toggle in settings/filter.
- No second navigation layer in trash.
- `DELETE` = move to Trash; never `prisma.delete` in normal UX.

### B — Drive

- One Trash view (transitional: includes legacy `ARCHIVED` + `DELETED` rows until migration).
- Folders = container (Model 3), not Credentials Model 4.
- UI: **Move to Trash**, **Restore**, **Purge permanently** (danger zone).

### C — Credentials

- Trash = flat secure list (no folder tree, project shells, drag-drop).
- Trash credential: set trash timestamp + **remove all folder memberships**.
- Restore: active, **unfiled** (no auto-return to old folders).
- Folders: **empty-only hard delete** (Model 6); non-empty → block with clear error.

### D — Finance

- Posted/confirmed: void/cancel/reverse — **no Trash**.
- Draft-only hard delete where safe.

### E — Config

- `isActive: false` or guarded hard delete (empty-only).

### G — Historical archive

- Keep `ARCHIVED` status only when semantics are historical storage, not delete UX.

---

## Shared implementation

| Layer          | Artifact                                                                 |
| -------------- | ------------------------------------------------------------------------ |
| `@nbos/shared` | `EntityLifecycleScope`, `LifecycleProfile`, action constants             |
| API            | `buildScopeWhere()`, `assertEntityIsActive()`, `assertEntityIsTrashed()` |
| Web            | `useListScope()` — scope state + navigation reset on change              |

Query param standard: `?scope=active|trash` (not ad-hoc `includeArchived` without context).

---

## Related docs

- Platform plan: `todo.md` (Trash / Purge Lifecycle)
- Credentials: `docs/NBOS/02-Modules/12-Credentials/`
- Drive: `docs/NBOS/02-Modules/11-Drive/`
