# Credential Form Sheet — redesign plan

> Обновлено: 2026-06-03 · Канон: `docs/NBOS/02-Modules/12-Credentials/06-Credentials-UX-Decisions.md` (C-hybrid)

## Зафиксированные решения (2026-06-03)

| #   | Тема                                  | Решение                                                                                          |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| R1  | Confirm при смене type (красный lane) | Обязательный checkbox «Понимаю, старый secret останется в vault, но не будет виден в этой форме» |
| R2  | Orphan secrets                        | Не удалять автоматически; остаются в vault до явной rotation/clear                               |
| R3  | Category UX                           | Dropdown в **header** рядом с title/settings (как CRM `$Deals` на скрине 2), не блок в body      |
| R4  | Type UX                               | `Select` с 11 пунктами (MVP); provider — **searchable picker** (`SearchField` / relation-style)  |
| R5  | Provider catalog                      | **Код** (`packages/shared`), значение — в `credentials.provider` (уже `TEXT`)                    |
| R6  | OTHER_SECRET                          | Убрать из create UI; enum в DB оставить для legacy; не показывать в type list                    |
| R7  | APP_STORE platform                    | Один тип `APP_STORE_ACCOUNT` + sub-field `appStorePlatform` + segmented iOS/Android в sheet      |
| R8  | Новые поля                            | Добавляем в schema когда реально нужны (passphrase, phones[]); reuse `login` = username/email    |

---

## 1. Поля и schema (reuse vs new)

### Reuse (одна колонка — разные лейблы по type)

| DB column     | Лейблы по контексту                                             |
| ------------- | --------------------------------------------------------------- |
| `login`       | Login, Email, Username, DB user, Apple ID                       |
| `password`    | Password, Private key (textarea для SSH)                        |
| `url`         | URL, Host, Connection URL, Panel URL                            |
| `apiKey`      | API key, Generic secret (legacy OTHER)                          |
| `secureNotes` | Private notes, Recovery codes, Passphrase (временно до колонки) |

### Новые колонки (Фаза 1b / 1c migration)

| Column             | Тип                      | Encrypt           | Для чего                                 |
| ------------------ | ------------------------ | ----------------- | ---------------------------------------- |
| `passphrase`       | `String?`                | Да (как password) | SSH passphrase отдельно от private key   |
| `phones`           | `String[]` или `Json`    | Нет (не secret)   | APP_STORE 2FA devices, несколько номеров |
| `appStorePlatform` | enum `APPLE` \| `GOOGLE` | Нет               | APP_STORE: авто-URL, иконки, валидация   |

**Правило:** не плодить `username` если достаточно `login`.

---

## 2. ENV bundle UX (целевой)

**Режим: Vercel-style table (primary) + paste strip (secondary).**

```
┌─ Paste .env (collapse) ─────────────────────────────┐
│ KEY=value ...                    [Parse & apply]   │
└────────────────────────────────────────────────────┘

┌ KEY ────────────────┬ VALUE ────────────┬ actions ┐
│ DATABASE_URL        │ ••••••••         │ 👁 📋   │
│ NEXT_PUBLIC_*       │ ••••••••         │ 👁 📋   │
│ ...                 │                  │         │
└─────────────────────┴──────────────────┴─────────┘
[ + Add variable ]              [ Download .env ]
```

- Парсинг: `parseEnvBundleText` / `serializeEnvBundle` (`@nbos/shared`) — уже есть.
- Хранение: `envData` encrypted serialized `KEY=value\n`.
- **Copy row:** clipboard `KEY=value` одной строки.
- **Download:** blob `.env` из текущих entries (decrypted в sheet после reveal или на create из draft).
- Edit existing: load → parse → table; paste заменяет/мержит с confirm.
- Убрать «два режима» — один UI: таблица всегда, paste сверху.

**Файлы:** `credential-env-editor.tsx` → `credential-env-table-editor.tsx`.

---

## 3. Provider (единый каталог)

### Где хранить список

| Что                                       | Где                                                   |
| ----------------------------------------- | ----------------------------------------------------- |
| Каталог 40–50 имён, группы, иконки (опц.) | `packages/shared/src/credentials/provider-catalog.ts` |
| Выбранное значение                        | `credentials.provider` (TEXT, уже в Prisma)           |
| Admin UI для списка                       | **Не сейчас** — дополняем кодом при необходимости     |

**Почему не отдельная DB table:** редкие правки, version control, нет seed/migration на каждый новый хостер; custom «Other» всё равно пишется в `provider` текстом.

### Группы в каталоге

```ts
type ProviderCatalogGroup = 'domain_registrar' | 'hosting_server' | 'mail_smtp' | 'general'; // API, DB, login, etc.
```

- **DOMAIN_REGISTRAR / HOSTING_SERVER:** picker **первым полем** в body; список top AM/RU/global (~25–30) + `Other` → раскрывает free-text.
- **MAIL_SMTP:** тот же компонент, группы `mail_smtp` + `hosting_server` (overlap).
- Остальные типы: optional provider (search), не обязателен.

