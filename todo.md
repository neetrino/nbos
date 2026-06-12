# Platform Trash / Purge Lifecycle — план работ

> **Создано:** 2026-06-12  
> **Контекст:** аудит удаления / хранения «удалённых» элементов по всей NBOS.  
> **Цель:** единая дисциплина `Active → Trash → Purged` вместо разрозненного hard `DELETE` и путаницы `Archive` vs `Trash`.  
> **Канон:** этот файл фиксирует новое решение: **Trash = recoverable deletion**, **Archive = только историческое хранение / old versions / long-term reference**, не универсальная soft-delete стадия.

---

## Зафиксированные решения (2026-06-12)

| #   | Тема                      | Решение                                                                                                                                                                  |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Целевая модель            | **Active → Trash → Purged** для обычного удаления. `Archive` больше **не** используется как generic delete/soft-delete слово                                             |
| D2  | Archive vs Trash          | **Trash** = удалено из работы, можно восстановить. **Archive** = специально сохранено как история/версия/долгосрочная библиотека                                         |
| D3  | Clients + CRM             | **Trash-first обязателен** — hard delete убрать из нормального UX и API                                                                                                  |
| D4  | Finance                   | Posted/confirmed записи — **void/cancel/status**, не `DELETE`; hard delete только draft без связей                                                                       |
| D5  | Projects                  | Project → trash lifecycle; Product/Extension — terminal status, не delete                                                                                                |
| D6  | Global Admin Trash        | Отдельная фаза позже — единый обзор trash + retention/purge rules                                                                                                        |
| D7  | UX                        | В UI: **«Move to Trash»**, не «Archive» и не destructive `Delete`; permanent — только Danger zone / Admin + подтверждение                                                |
| D8  | Архитектура               | **Один Lifecycle Framework** на платформу + **профили A–F** — не один clone Credentials на все модули                                                                    |
| D9  | Scope / split-brain       | Любой экран `active \| trash`: **один `scope` на весь view** — все list/count/sidebar запросы согласованы; сброс navigation state при смене scope                        |
| D10 | Organization vs lifecycle | Папки, tags, board columns — **организация**, не lifecycle. Lifecycle только на business record. Новые коллекции → Model 4+6 (как Credentials folders), не Drive Model 3 |
| D11 | Query param               | Единый `?scope=active\|trash`; **не** разрозненные `includeArchived` / `isArchived` filter без контекста                                                                 |

### Термины (обязательно для реализации)

| Термин                      | Значение                                                                         | Использовать для                                              |
| --------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Trash**                   | recoverable deletion: объект убран из обычной работы, но может быть восстановлен | Contact, Company, Lead, Deal, Project, Drive file, Credential |
| **Purge**                   | окончательное удаление / уничтожение данных, обычно admin/job/policy             | storage cleanup, GDPR/manual cleanup, test data cleanup       |
| **Archive**                 | историческое хранение, old versions, completed reference material; **не delete** | old document versions, old policies, historical libraries     |
| **Void / Cancel / Reverse** | бизнес-отмена факта, без стирания истории                                        | Finance posted/confirmed records                              |
| **Inactive**                | справочник больше не используется как active option                              | system lists, roles/departments/config                        |

### Credentials — зафиксированные решения (2026-06-12, архитектурный аудит)

| #      | Тема                           | Решение                                                                                                                                                                           |
| ------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C1** | Смысл trash для **credential** | **Lifecycle state** (`trashedAt` target; runtime пока `archivedAt`) + отдельный **Vault Context** `active \| trash` — не просто filter на одном query при живой folder navigation |
| **C2** | Папки vs секреты               | **Model 4** (как 1Password/Bitwarden): папка = **collection / группировка**, не владелец секрета. **Не** копировать Drive Model 3 (папка + дети в Trash)                          |
| **C3** | Delete **folder**              | **Model 6 (empty-only):** пустая папка (0 creds, 0 child folders) → **hard delete** строки; непустая → **блок** с понятной ошибкой. **Не archive folder**                         |
| **C4** | Trash **credential**           | `trashedAt` target / `archivedAt` transitional + **снять все folder memberships**; restore → Active **без** авто-возврата в старые папки                                          |
| **C5** | Credential Trash UI            | **Flat list** (list/tiles/table): **без** folder tree, project shells, drag-drop. Сброс `activeFolderId` / `activeProjectId` при входе в trash                                    |
| **C6** | Что **не** переписывать        | Encryption, reveal/copy/step-up, RBAC/visibility, providers, form sheet, bulk archive/restore/permanent                                                                           |

