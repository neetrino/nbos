# Credentials Vault — план работ

> Модуль: `12-Credentials` · Статус: MVP + rich seed · Обновлено: 2026-06-01

Канон: `docs/NBOS/02-Modules/12-Credentials/*` · UX decisions: `06-Credentials-UX-Decisions.md`

---

## Зафиксированные решения (2026-06-01)

| #   | Тема                   | Решение                                                                                      | Статус |
| --- | ---------------------- | -------------------------------------------------------------------------------------------- | ------ |
| 1   | ENV bundle             | Paste `.env` → preview → encrypted store → export/copy `.env`                                | ✅     |
| 2   | Форма                  | Dynamic fields по kind/type; не показывать все поля сразу                                    | ✅     |
| 3   | Category vs Type       | **Открыто** — нужен глобальный аудит (модели A/B/C в `06-Credentials-UX-Decisions.md`)       | ⏸      |
| 4   | Criticality / rotation | Auto при create; 4 уровня; override в **Settings** внутри Sheet                              | ✅     |
| 5   | Comment                | Одно поле, **always private** (encrypted); в Sheet **виден сразу** при доступе (без step-up) | ✅     |
| —   | Create/Edit UI         | **Sheet** вместо modal dialog; удалить dialog после реализации                               | ✅     |

**Блокер Слайса A (form):** закрыть п.3 → затем Sheet + dynamic fields.

---

## Слайс 0 — Rich seed ✅

- [x] `seed-credentials-demo.ts` (~100 записей, encrypted secrets, all access levels)
- [x] Подключено в `seed.ts`, seed прогнан

---

## Слайс A — UX (после закрытия п.3)

### Form / Sheet (зависит от п.3)

- [ ] Глобальный аудит Category vs Type → decision record
- [ ] `CredentialFormSheet` (create + edit), удалить modal dialogs
- [ ] Dynamic secret fields по kind/type
- [ ] ENV paste + preview + export `.env`
- [ ] Comment → single encrypted field; убрать public notes из UI
- [ ] Settings block: criticality override, next rotation override (auto defaults on create)
- [ ] Backend: auto criticality + default `nextRotationAt` on create (если ещё нет)

### List / vault (можно параллельно п.3)

- [ ] Фильтры API + UI: kind/category (как решим в п.3), rotationStatus, productId, ownerId
- [ ] Tab/view **Needs Rotation**
- [ ] Step-up dialog вместо `window.prompt` (для password/api/env reveal)
- [ ] Project CredentialsTab → «Open in Vault» / deep-link to Sheet
- [ ] Pagination (убрать hardcoded `pageSize: 200`)

---

## Слайс B — Операционный vault

- [ ] Access Request flow
- [ ] Audit log block в Sheet
- [ ] Recently used
- [ ] Export → encrypted file download

---

## Слайс C — Security canon

- [ ] CredentialAccessGrant + expiry
- [ ] Emergency access
- [ ] Versions on rotation
- [ ] Offboarding hook
- [ ] Permanent delete step-up для CRITICAL

---

## Слайс D — Scale & migration

- [ ] Bulk actions
- [ ] CSV import
- [ ] Saved views / favorites
- [ ] Bitrix encrypted migration

---

## Открытый вопрос — п.3 Category / Type (аудит)

**Цель:** один понятный классификатор в UI без дубля и без скрытого костыля.

**Варианты:** см. `docs/NBOS/02-Modules/12-Credentials/06-Credentials-UX-Decisions.md`

**Затронутые места:**

- Prisma enums `CredentialCategoryEnum`, `CredentialTypeEnum`
- `product-access-slots.ts`, Delivery Board bind/create
- `product-done-readiness.ts` handoff categories
- List filters, seed, migration mapping

**Не начинать** рефактор form/sheet до выбора модели.

---

## Прочие решения (ранее)

| Вопрос                                 | Вариант                             |
| -------------------------------------- | ----------------------------------- |
| Access model на P1                     | Request flow + `allowedEmployees[]` |
| Step-up для secrets                    | Password-only (не Comment)          |
| DEVELOPMENT/MARKETING/FINANCE category | Отложить                            |

---

## Ссылки

- UX decisions: `docs/NBOS/02-Modules/12-Credentials/06-Credentials-UX-Decisions.md`
- Cleanup: `99-Credentials-Cleanup-Register.md`
- Regression: `apps/api/src/modules/credentials/credentials.service.test.ts`
