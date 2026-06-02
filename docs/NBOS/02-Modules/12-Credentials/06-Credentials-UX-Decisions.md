# Credentials UX Decisions (working)

> Зафиксированные product/UX решения перед Слайсом A. **Не меняет runtime**, пока не реализовано в web/API.

**Дата:** 2026-06-01 · **Статус:** partial — пункт 3 (Category/Type) открыт.

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
- Scope tabs: `All`, `Personal`, `Department`, `Secret`, `Archived`.
- `All` — режим просмотра/поиска/использования по всем доступным credentials. **Create button скрыта** в `All`.
- Создать credential можно только внутри конкретного scope: `Personal`, `Department`, `Secret`. Выбранный scope автоматически передается в create Sheet.
- Под стандартными tabs/search может быть компактный блок `Recently used` / `Frequently used`, визуально как часть страницы, с тонким разделителем и compact cards.
- `Recently/Frequently used` показывать только в `List` и `Tiles` view. В `Category Board` не показывать.

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

### Прочее (Slice A backlog)

- Step-up dialog вместо `window.prompt` для reveal/copy секретных полей.
- Фильтры, tab Needs Rotation, pagination — см. `todo.md` Слайс A.

---

## Открыто — access model / уровни доступа

Финальное решение по access model еще обсуждается отдельно от UI shell.

Текущее направление для обсуждения:

- не ломать текущую runtime-модель `accessLevel` + RBAC scopes без необходимости;
- сохранить global owner/CEO access через platform/RBAC-level policy;
- уточнить, кто автоматически получает `PROJECT_TEAM` и `DEPARTMENT` credentials;
- решить, нужны ли дополнительные policy по level/seat для department credentials;
- не смешивать access model decision с UI/view-mode decision.

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

- План реализации: `/todo.md` (repo root)
- UX канон: `04-Credentials-UX-Workflows.md`
- Cleanup register: `99-Credentials-Cleanup-Register.md`