**Модели (справочник):**

| Model               | Суть                                   | Credentials    |
| ------------------- | -------------------------------------- | -------------- |
| 1 Cascade           | Удали папку → всё внутри               | ❌             |
| 2 Unfile            | Убрал папку → items active без папки   | ⚠️ без guard   |
| 3 Drive/Trash tree  | Папка + дети в одну корзину            | ❌ для vault   |
| 4 Collection        | Папка не владеет секретами             | ✅ база        |
| 5 Dialog            | «Что сделать с N items?»               | ⏳ backlog     |
| 6 Empty-only delete | Непустая папка — блок; пустая — delete | ✅ для folders |

**Корневая проблема (текущий runtime):** `includeArchived` переключает только список credentials; folders API всегда `archivedAt: null`; memberships при archive cred не чистятся; archived/trash mode не отключает folders view → split-brain UI.

**Credentials = Profile C** — отдельный от большинства модулей; **не шаблон** для Clients/CRM.

---

## Lifecycle Profiles (платформа)

> **Framework** — общий контракт (D1, D8–D11, API naming, `trashedAt`/transitional `archivedAt`, audit).  
> **Profile** — поведение конкретного типа сущности.

| Profile                    | Суть                                                 | Стадии                                      | Модули                                                         |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------- |
| **A — Business entity**    | Запись с историей; list + sheet, **без** folder tree | `active → trash → purged/admin policy`      | Contact, Company, Lead, Deal, Partner, Project                 |
| **B — File asset**         | Файл + storage; unlink отдельно                      | `active → trash → purged`                   | Drive FileAsset, DriveFolder                                   |
| **C — Secret vault**       | Секрет + collections; **trash = flat secure view**   | `active → trash → purged`                   | Credential (+ folders Model 6)                                 |
| **D — Financial record**   | Audit trail критичен                                 | `draft → posted` + **void/cancel**          | Invoice, Order, Payment, Expense                               |
| **E — Config / reference** | Справочник                                           | `active / inactive` или guarded hard delete | System lists, Roles, Departments                               |
| **F — Ephemeral / inbox**  | Личное / временное                                   | hide или hard delete                        | Notifications, dashboard notes                                 |
| **G — Historical archive** | Не удаление, а хранение старой истории/версий        | `active/current → archived reference`       | Document versions, old policies, completed reference libraries |

### Матрица: модуль → профиль

| Модуль                | Profile    | Trash / Archive UI                                                                  | Organization layer               | Permanent delete   |
| --------------------- | ---------- | ----------------------------------------------------------------------------------- | -------------------------------- | ------------------ |
| Clients               | **A**      | Active ↔ Trash (тот же list/sheet)                                                  | —                                | ✅ API + trash UI  |
| CRM                   | **A**      | То же                                                                               | —                                | ✅ API + trash UI  |
| Projects              | **A**      | `trashedAt` target (заменить `isArchived` boolean — O3)                             | Delivery tabs ≠ trash            | ✅ API + trash UI  |
| Products / Extensions | **A-lite** | Terminal **status** (Closed/Cancelled), не delete                                   | —                                | —                  |
| Drive files           | **B**      | **Один Trash view**; старые Archive+Trash схлопнуть                                 | Folders = container (Model 3)    | Cleanup job        |
| Credentials           | **C**      | **Отдельный flat secure Trash**                                                     | Folders = collection (Model 4+6) | Step-up из trash   |
| Documents             | **G/A**    | `ARCHIVED` оставить только если это historical archive; delete UX должен быть Trash | Sections (TBD)                   | Нет в MVP          |
| Finance               | **D**      | Void/cancel, не trash для posted                                                    | —                                | Draft-only delete  |
| Tasks                 | **O1**     | Hybrid: empty OPEN draft hard delete; else `trashedAt`                              | Board columns ≠ archive          | ✅ Trash + restore |
| Support               | **A-lite** | Close status                                                                        | —                                | Убрать hard delete |
| Partners              | **A**      | `trashedAt`                                                                         | —                                | Policy             |
| System / RBAC         | **E**      | deactivate                                                                          | —                                | Empty-only guards  |
| Notifications         | **F**      | hide/trash depending on UX                                                          | —                                | —                  |

### Правила против split-brain (все профили)

