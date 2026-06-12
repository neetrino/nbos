# Credentials UX Decisions (working)

> Зафиксированные product/UX решения перед Слайсом A. **Не меняет runtime**, пока не реализовано в web/API.

**Дата:** 2026-06-02 · **Статус:** accepted — пункт 3 (Category/Type) закрыт.

---

## Согласовано

### Create / Edit — Sheet вместо Dialog

- Modal `CreateCredentialDialog` / edit dialog **заменить на Sheet** (side panel).
- Sheet открывается «пустым»; пользователь выбирает kind/type, затем видит только нужные поля.
- Не cramming всех полей в popup.

### Secret fields — dynamic по kind/type

- После выбора kind показываются **только релевантные secret-поля** (login/password, API key, ENV paste, recovery codes, …).
- ENV bundle (**решение 1-A**): paste `.env` → preview key/value → encrypted storage → export/copy as `.env`.

### Vault unlock tiers (решение 6 — 2026-06-02)

Step-up для copy/reveal секретов **зависит от criticality**, не один пароль на каждый клик.

| Действие                            | LOW / MEDIUM                           | HIGH / CRITICAL                                            |
| ----------------------------------- | -------------------------------------- | ---------------------------------------------------------- |
| Copy / reveal live secret           | login session (JWT 7d) достаточно      | **vault unlock 1×/24h** (отдельная server session, не JWT) |
| Edit secret (replace без просмотра) | без step-up                            | без step-up                                                |
| Secret versions (historical)        | login session                          | тот же daily vault unlock                                  |
| Export (any)                        | **fresh password каждый раз**          | **fresh password каждый раз**                              |
| Permanent delete                    | **fresh password каждый раз**          | **fresh password каждый раз**                              |
| Emergency access                    | **fresh password + reason каждый раз** | **fresh password + reason каждый раз**                     |

**API:** `GET /credentials/vault-session`, `POST /credentials/vault-unlock`, `POST /credentials/vault-lock`. Logout сбрасывает vault unlock.

**UI:** unlock **только in-context** — step-up dialog при первом copy/reveal HIGH/CRITICAL за день; отдельного banner/control на vault screen нет. Logout сбрасывает vault unlock.

**Audit:** `credential.vault_unlocked`, `credential.vault_locked`, `credential.secret_copied`, `credential.secret_revealed` — без plaintext.

### Comment (бывш. Notes)

- **Одно поле Comment**, всегда **private** (encrypted at rest, `secureNotes` в DB; `publicNotes` в UI не используем).
- **Видимость (решение 5-A):** пользователь с доступом к credential открывает Sheet → **Comment виден сразу**, без step-up (password/API key/ENV по-прежнему reveal + step-up).
- Comment **не попадает** в list API и search по secret values.
- Любой текст в Comment становится секретом на уровне хранения; доступ к чтению = access grant / access level на credential.

### Criticality и Next rotation

- **4 уровня criticality** сохраняем в модели.
- При create: **auto-assign** по kind/type (и контексту); пользователь не выбирает на основном экране.
- **Settings** (кнопка в Sheet) → Advanced: ручной override criticality, next rotation, прочие редкие поля.

### Vault shell / main screen

- Главный экран Credentials использует существующий NBOS page canon: стандартные tabs/search/actions, без нового визуального паттерна.
- Scope tabs: `All`, `My`, `Team`, `Project`, `Secret`, `Archived`.
- `All` — режим просмотра/поиска/использования по всем доступным credentials. **Create button скрыта** в `All`.
- Создать credential можно только внутри конкретного scope: `My`, `Team`, `Project`, `Secret`. Выбранный scope автоматически передается в create Sheet.
- **Sort** — первый фильтр в панели vault (не strip): default **Recently used** (`sort=recent` → API `recent`), в меню только `Name` / `Newest`; не использовать `all` (это для category-фильтров). Один список; дубликатов нет.
- `Recently used` — порядок по последней vault-активности в audit (30d), затем `createdAt`; учитывает текущий tab/search/quick filters. В `Category Board` sort не меняет Kanban-колонки (данные те же, порядок внутри колонок — по имени).
- **Implemented (2026-06-06):** `GET /api/credentials?sort=recent|name_asc|created_desc` + те же query, что и список. `recent` только для активного vault; `Archived` → всегда `created_desc`. Отдельный `GET /credentials/recent` и partition `excludeIds` **сняты**.

### Vault scopes

