# Credentials UX Decisions (working)

> Зафиксированные product/UX решения перед Слайсом A. **Не меняет runtime**, пока не реализовано в web/API.

**Дата:** 2026-06-02 · **Статус:** partial — пункт 3 (Category/Type) открыт.

---

## Согласовано

### Create / Edit — Sheet вместо Dialog

- Modal `CreateCredentialDialog` / edit dialog **заменить на Sheet** (side panel).
- Sheet открывается «пустым»; пользователь выбирает kind/type, затем видит только нужные поля.
- Не cramming всех полей в popup.

### Secret fields — dynamic по kind/type

- После выбора kind показываются **только релевантные secret-поля** (login/password, API key, ENV paste, recovery codes, …).
- ENV bundle (**решение 1-A**): paste `.env` → preview key/value → encrypted storage → export/copy as `.env`.

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
- Под стандартными tabs/search может быть компактный блок `Recently used` / `Frequently used`, визуально как часть страницы, с тонким разделителем и compact cards.
- `Recently/Frequently used` показывать только в `List` и `Tiles` view. В `Category Board` не показывать.

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

| View mode        | Назначение                          | Внешний минимум                                                            |
| ---------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| `List`           | управление, поиск, плотный просмотр | name, login, type/category, provider, owner/rotation badges, quick actions |
| `Tiles`          | быстро использовать доступ          | name, login, provider/type, `copy login`, `copy password`, `open URL`      |
| `Category Board` | визуальный порядок по category      | columns by category, credential cards, `+` create на каждой колонке        |

- `Category Board` — это именно view mode, не отдельный board-модуль.
- В `Category Board` каждая колонка = category текущего scope.
- Кнопка `+` в колонке открывает create Sheet с уже выбранной `category` этой колонки.
- Карточки/строки не должны показывать лишние details; детали живут в Sheet.

### Sheet everywhere

- Один `CredentialFormSheet` / `CredentialSheet` используется для create, open, edit.
- Sheet открывается из List, Tiles, Category Board, Delivery Board, Product page, Finance и других модулей поверх текущего экрана.
- Click по row/card открывает Sheet.
- Исключения: click по `copy login`, `copy password`, `open URL` выполняет quick action без открытия Sheet.
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

- Step-up dialog вместо `window.prompt` для reveal/copy секретных полей.
- Фильтры, tab Needs Rotation, pagination — см. `2.todo-Credentials.md` Слайс A.

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

## Открыто — пункт 3: Category vs Credential Type

**Блокер для реализации Sheet/form.** Нужен отдельный глобальный аудит до миграции enum/UI.

### Проблема

Сейчас в UI и DB два параллельных измерения:

| Поле             | Роль в каноне                                | Роль в runtime                                 |
| ---------------- | -------------------------------------------- | ---------------------------------------------- |
| `category`       | группировка, фильтры, Finance/Delivery slots | enum + product access slot `allowedCategories` |
| `credentialType` | обязательные поля, UX формы                  | enum + display                                 |

Пользователь видит оба select — дублирование. Auto-map «type → category» **отклонён** как костыль.

### Варианты для аудита (выбрать одну модель)

**A — один плоский список «Kind of access»** (~12 пунктов: Login, API key, Database, SSH, ENV, Domain, Hosting, App Store, Mail, Recovery codes, Admin, Other). В DB: `credentialType` = source of truth; `category` derived для slots.

**B — Category расширенный в UI** (+ ENV, RECOVERY_CODES, SSH, …); Format/`credentialType` **скрыт**, auto по category. Slots без ломки.

**C — двухшаговый wizard в Sheet** (не два dropdown на одном экране): «Where used?» → «What stored?» → поля. В DB оба поля; UX не показывает параллельные selects.

### Зависимости аудита

- `packages/shared/src/product-access-slots.ts` — `allowedCategories`
- `product-done-readiness.ts` — handoff categories
- `CredentialCategoryEnum` / `CredentialTypeEnum` в Prisma
- Delivery Board create-from-slot presets
- Seed `seed-credentials-demo.ts`
- Bitrix migration mapping (Phase 7)

### Критерии выбора модели

1. Один понятный select для пользователя.
2. Delivery slots и Finance links не ломаются.
3. Без скрытого auto-map, который нельзя объяснить в UI.
4. Расширяемость (ENV, recovery, SSH) без второго дублирующего поля.

**Следующий шаг:** workshop / decision record — одна модель A/B/C или гибрид; затем migration plan + обновление `02-Credentials-Data-Model.md`.

---

## Ссылки

- План реализации Credentials: `/2.todo-Credentials.md` (repo root)
- План Platform Access Foundation: `/1.todo-Access.md` (repo root)
- UX канон: `04-Credentials-UX-Workflows.md`
- Cleanup register: `99-Credentials-Cleanup-Register.md`