| #      | Правило                                                                                      |
| ------ | -------------------------------------------------------------------------------------------- |
| **R1** | Один `scope` на весь экран: list, counts, stats, sidebar — **все** с тем же scope            |
| **R2** | Смена `active → trash` → **сброс** navigation state (folderId, projectId, openId если нужно) |
| **R3** | В trash **не грузить** active-only endpoints (folders, shells, child nav)                    |
| **R4** | Trash side-effects — **одна транзакция** + audit (снять memberships, tags — явно в профиле)  |
| **R5** | **Не клонировать** Credentials folders UX в Profile A модули                                 |

### Profile A — эталон для Clients/CRM (простой)

```text
GET  /contacts?scope=active|trash        -- default active
DELETE /contacts/:id                     → move to Trash (trashedAt)
POST /contacts/:id/restore               → trashedAt = null
DELETE /contacts/:id/permanent           → purge (guards + audit) — ✅ API shipped

UI: тот же list + sheet; переключатель scope в settings / filter;
    НЕТ второго navigation layer в trash.
```

**Открыто на обсуждение** (обновить после чата):

- [x] **O1:** Tasks — hard delete только для empty draft или move to Trash? → **Решение:** hybrid (draft hard-delete; иначе `trashedAt`). ✅ Shipped `20260612210000` + web Trash view.
- [x] **O2:** Mail threads — trash-first (`trashedAt` + restore); hard delete только admin/purge позже → **Phase 7.1 backlog**
- [x] **O3:** Project — `isArchived` boolean vs `trashedAt` timestamp (выровнять с Core Entities)? → **Решение:** `trashedAt` target; `isArchived` transitional sync до удаления колонки.
- [x] **O4:** Нужен ли общий `deletedAt`/`trashedAt` для business entities или достаточно `archivedAt`? → **Решение:** target `trashedAt`; `Archive` не использовать для delete semantics.
- [x] **O5:** Purge retention — env vars `PLATFORM_TRASH_RETENTION_DAYS_*` + registry 30d (без Admin UI)

---

## Текущее состояние (baseline аудита)

### ✅ Уже правильно / эталон

| Модуль              | Механизм                                                       | Статус                                                                                       |
| ------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Credentials         | `scope=active\|trash`, trash side-effects, folders Model 5/6   | ✅ DONE — `trashed_at`; offboarding grant/allow-list revoke + audit shipped                  |
| Credential folders  | empty-only delete (Model 6)                                    | ✅ DONE (C1.4–C1.6, C-O2 drop `archived_at`)                                                 |
| Drive FileAsset     | unified Trash lifecycle + retention purge + cleanup dashboard  | ✅ DONE (6.1–6.5)                                                                            |
| Drive folders       | `deletedAt` soft delete пустых папок                           | ✅ DONE                                                                                      |
| Documents           | `status ARCHIVED` + `archivedAt`, restore, **нет hard delete** | ⚠️ проверить: если это delete UX — переименовать в Trash; если historical archive — оставить |
| Notifications       | `archivedAt`, hide from inbox                                  | ⚠️ low-risk; можно оставить hide или перевести UX на Trash позже                             |
| Checklist templates | `status ARCHIVED`                                              | ⚠️ вероятно historical/config archive; не менять без проверки                                |
| Report schedules    | `status ARCHIVED`                                              | ⚠️ вероятно inactive/archive; не менять без проверки                                         |
| System lists        | `isActive: false` (deactivate)                                 | ✅ DONE                                                                                      |
| Employees           | offboard → `TERMINATED`, не delete                             | ✅ DONE                                                                                      |
| Roles / Departments | guarded hard delete (нет members)                              | ✅ OK для config                                                                             |

### ❌ Неправильно vs канон (hard delete)