| Scope      | Смысл                                            | Access intent                                      |
| ---------- | ------------------------------------------------ | -------------------------------------------------- |
| `My`       | личные рабочие credentials сотрудника            | owner + global vault owners                        |
| `Team`     | низкорисковые общие credentials компании/команды | role-based access; interns/juniors can be excluded |
| `Project`  | credentials клиентов, проектов и продуктов       | project/product team access + role/personal levels |
| `Secret`   | чувствительные company/client credentials        | manual selected people + global vault owners       |
| `Archived` | archived credentials                             | no create                                          |

`Department` как UX-scope не использовать: он путает с org department. Рабочие клиентские credentials живут в `Project`.

### View modes

Credentials module имеет 3 режима отображения одних и тех же данных:

| View mode        | Назначение                          | Внешний минимум                                                                      |
| ---------------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| `List`           | управление, поиск, плотный просмотр | name, login, type/category, provider, owner/rotation badges, quick actions           |
| `Tiles`          | быстро использовать доступ          | compact grid (4→6); shared `CredentialVaultCard` variant `grid`                      |
| `Category Board` | визуальный порядок по category      | Kanban columns; shared `CredentialVaultCard` variant `kanban`; `+` create per column |

- `Category Board` — это именно view mode, не отдельный board-модуль.
- В `Category Board` каждая колонка = category текущего scope.
- Кнопка `+` в колонке открывает create Sheet с уже выбранной `category` этой колонки.
- Карточки/строки не должны показывать лишние details; детали живут в Sheet.
- **Vault card:** один `CredentialVaultCard` (`grid` | `kanban`): accent bar + title + secret pills + footer badges (category, criticality, access). List — table.

### Sheet everywhere

- Один `CredentialFormSheet` / `CredentialSheet` используется для create, open, edit.
- Sheet открывается из List, Tiles, Category Board, Delivery Board, Product page, Finance и других модулей поверх текущего экрана.
- Click по row/card открывает Sheet.
- Исключения: click по login/pass pill на vault card (Tiles / Category Board) копирует без Sheet; password copy для HIGH/CRITICAL — через daily vault unlock (см. решение 6).
- Sheet следует существующему NBOS sheet canon и design components; новый визуальный стиль не придумывать.
- Delete/archive/permanent delete живут в `Settings` внутри Sheet, не как главные действия рядом с copy/use.

### Manual access override in Sheet

- В Sheet показывать отдельный компактный блок **Manual access**.
- Этот блок показывает **только сотрудников, добавленных вручную к конкретному credential**.
- Не показывать в этом блоке всех сотрудников, которые получили доступ через role/RBAC/project/product/team policy.
- Для каждой manual row нужен compact control: `View` / `Edit` / `Remove`.
- Delete/full access не назначается из credential card; delete остается high-level permission через platform/RBAC policy.
- Inherited access можно показывать только как summary/tooltip, например `Inherited: Product team + Role access`, без списка всех сотрудников.

### Прочее (Slice A backlog)

- ~~Step-up dialog вместо `window.prompt` для reveal/copy секретных полей.~~ **Done:** tiered vault unlock (решение 6).
- Фильтры, tab Needs Rotation, pagination — см. архив `docs/archive/todos/2.todo-Credentials.archived.md` Слайс A.

---

## Согласовано — platform access foundation

Access model должен быть платформенным, а не только credentials-specific. Credentials использует этот фундамент первым, затем те же уровни можно применять к Drive, Finance, Project Hub, Tasks и другим модулям.

### Access layers

1. **Role Access Levels** — default access by role/seat.
2. **Personal Access Levels** — employee-level override above/below role default.
3. **Manual Override** — explicit access to one concrete credential from the Sheet.

### Project / Product teams

- Нужна общая team-модель: `ProjectTeamMember` и `ProductTeamMember`.
- Project может иметь несколько admins.
- Project admins управляют самим project, участниками и project-level settings.
- Project participants получают рабочие доступы по своим access levels.
- Product team получает доступ только к своему product context.
- Product team membership **не** дает автоматически project-level access ко всем продуктам проекта.
- Project team level выше product team level: сотрудника можно поднять в Project Team, чтобы он получил project-level access по policy.

### Project credentials access

- `Project` scope credentials считаются через: role default + personal override + project/product team membership + manual override.
- `Product`-linked credential доступен product team этого product и project team, если их access level разрешает.
- `Project`-only credential доступен project team по access level; product team не получает его автоматически.
- Manual override на конкретном credential может дать `View` или `Edit` конкретному сотруднику независимо от inherited access.

