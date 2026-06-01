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

### Прочее (Slice A backlog)

- Step-up dialog вместо `window.prompt` для reveal/copy секретных полей.
- Фильтры, tab Needs Rotation, pagination — см. `todo.md` Слайс A.

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
