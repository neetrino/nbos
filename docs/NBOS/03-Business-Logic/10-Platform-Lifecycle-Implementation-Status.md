# Platform lifecycle — implementation status (index)

Tracks **shipped Trash / Purge runtime** vs canon in `09-Entity-Lifecycle-Standard.md` and `todo.md` (Trash / Purge Lifecycle plan). Product rules stay in module canon; each `06-Implementation-Status.md` lists code surfaces and gaps only.

**Last synced:** 2026-06-12 (Profile A `DELETE …/permanent` API, Mail 7.1, credential `trashed_at` rename).

## Profile A — business entities (`trashedAt`)

| Module       | Entity           | Status doc                                                                      | Trash list       | Restore | Manual purge API | Auto-purge (30d)                  |
| ------------ | ---------------- | ------------------------------------------------------------------------------- | ---------------- | ------- | ---------------- | --------------------------------- |
| Clients      | Contact, Company | [03-Clients/06](../02-Modules/03-Clients/06-Implementation-Status.md)           | ✅ `?scope=`     | ✅      | ✅               | ✅ platform job + relation guards |
| CRM          | Lead, Deal       | [01-CRM/06](../02-Modules/01-CRM/06-Implementation-Status.md)                   | ✅               | ✅      | ✅               | ✅                                |
| Projects Hub | Project          | [02-Projects-Hub/06](../02-Modules/02-Projects-Hub/06-Implementation-Status.md) | ✅ hub Trash tab | ✅      | ✅               | ✅                                |
| Partners     | Partner          | [08-Partners/06](../02-Modules/08-Partners/06-Implementation-Status.md)         | ✅               | ✅      | ✅               | ✅                                |
| Mail         | EmailThread      | [17-Mail/06](../02-Modules/17-Mail/06-Implementation-Status.md)                 | ✅ Trash folder  | ✅      | —                | ✅                                |

**Profile A manual purge API:** `DELETE …/:id/permanent` on Contact, Company, Lead, Deal, Partner, Project — trashed-only, same relation guards as retention purge, audit `*.permanently_deleted`. Shared ops: `profile-a-permanent-delete.ops.ts`.

**Profile A web:** trash detail sheets — Restore + **Delete permanently** (strong name-match confirm) on Contact, Company, Lead, Deal, Partner, Project.

## Profile B — Drive (`deletedAt` + `status=DELETED`)

| Module | Status doc                                                        | Trash UI         | R2 purge           | Admin cleanup dashboard |
| ------ | ----------------------------------------------------------------- | ---------------- | ------------------ | ----------------------- |
| Drive  | [11-Drive/06](../02-Modules/11-Drive/06-Implementation-Status.md) | ✅ unified Trash | ✅ retention batch | ✅ Drive Insights       |

## Profile C — Credentials (`trashed_at`)

| Module      | Status doc                                                                    | Vault context            | Folder Model 6 | Retention purge |
| ----------- | ----------------------------------------------------------------------------- | ------------------------ | -------------- | --------------- |
| Credentials | [12-Credentials/06](../02-Modules/12-Credentials/06-Implementation-Status.md) | ✅ `scope=active\|trash` | ✅             | ✅ scheduler    |

## Profile D / draft-only (not Trash-first)

| Module                | Mechanism                                | Status                             |
| --------------------- | ---------------------------------------- | ---------------------------------- |
| Finance               | void / cancel / draft-delete             | ✅ Phase 4 — see `todo.md` Phase 4 |
| Tasks                 | empty OPEN draft hard delete only        | ✅ O1 — `trashedAt` deferred       |
| Support               | close workflow, DELETE → 409             | ✅                                 |
| Client Services       | `POST cancel`, terminal `CANCELLED`      | ✅                                 |
| Products / Extensions | terminal delivery status, no hard DELETE | ✅ Phase 3                         |

## Global admin (Phase 7)

| Surface                           | Status doc                                                                          | Shipped                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Trash inventory + retention purge | [16-Settings-Admin/06](../02-Modules/16-Settings-Admin/06-Implementation-Status.md) | ✅ `/settings/trash-inventory`, unified `POST /scheduler/platform-trash-purge` |

## Intentionally unchanged (historical archive, not Trash)

| Module                     | Field / status                   | Decision                                              |
| -------------------------- | -------------------------------- | ----------------------------------------------------- |
| Documents                  | `status ARCHIVED` + `archivedAt` | Historical archive — no Trash migration in this cycle |
| Notifications              | `archivedAt` hide from inbox     | Low-risk; Trash UX later if needed                    |
| CredentialProvider catalog | `archivedAt`                     | Provider catalog deactivate — not vault trash         |

## Shared code

- Types: `packages/shared/src/lifecycle/entity-lifecycle.ts`
- API helpers: `apps/api/src/common/lifecycle/entity-lifecycle-scope.ts`, `entity-lifecycle-guards.ts`
- Registry + purge: `platform-trash-inventory.registry.ts`, `platform-trash-purge.service.ts`
- Profile A manual purge: `profile-a-permanent-delete.ops.ts`, `profile-a-purge-relation-guards.ts`
- Web scope hook: `apps/web` — `useListScope()` (Profile A list pages)

## Related

- Canon: `09-Entity-Lifecycle-Standard.md`
- Work plan: repository root `todo.md` (Platform Trash / Purge Lifecycle)