| Модуль          | Сущности                | Schema lifecycle                       | API                             | Web UI                                                      |
| --------------- | ----------------------- | -------------------------------------- | ------------------------------- | ----------------------------------------------------------- |
| Clients         | Contact, Company        | ✅ `trashedAt`                         | Trash + restore + permanent API | Move to Trash / Restore (Profile A)                         |
| CRM             | Lead, Deal              | ✅ `trashedAt`                         | Trash + restore + permanent API | Move to Trash / Restore (Profile A)                         |
| Projects Hub    | Product, Extension      | ✅ terminal status                     | cancel/complete only            | hard DELETE removed                                         |
| Projects        | Project                 | ✅ `trashedAt` (dropped `is_archived`) | Trash + restore + permanent API | Move to Trash / Restore (Profile A)                         |
| Tasks           | Task                    | ✅ `trashedAt` + draft guards          | hybrid DELETE + restore         | Trash view + Move to Trash / Restore / Delete draft         |
| Support         | Ticket                  | ✅ close workflow                      | DELETE → 409                    | no delete UI                                                |
| Finance         | Invoice, Order, Payment | 🟡 Profile D guards                    | cancel / draft-delete           | Invoice cancel API; Order draft-only                        |
| Finance         | Expense                 | ✅ cancel + draft guards               | `POST cancel` / guarded DELETE  | Expense UI delete vs cancel                                 |
| Finance         | Expense Plan            | ✅ empty-only delete                   | guarded DELETE                  | non-empty plan → 409                                        |
| Partners        | Partner                 | ✅ `trashedAt`                         | Trash + restore + permanent API | Move to Trash / Restore (Profile A)                         |
| Client Services | Record                  | ✅ terminal `CANCELLED`                | `POST cancel`; DELETE → 409     | Cancel service UI (Profile A-lite)                          |
| Mail            | EmailThread             | ✅ `trashedAt`                         | trash + restore + permanent API | Trash folder + Move to Trash / Restore / Delete permanently |

### ⚠️ Partial / backlog

| Область     | Что не доделано                                                              |
| ----------- | ---------------------------------------------------------------------------- |
| Drive       | ✅ DONE (6.1–6.5); optional polish only                                      |
| Credentials | offboarding rotation tasks + revealed-history inventory (canon §Offboarding) |
| Documents   | ✅ historical archive (решено) — не трогать в этом цикле                     |
| Global      | Tasks platform purge / permanent delete (post-O1)                            |

---

## Платформенный контракт (целевой — реализовать в Phase 0)

**Применяется к Profile A, B, C.** Profile D/E/F/G — см. матрицу выше.

```text
DELETE  /entities/:id              → move to Trash (НЕ prisma.delete) [A, B, C]
POST    /entities/:id/restore      → restore from Trash               [A, B, C]
DELETE  /entities/:id/permanent    → purge (guards + audit)           [A, B, C]
GET     /entities?scope=active|trash                                  [A, B, C]
```

**Минимальные поля (Profile A business entities):**

```text
trashedAt   DateTime?   -- шаг 1: убрать из normal lists; recoverable deletion
trashedById String?     -- опционально
purgedAt    DateTime?   -- шаг 2: job/admin/policy; окончательное удаление
```

**Transitional naming rule:** если в runtime уже есть `archivedAt`/`deletedAt`, не делать blind rename без миграции. Для новых Profile A сущностей использовать target name `trashedAt`. Для Drive можно временно использовать существующий `deletedAt` как trash timestamp, но UI/API должны говорить `Trash`.

**Shared helpers (Phase 0):**

- [x] `packages/shared` — `EntityLifecycleScope = active|trash`, `LifecycleProfile` enum (A–G), action name constants
- [x] `apps/api` — `buildScopeWhere(scope)`, `assertEntityIsActive()` / `assertEntityIsTrashed()`, Drive transitional helper
- [x] `apps/web` — `useListScope()` hook: scope + reset navigation on change (R1–R3)
- [x] Документ `docs/NBOS/03-Business-Logic/09-Entity-Lifecycle-Standard.md` — Framework + Profiles A–G

---

## Фазы работ

### Phase 0 — Platform standard & helpers

**Цель:** Lifecycle Framework + Profiles A–G; Profile A модули не копируют Credentials.

| #   | Задача                                                                                                   | Статус     |
| --- | -------------------------------------------------------------------------------------------------------- | ---------- |
| 0.1 | Canon doc: Framework + Profiles A–G + rules R1–R5 + Archive vs Trash terminology                         | ✅ DONE    |
| 0.2 | Shared types: `EntityLifecycleScope`, `LifecycleProfile`, API naming                                     | ✅ DONE    |
| 0.3 | Nest: `buildScopeWhere()`, trash/restore guards                                                          | ✅ DONE    |
| 0.4 | Web: `useListScope` pattern (scope switch + navigation reset)                                            | ✅ DONE    |
| 0.5 | Закрыть open questions O1–O5                                                                             | ✅ DONE    |
| 0.6 | Миграция query params → `scope=active\|trash` (Credentials: `scope` added, `includeArchived` deprecated) | 🟡 PARTIAL |

**Done when:** Profile A модуль (Clients) подключает Trash без folder/vault логики Credentials. → **✅ достигнуто (Phase 1).**

---

### Phase 1 — Clients (Contact + Company) — P0 ✅