### Access levels

- Для manual credential override достаточно `View` и `Edit`.
- Delete/archive/permanent delete не являются manual credential levels.
- Delete должен оставаться отдельным high-level permission для Founder/CEO/Director-level.
- Team scope применяет role-based access к low-risk shared credentials; это не место для critical client/production secrets.

---

## Decision Record — пункт 3: Category vs Credential Type

**Решение:** принять **C-hybrid**.

DB сохраняет оба поля:

- `category` — source of truth for grouping, Category Board columns, quick filters, Delivery slots, Finance/product handoff grouping.
- `credentialType` — source of truth for secret format, dynamic fields, ENV editor, reveal/copy/export behavior and validation.

Эти поля не конкурируют и не заменяют друг друга. Глобального `type -> category` или `category -> type` auto-map не делаем.

### Проблема

Сейчас в UI и DB два параллельных измерения:

| Поле             | Роль в каноне                                | Роль в runtime                                 |
| ---------------- | -------------------------------------------- | ---------------------------------------------- |
| `category`       | группировка, фильтры, Finance/Delivery slots | enum + product access slot `allowedCategories` |
| `credentialType` | обязательные поля, UX формы                  | enum + display                                 |

Пользователь видит оба select — дублирование. Auto-map «type → category» **отклонён** как костыль.

### Рассмотренные варианты

**A — один плоский список «Kind of access»** (~12 пунктов: Login, API key, Database, SSH, ENV, Domain, Hosting, App Store, Mail, Recovery codes, Admin, Other). В DB: `credentialType` = source of truth; `category` derived для slots.

**B — Category расширенный в UI** (+ ENV, RECOVERY_CODES, SSH, …); Format/`credentialType` **скрыт**, auto по category. Slots без ломки.

**C — двухшаговый wizard в Sheet** (не два dropdown на одном экране): «Where used?» → «What stored?» → поля. В DB оба поля; UX не показывает параллельные selects.

Принято не чистое C, а **C-hybrid**:

- scope выбран через vault tab: `My`, `Team`, `Project`, `Secret`;
- category задается/preset-ится контекстом: Category Board column, Delivery slot, Product/Project context или compact category control;
- credentialType выбирается как `What is stored?` / secret format;
- если category уже задана контекстом, не заставлять пользователя выбирать ее снова;
- Sheet не показывает два параллельных dropdown `Category` + `Credential Type` как sibling controls.

### UI rules

1. `Create` возможен только из конкретного scope, не из `All`.
2. `Category Board` column `+` открывает Sheet с preset category.
3. Delivery slot открывает Sheet с slot category и optional `defaultCredentialType`.
4. Product/Project context передается в Sheet и может preset-ить category.
5. `credentialType` управляет dynamic fields:
   - `LOGIN_PASSWORD` → login/password/url;
   - `API_KEY` → api key/token fields;
   - `ENV_BUNDLE` → `.env` paste + preview + export/copy;
   - `SSH_PRIVATE_KEY` → key/passphrase/host-like fields;
   - `RECOVERY_CODES` → encrypted codes/secure field UX;
   - etc.
6. Category can still be changed in Sheet when user explicitly needs it, but it must not duplicate type selection visually.

### Vault scope category sets (2026-06-02)

One DB enum (`ADMIN`, `DOMAIN`, `HOSTING`, `SERVICE`, `APP`, `MAIL`, `API_KEY`, `DATABASE`, `OTHER`), but **UI category options depend on vault scope** — not one global dropdown list.

| Vault scope | Allowed categories in Sheet / Board columns / quick chips            |
| ----------- | -------------------------------------------------------------------- |
| `My`        | MAIL, SERVICE, APP, OTHER                                            |
| `Team`      | SERVICE, MAIL, APP, OTHER                                            |
| `Project`   | ADMIN, DOMAIN, HOSTING, DATABASE, API_KEY, APP, MAIL, SERVICE, OTHER |
| `Secret`    | ADMIN, API_KEY, DATABASE, HOSTING, DOMAIN, OTHER                     |
| `All`       | full enum (search across all accessible credentials)                 |

Implementation: `apps/web/src/features/credentials/constants/credential-vault-categories.ts`. Delivery slot `allowedCategories` intersects with the active scope set.

**Category Board view** uses the platform shared `KanbanBoard` (colored stage headers, column quick-create `+`, card chrome aligned with Support/Finance boards) — not a custom column layout.