### UI компонент

`CredentialProviderPicker` — обёртка над паттерном `SearchField` (static filter, не API search).

---

## 4. APP_STORE_ACCOUNT

### iOS vs Android — решение

**Не делать два `CredentialTypeEnum`.** Один тип + `appStorePlatform`:

| Platform | Auto URL (readonly после выбора)      |
| -------- | ------------------------------------- |
| `APPLE`  | `https://developer.apple.com/account` |
| `GOOGLE` | `https://play.google.com/console`     |

**UI:** segmented control с иконками Apple / Google Play под type (только для этого типа).

**Плюсы vs 2 enum:** один lane L1, один slot preset, проще смена platform без смены type, меньше миграций.

### Phone(s)

- `phones: string[]` в schema (миграция).
- UI: список inputs; **Add** — link под полем, `opacity-0 group-hover:opacity-100` на `group` wrapper.
- Первый номер обязателен при create (валидация).
- До миграции MVP: один `phone` required; multi — сразу после `phones[]`.

---

## 5. MAIL_SMTP

- Provider picker сверху (shared catalog, группы mail + hosting).
- Поля: URL (webmail), login (email), password.
- SMTP host/port — фаза 2 в notes или отдельные nullable поля.

---

## 6. DOMAIN_REGISTRAR + HOSTING_SERVER

Порядок полей:

1. Provider (catalog picker, required)
2. What is stored? _(если create — type уже выбран контекстом)_
3. URL / Login / Password
4. Environment

Примеры registrar: Reg.ru, Namecheap, GoDaddy, Cloudflare Registrar, Amnic, …  
Примеры hosting: Beget, Timeweb, DigitalOcean, Hetzner, AWS, …

---

## 7. OTHER_SECRET

| Действие                       | Когда                                                     |
| ------------------------------ | --------------------------------------------------------- |
| Скрыть из create type dropdown | Фаза 1                                                    |
| Существующие записи            | Остаются, badge «Legacy» в list                           |
| Новый тип вместо OTHER         | Когда появится реальный кейс (добавим в enum + migration) |
| Удаление enum                  | Только после empty table + миграция данных                |

**Не удалять enum в Фазе 1** — риск для DB и ссылок.

---

## 8. Layout sheet (итоговый порядок)

### Header

- Title (editable)
- **Category** — кликабельный badge → `DropdownMenu` / popover со scope-filtered categories
- Access / criticality badges
- Settings menu

### Body (General tab)

1. **What is stored?** (primary `Select`)
2. Type-specific blocks (provider picker if applicable → secrets → context)
3. Provider + Environment _(если не дублируется с п.2)_
4. Comment / recovery textarea
5. Manual access (create SECRET)

**Category не в body** (кроме locked: только header badge).

---

## 9. Type change safety (lanes)

Без изменений к ранее согласованной матрице:

- L1 ↔ L1: green
- L2 ↔ L2: green
- Cross-lane + `secretsPresent`: dialog + **checkbox R1**
- Create: clear draft fields not in new type

---

## 10. Implementation phases

### Фаза 1 — UX без schema (можно начать сразу)

- [ ] Header category dropdown (R3)
- [ ] Reorder body: type first; remove category from body
- [ ] `credential-field-config` — labels, order, SSH textarea
- [ ] Type change dialog + checkbox (R1, R2)
- [ ] Hide `OTHER_SECRET` from create (R6)
- [ ] `provider-catalog.ts` + `CredentialProviderPicker`
- [ ] DOMAIN/HOSTING/MAIL: provider on top
- [ ] APP_STORE: segmented iOS/Android + readonly URL (store platform in `provider` or notes until column)

### Фаза 1b — Schema

- [ ] `passphrase` encrypted column + SSH fields
- [ ] `phones` array + multi-phone UI with hover Add
- [ ] `appStorePlatform` enum column

### Фаза 1c — ENV table editor

- [ ] Table rows, per-row copy, download `.env`
- [ ] Paste strip + parse apply

### Фаза 2

- [ ] API guard type change (mirror lanes)
- [ ] Update `06-Credentials-UX-Decisions.md`
- [ ] Legacy OTHER migration playbook

---

## 11. Открыто (мелочи)

- [ ] Точный список 25–30 providers (AM/RU/global) — product sign-off
- [ ] Иконки Apple/Google в segmented — assets или lucide
- [ ] ENV: merge vs replace при paste (default replace with confirm)

---

## Ссылки

- Текущий config: `apps/web/src/features/credentials/credential-field-config.ts`
- Sheet fields: `apps/web/src/features/credentials/components/credential-form-sheet-fields.tsx`
- Header: `credential-form-sheet-header.tsx`
- ENV parse: `packages/shared/src/credentials/parse-env-bundle.ts`
- Search picker pattern: `apps/web/src/components/shared/SearchField.tsx`