**Profile A** — простой scope-only Trash; **без** folders, **без** Credentials patterns.

**Канон:** `00-Clients-Overview.md` §7, `06-Implementation-Status.md`.

| #   | Задача                                                                                         | Статус  |
| --- | ---------------------------------------------------------------------------------------------- | ------- |
| 1.1 | Migration: `contacts.trashed_at`, `companies.trashed_at` (+ indexes; optional `trashed_by_id`) | ✅ DONE |
| 1.2 | API Profile A: `scope=active\|trash`; DELETE → move to Trash; POST restore; убрать hard delete | ✅ DONE |
| 1.3 | Guards: trash всегда (MVP); block update/restore guards; active-deals block — backlog          | ✅ DONE |
| 1.4 | Web: Delete → Move to Trash; scope switch Active/Trash; **тот же list/sheet** (R1–R2)          | ✅ DONE |
| 1.5 | Portfolio / lists: `scope=active` по умолчанию                                                 | ✅ DONE |
| 1.6 | Tests: scope isolation, trash, restore, guards                                                 | ✅ DONE |
| 1.7 | Обновить `06-Implementation-Status.md`                                                         | ✅ DONE |

**Done when:** Profile A reference implementation для CRM и остальных A-модулей. → **✅ достигнуто.**

---

### Phase 2 — CRM (Lead + Deal) — P0 ✅

**Profile A** — копировать паттерн Phase 1 (не Credentials).

| #   | Задача                                                                | Статус  |
| --- | --------------------------------------------------------------------- | ------- |
| 2.1 | Migration: `leads.trashed_at`, `deals.trashed_at`                     | ✅ DONE |
| 2.2 | API Profile A: `scope`, trash, restore (reuse helpers из 0.3)         | ✅ DONE |
| 2.3 | Guards: Deal WON — move to Trash ok, permanent never MVP              | ✅ DONE |
| 2.4 | Web: Delete → Move to Trash; scope switch; kanban `scope=active` only | ✅ DONE |
| 2.5 | Stats / pipeline: trashed excluded (R1)                               | ✅ DONE |
| 2.6 | Tests                                                                 | ✅ DONE |

**Done when:** CRM = Profile A как Clients. → **✅ достигнуто.**

---

### Phase 3 — Projects Hub — P1 ✅ DONE

**Profile A** (Project) + **A-lite** (Product/Extension = terminal status).

| #   | Задача                                                                      | Статус  |
| --- | --------------------------------------------------------------------------- | ------- |
| 3.1 | Решить O3: `isArchived` → `trashedAt` для Project (Profile A)               | ✅ DONE |
| 3.2 | UI: action «Move project to Trash»; tab Archived → Trash                    | ✅ DONE |
| 3.3 | `DELETE /projects/:id` → move to Trash; POST restore                        | ✅ DONE |
| 3.4 | Product / Extension: terminal status (`LOST`/`DONE` + cancel) вместо delete | ✅ DONE |
| 3.5 | API guards + web (hub scope, portfolio/shells active-only)                  | ✅ DONE |
| 3.6 | Delivery board: trashed projects excluded from active board                 | ✅ DONE |

**Done when:** Projects Hub = Profile A для Project; Product/Extension без hard delete. → **✅ достигнуто.**

---

### Phase 4 — Finance — P1 ✅ DONE

**Profile D** — void/cancel, **не** Profile A Trash для posted records.

| #   | Задача                                                              | Статус                                                                      |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 4.1 | Audit: маппинг сущностей на void/cancel vs draft-delete (Profile D) | ✅ DONE                                                                     |
| 4.2 | Invoice / Order / Payment: void/cancel flows вместо delete          | ✅ DONE                                                                     |
| 4.3 | Expense: delete только `PLANNED`/draft; иначе cancel                | ✅ DONE                                                                     |
| 4.4 | Expense Plan: trash или deactivate? решить по связям/учету          | ✅ DONE                                                                     |
| 4.5 | Web: убрать destructive delete для posted records                   | ✅ DONE                                                                     |
| 4.6 | Journal / audit trail: все void actions logged                      | ✅ DONE — accrual lines `REVERSED` on invoice/expense cancel & draft delete |

**Done when:** Finance Profile D guards + cancel/close UI + journal reversal on void. → **✅ достигнуто.**

**Profile D mapping (4.1):**

