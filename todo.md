# Credentials Vault — план работ

> Модуль: `12-Credentials` · Статус: MVP в runtime, доработка по канону · Обновлено: 2026-06-01

## Текущее состояние

| Слой       | Готово                                                                  | Пробелы                                                   |
| ---------- | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| API        | CRUD, archive/restore/purge, reveal/copy/export, step-up, audit, health | Access requests, grants+TTL, emergency, versions          |
| DB         | `Credential` + enums, context fields, rotation                          | `CredentialAccessGrant`, versions, flexible secret fields |
| UI         | `/credentials` list + dialogs, product tab (basic)                      | Drawer, saved views, bulk, audit block, step-up dialog    |
| Seed       | ~~6 записей без секретов~~ → **rich demo (Слайс 0)**                    | —                                                         |
| Интеграции | Product access slots, Mail schema link                                  | Offboarding, Tasks rotation, incident flow                |

Канон: `docs/NBOS/02-Modules/12-Credentials/*` · Cleanup register: `99-Credentials-Cleanup-Register.md`

---

## Слайс 0 — Rich seed (сейчас)

**Цель:** наполнить test DB так, чтобы можно было прогнать весь vault end-to-end.

- [x] План в `todo.md`
- [x] `seed-credentials-demo.ts` (~120+ записей)
  - все `credentialType`, `category`, `accessLevel`, `criticality`
  - encrypted `password` / `apiKey` / `envData` / `secureNotes`
  - rotation: healthy / due soon / overdue / без даты
  - archived sample + restore/purge flow
  - привязки: projects, products, domains, client services
  - product access slot bindings (prod1, prod4, prod9)
- [x] Подключить в `seed.ts` (после domains)
- [x] Прогнать `pnpm --filter @nbos/database seed` → **100 записей**, 2 archived, 7 slot bindings

**Проверка после seed:**

- `/credentials` — tabs, filters, rotation badges, archived
- Detail → reveal/copy (step-up) с реальными секретами
- Project/Product → Credentials tab
- Delivery Board → access slots bound

---

## Слайс A — QA-ready UX (следующий)

- [ ] Фильтры API + UI: `credentialType`, `criticality`, `rotationStatus`, `productId`, `ownerId`
- [ ] Tab/view **Needs Rotation**
- [ ] Step-up dialog вместо `window.prompt`
- [ ] Project CredentialsTab → «Open in Vault» / deep-link
- [ ] Pagination (убрать hardcoded `pageSize: 200`)
- [ ] Обновить `security.todo.md` (audit reveal ✅)

---

## Слайс B — Операционный vault

- [ ] **Access Request** flow (request → approve/reject → grant + notification)
- [ ] Audit log block в credential detail
- [ ] Recently used (из audit events)
- [ ] Export → encrypted file + download UX (не только JSON в memory)

---

## Слайс C — Security canon

- [ ] Таблица `CredentialAccessGrant` + expiry
- [ ] Emergency access (break-glass)
- [ ] Credential versions при rotation
- [ ] Offboarding hook (My Company)
- [ ] Permanent delete step-up для CRITICAL

---

## Слайс D — Scale & migration

- [ ] Bulk actions (assign owner, archive, rotation request)
- [ ] CSV import + duplicate detection
- [ ] Saved views / favorites
- [ ] Bitrix encrypted migration (Phase 7)

---

## Решения (зафиксировать перед B)

| Вопрос             | Вариант по умолчанию                                               |
| ------------------ | ------------------------------------------------------------------ |
| Access model на P1 | Request flow + расширение `allowedEmployees[]` (без новой таблицы) |
| Step-up            | Password-only до отдельного решения по 2FA                         |
| Categories enum    | DEVELOPMENT/MARKETING/FINANCE — отложить (OTHER покрывает)         |

---

## Ссылки

- Roadmap Phase 5: `docs/NBOS/00-Implementation-Roadmap.md`
- Delivery matrix: `docs/execution/01-module-delivery-matrix.md` (п.5 Credentials and Drive security)
- Regression: `apps/api/src/modules/credentials/credentials.service.test.ts`
