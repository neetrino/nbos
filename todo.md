# Delivery Board — opened card (General) — план реализации

Согласовано с обсуждения: один **Stage readiness** (объединяет бывшие п.2 / 3 / 7), **Team** (включая Seller из Deal), **Client + Company** в одном блоке, **Deal** открывать **в новой вкладке** (MVP), **Key work links** — мини-блок (Work Space внутренний, остальное — внешние URL из technical profile), **Files** — простой красивый список (MVP: offer/contract из Deal + при необходимости позже Drive), **Languages** — с приоритетом **hy → en → ru**, затем по алфавиту; **Access & infrastructure** — слева слоты, справа summary **Languages + Payment** (без дублирования отдельного тяжёлого Conditional Setup). Контекст-колонку **Context** как отдельный 4-й rail **убираем**, ссылки разносим по блокам.

---

## 1. Данные и API (backend)

- **Prisma**: на `Product` добавить `languages String[]` (default `[]`), миграция SQL в `packages/database/prisma/migrations/…`.
- `**ProductsService.findById`\*\*: расширить `include`:
  - `project`: `company { id, name }`, `contact { id, firstName, lastName }` (уже есть `contactId`).
  - `order.deal`: добавить `seller { id, firstName, lastName }`, оставить `offerFileUrl`, `contractFileUrl`.
  - `technicalProfiles`: `productionUrl`, `stagingUrl`, `repositoryUrl`, `hostingProvider`, `technicalOwnerId` (имя владельца без новой Prisma-relation — при `technicalOwnerId` показывать «Assigned» / позже отдельный join).
- `**ProductsService.update` / DTO / controller `PUT**`: принять опционально `languages?: string[]`, валидировать (только известный whitelist кодов).
- `**ExtensionsService.findById**`: аналогично `project` + `company` + `contact`; `order.deal` + `seller`; у `product` включить `languages` (наследование для extension-карточки с родительского продукта).

---

## 2. Web API types

- Обновить `apps/web/src/lib/api/products.ts`: `Product` / `FullProduct` — `languages`, расширенный `project`, `order.deal`, `technicalProfiles[]`.
- Обновить `apps/web/src/lib/api/extensions.ts`: зеркально для extension + `product.languages`.
- `UpdateProductData`: `languages?: string[]`.

---

## 3. Клиенты — deep link (чтобы кнопки Client / Company работали)

- `contactsApi.getById` / `companiesApi.getById` → `GET` уже есть на API.
- На страницах `[apps/web/src/app/(app)/clients/contacts/page.tsx](apps/web/src/app/(app)`/clients/contacts/page.tsx) и `companies/page.tsx`: при `?openId=` загрузить сущность и открыть sheet; при закрытии — `router.replace` без query (опционально).

---

## 4. Вкладка General — layout и блоки

Файл-центр: `[DeliveryItemDetailGeneralTab.tsx](apps/web/src/features/projects/components/delivery-board/DeliveryItemDetailGeneralTab.tsx)`.

**Сетка (desktop, ≥lg): 3 колонки**

| Колонка 1                                                                      | Колонка 2                                                                                                     | Колонка 3                                                                                                                           |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Stage readiness (summary + строки требований + checklist progress)             | Delivery plan (без дубля Company/Order — перенести в Commercial)                                              | Access & infrastructure (слева слоты — существующий компонент)                                                                      |
| Team (PM, Seller из deal, остальные роли — пока Not assigned, если нет данных) | Commercial: Client, Company (ссылки на `/clients/...?openId=`), Deal (новая вкладка `/crm/deals?openDealId=`) | Справа в той же карточке: Languages (мультивыбор из whitelist + сортировка отображения), Payment (read-only из `order.paymentType`) |
| (опционально кратко blockers из `doneReadiness.blockers` если есть)            | Key work links (кнопки: Work Space, Repo, Staging, Prod — из technical profile / href из sheet)               | Files (иконка + название; offer/contract URLs)                                                                                      |

**Мобильный порядок:** Stage readiness → Team → Delivery plan → Commercial → Key links → Access+Languages+Payment → Files.

Новые небольшие компоненты (по одному файлу, <300 строк):

- `DeliveryItemStageReadinessSection.tsx` + утилита строк (логика зеркалит `product-current-stage-readiness.ts` / `extension-current-stage-readiness.ts` и `checklistStageProgress`).
- `DeliveryItemTeamSection.tsx`
- `DeliveryItemCommercialSection.tsx`
- `DeliveryItemKeyWorkLinksSection.tsx`
- `DeliveryItemFilesSection.tsx`
- `DeliveryItemLanguagesField.tsx` (или встроить в колонку 3) + константы кодов и сортировка **hy, en, ru**, остальные по алфавиту.

---

## 5. Планирование (Save / Cancel)

- Расширить `[delivery-item-detail-planning-state.ts](apps/web/src/features/projects/components/delivery-board/delivery-item-detail-planning-state.ts)`: `languages` в snapshot и в `buildProductPlanPatch`.

---

## 6. Мелкие правки sheet

- В `[DeliveryItemDetailSheet.tsx](apps/web/src/features/projects/components/delivery-board/DeliveryItemDetailSheet.tsx)`: исправить передачу `**workspaceHref`\*\* в header (сейчас ошибочно подставляется `sourcePageHref` — см. строку с `DeliveryItemDetailHeader`).

---

## 7. Тесты / проверка

- Прогнать существующие тесты delivery-board / products patch при наличии.
- Ручная проверка: открыть карточку Product и Extension — колонки, ссылки, новая вкладка Deal, Client/Company deep link.

---