| Сущность     | Draft hard delete                       | Cancel / void                  |
| ------------ | --------------------------------------- | ------------------------------ |
| Invoice      | `moneyStatus=NEW`, no payments          | `POST …/cancel` → `CANCELLED`  |
| Order        | `PENDING_PAYMENT`, no invoices          | `POST …/close` → `CLOSED`      |
| Payment      | delete only in open posting period      | reversal via delete (existing) |
| Expense      | `PLANNED`, no payments, no payroll link | `POST …/cancel` → `CANCELLED`  |
| Expense Plan | empty-only (0 expense cards)            | `autoGenerate: false` (update) |

---

### Phase 5 — Tasks, Support, Partners, Client Services — P2

| #   | Задача                                 | Profile | Статус                                                                        |
| --- | -------------------------------------- | ------- | ----------------------------------------------------------------------------- |
| 5.1 | Tasks                                  | draft   | ✅ DONE — `assertTaskDraftDeletable`; web Delete draft (empty OPEN only)      |
| 5.2 | Support — close status, no hard delete | A-lite  | ✅ DONE — API 409; swagger; removed dead `supportApi.delete`                  |
| 5.3 | Partners — `trashedAt`                 | A       | ✅ DONE — migration `20260612150000`; API scope/trash/restore; web Trash view |
| 5.4 | Client Services — cancel / trash       | A-lite  | ✅ DONE — `POST cancel`; DELETE blocked; lists exclude CANCELLED              |

---

### Phase C — Credentials Vault Context & Folders — P0 (можно параллельно Phase 0–1)

**Profile C** — единственный модуль с flat secure Trash + folder collections. **Не** шаблон для других модулей.

**Цель:** убрать split-brain между Active / Trash и папками; Model 4 + Model 6. **Не** full rewrite (см. C6).

**Naming transition:** runtime сейчас использует `includeArchived`, `archivedAt`, `archiveCredential`. Реализация должна перевести UX/API wording на Trash. DB rename до `trashedAt` можно сделать отдельной миграцией; если slice маленький, допустим transitional backend naming при новом UI wording.

**Диагностика (уже известно):**

- `credential-list-where.ts` — только `includeArchived` на credentials (target: `scope=active|trash`)
- `credential-folders.operations.ts` — folders всегда active; `archiveCredentialFolder` — убрать
- `credentials-mutation.operations.ts` — archive cred не чистит memberships
- `use-credentials-vault-page.ts` — trash/archived не сбрасывает folder/project; folders fetch в trash
- `listCredentialProjectShells` — не учитывает `includeArchived`

#### Phase C0 — Hotfix UI (1–2 дня)

| #    | Задача                                                                                 | Статус  |
| ---- | -------------------------------------------------------------------------------------- | ------- |
| C0.1 | При `vaultListScope === 'trash'`: force view `list` или `tiles` (disable folders mode) | ✅ DONE |
| C0.2 | `setVaultListScope('trash')` → reset `activeFolderId`, `activeProjectId`               | ✅ DONE |
| C0.3 | Trash: не вызывать `listFolders` / `listProjectShells`                                 | ✅ DONE |
| C0.4 | Web tests / manual: Trash не показывает active folder blocks                           | ✅ DONE |

**Done when:** Trash экран — только flat credentials, без active folder tree.

#### Phase C1 — Backend consistency (3–5 дней)

| #    | Задача                                                                                | Статус  |
| ---- | ------------------------------------------------------------------------------------- | ------- |
| C1.1 | `scope=active\|trash` на credentials list (`includeArchived` deprecated)              | ✅ DONE |
| C1.2 | `archiveCredential` / bulk → `deleteMany` folder memberships в той же транзакции      | ✅ DONE |
| C1.3 | Folder `credentialCount` = active memberships (`archivedAt IS NULL`)                  | ✅ DONE |
| C1.4 | `deleteCredentialFolder` empty-only hard delete (Model 6)                             | ✅ DONE |
| C1.5 | Непустая папка → `409 Conflict` «Move credentials to Trash or remove them first»      | ✅ DONE |
| C1.6 | `DELETE folders/:id` → empty-only delete; audit `credential_folder.deleted`           | ✅ DONE |
| C1.7 | `listProjectShells` — только active credentials                                       | ✅ DONE |
| C1.8 | API tests: trash cred clears memberships; delete empty folder; block non-empty folder | ✅ DONE |

**Done when:** API и counts согласованы с C1–C5.

#### Phase C2 — UX polish (2–3 дня)