### Enum / migration rules

- Do **not** add `ENV`, `SSH`, `RECOVERY_CODES` to `CredentialCategoryEnum`; those are secret formats, not categories.
- Keep existing `CredentialTypeEnum` values for ENV/SSH/recovery.
- Keep Delivery slots category-based.
- Keep `defaultCredentialType` on slots as explicit preset, not hidden magic.
- Seed/import/Bitrix migration must map both fields explicitly.
- No global recomputation of one field from the other.

### Dependencies

- `packages/shared/src/product-access-slots.ts` — `allowedCategories`
- `product-done-readiness.ts` — handoff categories
- `CredentialCategoryEnum` / `CredentialTypeEnum` в Prisma
- Delivery Board create-from-slot presets
- Seed `seed-credentials-demo.ts`
- Bitrix migration mapping (Phase 7)

### Критерии выбора модели

1. Один понятный flow для пользователя, без двух похожих dropdown рядом.
2. Delivery slots и Finance links не ломаются.
3. Без скрытого auto-map, который нельзя объяснить в UI/code/docs.
4. Расширяемость (ENV, recovery, SSH) без второго дублирующего поля.

**Следующий шаг:** можно начинать `CredentialFormSheet` / dynamic fields, используя C-hybrid rules выше.

### Type change safety (lanes, 2026-06-03)

- **L1** (login/password family), **L2** (API key / other secret), **L3** (ENV bundle) — same-lane changes are allowed without confirmation.
- **Cross-lane** change with stored secrets that would not appear in the new type form → **red** path: Sheet dialog + checkbox (R1); client sends `acknowledgeOrphanedSecrets: true` on `PATCH`.
- **API** enforces the same rule via `assertCredentialTypeChangeAllowed` (`packages/shared` `classifyCredentialTypeChange` + `UpdateCredentialDto.acknowledgeOrphanedSecrets`).
- Orphaned secrets remain encrypted in DB; they are hidden in the form until the user switches back to a compatible type.

### Provider catalog (2026-06-03)

- MVP seed list (~38 rows): `08-Credential-Provider-Catalog.md` + `seed-credential-providers.ts`.
- Picker: search + inline create; one DB table (R5, R9).

### OTHER_SECRET (removed 2026-06-03)

- Enum value removed; former rows migrated to `API_KEY`.
- History: `07-OTHER-SECRET-Legacy-Migration.md`.

---

## Favorites + Folders (v1 — 2026-06)

**Статус:** implemented · **Не меняет access model.**

| Концепт    | Смысл                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------- |
| `Favorite` | Личный quick-access флаг сотрудника (`employeeId + credentialId`). Не папка, не rename/delete. |
| `Folder`   | Обычная организация credentials внутри vault scope tab. Не даёт доступ к секретам.             |

**Правила v1**

- Visibility credential остаётся source of truth (Access Level, grants, scope tab).
- Favorites filter — в List / Tiles / Category Board; **не** в Folder view.
- Folder view — отдельный view mode: breadcrumb, nested folders, credentials grid.
- UI v1: одна primary folder membership на credential; storage — many-to-many.
- Bulk add/remove в папку и drag cards на folder cards — в Folder view.

**v1 visibility папок:** папки в рамках scope tab **общие** для всех с доступом к tab; `ownerId` пишется при create, но ACL на папку **не применяется**.

### Отложено — Folder sharing / visibility (не v1)

> Место для будущих product-решений. **Не реализовывать**, пока явно не вынесено в roadmap.

Возможные сценарии (TBD):

- **Private folder** — только owner видит папку внутри shared scope (Team / Project).
- **Share folder** — выдать конкретным сотрудникам видимость папки (аналог Drive folder share); credentials внутри по-прежнему фильтруются credential visibility.
- **Hide folder** — скрыть структуру от остальных без изменения доступа к секретам.

Ограничение канона: **folder grant никогда не открывает credential**, только навигацию/структуру.

Технический задел: `CredentialFolder.ownerId`; отдельной таблицы folder grants в v1 нет. Референс по UX паттерну share (не по security): Drive manual grants.

---

## Ссылки

- План Credentials (архив MVP): `docs/archive/todos/2.todo-Credentials.archived.md`
- План Platform Access Foundation (архив): `docs/archive/todos/1.todo-Access.archived.md`
- Индекс планов: `/todo.md`
- UX канон: `04-Credentials-UX-Workflows.md`
- Cleanup register: `99-Credentials-Cleanup-Register.md`