| #    | Задача                                                                    | Статус  |
| ---- | ------------------------------------------------------------------------- | ------- |
| C2.1 | Folder card: «Delete» вместо «Archive»; confirm только для пустой папки   | ✅ DONE |
| C2.2 | Trash: filters (category, project, sort by trash date)                    | ✅ DONE |
| C2.3 | Restore credential: toast «Returned to vault (unfiled)» — без auto-folder | ✅ DONE |
| C2.4 | Empty states: unfiled section в folders view                              | ✅ DONE |

#### Phase C3 — Backlog (после C0–C2)

| #    | Задача                                                                                  | Статус  |
| ---- | --------------------------------------------------------------------------------------- | ------- |
| C3.1 | Optional Model 5: «Remove folder grouping» = unfile all + delete folder (one action)    | ✅ DONE |
| C3.2 | Retention TTL + scheduled purge trashed credentials                                     | ✅ DONE |
| C3.3 | Синхронизировать `99-Credentials-Cleanup-Register.md` с решениями C1–C6                 | ✅ DONE |
| C3.4 | Migration: очистить `credential_folders.archived_at` у уже archived folders (если есть) | ✅ DONE |

**Credentials open (после обсуждения):**

- [x] **C-O1:** Favorites при trash credential — **снимать** при archive (single + bulk)
- [x] **C-O2:** `archived_at` на `credential_folders` — **DROP** migration `20260612180000`

---

### Phase 6 — Drive completion — P2

**Profile B** — один Trash + Purge; folder = container (Model 3), **не** как Credentials folders.

| #   | Задача                                                                                           | Статус  |
| --- | ------------------------------------------------------------------------------------------------ | ------- |
| 6.1 | Drive: схлопнуть Archive + Trash UI в один Trash view                                            | ✅ DONE |
| 6.2 | Drive API: unified trash list/counts; archive endpoints transitional; UI Move to Trash / Restore | ✅ DONE |
| 6.3 | Drive DB: миграция `ARCHIVED` → trash (transitional OR в trash query до отдельной миграции)      | ✅ DONE |
| 6.4 | Drive: R2 physical purge после retention (`markRetentionPurged` → real delete)                   | ✅ DONE |
| 6.5 | Drive: admin cleanup dashboard (confirmed apply)                                                 | ✅ DONE |

---

### Phase 7 — Mail & Global Admin Trash — P3

| #   | Задача                                                          | Статус  |
| --- | --------------------------------------------------------------- | ------- |
| 7.1 | Mail: trash-first (`trashedAt` + restore + retention purge 30d) | ✅ DONE |
| 7.2 | Admin page: cross-module trash inventory                        | ✅ DONE |
| 7.3 | Retention rules engine (per entity type)                        | ✅ DONE |
| 7.4 | Purge jobs + audit                                              | ✅ DONE |

---

## Порядок выполнения (рекомендуемый)

```text
Phase 0 (platform standard)       — сначала зафиксировать Trash terminology/types
Phase 6.1–6.3 (Drive simplify)    — схлопнуть Archive+Trash, чтобы не плодить два режима
Phase C0 (Credentials UI hotfix)  — можно сразу, снимает боль в vault
Phase C1 (Credentials backend)    — сразу после C0
Phase 1 (Clients) → Phase 2 (CRM) → …
Phase C2–C3, Phase 6.4–7          — polish + global
```

**Первые slices для кода:**

1. **Platform:** Phase 0.1–0.3 — shared Trash language, helpers, docs
2. **Drive:** Phase 6.1–6.3 — один Trash вместо Archive+Trash
3. **Credentials:** C0 → C1 — flat secure Trash, folder split-brain fix
4. **Clients:** Phase 1 — первый чистый Profile A reference

---

## Чеклист «не забыть»

- [x] После каждой фазы — обновить этот файл (статусы ⬜ → ✅)
- [x] Module canon / Implementation-Status docs синхронизировать с runtime (`10-Platform-Lifecycle-Implementation-Status.md` + per-module `06-*`)
- [ ] Не ломать security/RBAC Credentials и access/R2 правила Drive при терминологическом рефакторе
- [ ] Permanent delete / purge всегда: trash-only + audit + confirmation
- [ ] List queries по умолчанию: `scope=active` / `trashedAt IS NULL` (или transitional `deletedAt/archivedAt IS NULL`)
- [ ] Новый модуль: сначала выбрать **Profile A–G**, не копировать Credentials
- [ ] R1–R5: один scope на view, reset nav, no split-brain

---

## Журнал изменений плана

| Дата       | Что изменили                                                                                                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-12 | Создан план по результатам platform-wide audit deletion/archive                                                                                                                                                  |
| 2026-06-12 | Добавлен **Phase C** (Credentials): Model 4 + Model 6, vault context, C0–C3; решения C1–C6                                                                                                                       |
| 2026-06-12 | **Lifecycle Profiles A–F**, D8–D11, R1–R5; матрица модулей; Phase 0–6 привязаны к профилям                                                                                                                       |
| 2026-06-12 | **Решение пользователя:** generic `Archive` заменить на **Trash**. Новый канон: `Active → Trash → Purged`; `Archive` оставить только для historical storage / old versions / reference                           |
| 2026-06-12 | **Phase 0** shipped: `09-Entity-Lifecycle-Standard.md`, `@nbos/shared` lifecycle types, API `buildScopeWhere`, web `useListScope`                                                                                |
| 2026-06-12 | **Drive 6.1** + **Credentials C0/C1** slice: unified Trash UI, scope param, folder empty-delete, trash side-effects                                                                                              |
| 2026-06-12 | **Cleanup:** мёртвый archive-код убран (Drive library, web archive API, entity attachments, credentials rename deleteFolder/trashList/onRequestMoveToTrash)                                                      |
| 2026-06-12 | **Phase 1 Clients** shipped: `trashed_at` migration, Profile A API (`scope`, trash, restore), web scope switch + Move to Trash / Restore, portfolio active-only                                                  |
| 2026-06-12 | **Phase 2 CRM** shipped: Lead/Deal `trashed_at`, Profile A API + stats active-only, web Trash view (list-only), Move to Trash / Restore on leads & deals sheets                                                  |
| 2026-06-12 | **Phase 3 Projects Hub** shipped: Project `trashed_at` migration, Profile A trash/restore, hub Trash tab, delivery board excludes trashed projects; Product/Extension hard DELETE removed (cancel/complete only) |
| 2026-06-12 | **Phase 4 Finance (slice):** Profile D guards (`finance-record-lifecycle-guards`), Invoice/Expense cancel endpoints, draft-only delete; Expense web delete vs cancel; Expense Plan empty-only delete             |
| 2026-06-12 | **Phase 4 Finance (complete):** Order `POST /close`, journal accrual `REVERSED` on void; Invoice/Order lifecycle actions in web sheets                                                                           |
| 2026-06-12 | **Drive 6.5** + **Credentials C3** + **Phase 7.2:** admin cleanup dashboard; credential folder grouping + retention purge; Settings Trash inventory (`GET /platform/lifecycle/trash-inventory`)                  |
| 2026-06-12 | **Phase 7.3–7.4:** retention resolver (env overrides), unified purge (`POST /platform/lifecycle/purge/run`, `POST /scheduler/platform-trash-purge`), admin Run retention purge UI                                |
| 2026-06-12 | **Решения O2/O5/C-O1/C-O2** + Profile A auto-purge (Lead/Deal/Partner/Contact/Company/Project с relation guards)                                                                                                 |
| 2026-06-12 | **Phase 7.1 Mail:** `trashed_at` migration, trash/restore API, Trash folder UI, unified purge + inventory (`mail_thread`, 30d TTL)                                                                               |
| 2026-06-12 | **Rename slice:** `credentials.archived_at` → `trashed_at`; DROP `projects.is_archived`; registry, seeds, cross-module queries                                                                                   |
| 2026-06-12 | **Docs:** `10-Platform-Lifecycle-Implementation-Status.md` + per-module `06-Implementation-Status.md` (CRM, Hub, Partners, Credentials, Drive, Mail, Settings); Clients status synced                            |
| 2026-06-12 | **Profile A permanent delete API:** `DELETE …/permanent` для Contact, Company, Lead, Deal, Partner, Project — shared ops + relation guards + audit `*.permanently_deleted`                                       |
| 2026-06-12 | **Profile A permanent delete web:** trash detail sheets — Restore + Delete permanently (`ProfileAPermanentDeleteDialog`, strong name-match) для Clients, CRM, Partners, Projects                                 |
| 2026-06-12 | **Credentials offboarding:** revoke grants + SECRET `allowedEmployees` + favorites on offboard; audit `credential.access_revoked` per credential; HR preview shows unified credential access footprint           |
| 2026-06-12 | **Mail permanent delete:** `DELETE /mail/threads/:id/permanent` (trashed-only, cascade + audit `mail.thread_permanently_deleted`); Trash detail UI with strong name confirm                                      |
