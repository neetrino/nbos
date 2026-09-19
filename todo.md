# Delivery Compensation v2 — довести до рабочей системы

Канон заморожен: не выдумывать production units/тарифы, не трогать Seller кроме Network, не migrate production (`DATABASE_URL_PROD`).

## От владельца (не код)

- [ ] Войти локально как Owner/CEO (каталог, нормы, enrollment) и отдельно как PM (Product/Delivery).
- [ ] После UI: сам заполнить реальные units/rates и published-профили — агент цифры не придумывает.
- [ ] Включить enrollment новых продуктов только когда нормы опубликованы.
- [ ] Прогнать в браузере Starting → Development → Wallet на тестовом продукте.
- [ ] Production migrate / cutover — отдельное явное разрешение, не этот список.

## Сейчас: база и локальный запуск

- [x] Применить additive migrate к **dev** Neon из `.env.local` (не PROD host) — 2026-09-19 `migrate deploy`, 4 SQL applied.
- [ ] Проверить в UI, что каталог/Compensation открываются без Prisma-ошибок.
- [ ] Поднять API + web и открыть `/my-company/function-catalog`.

## S17 — чтобы Owner мог включить модель без кода

- [ ] Идемпотентный draft-seed каталога (stable codes из `04-CATALOG-BOOTSTRAP.md`, без units/rates).
- [ ] Owner UI: переключатель `newEnrollmentEnabled` + статус readiness.
- [ ] Явный **local/demo** fixture с synthetic published нормами (только dev, не production seed).
- [ ] Проставить `checked` scope и base profile на enroll, иначе Development всегда blocked.

## Product / Delivery UI (сейчас только просмотр)

- [ ] Enroll V2 с Product (orderId) когда switch ON.
- [ ] Picker «+ Добавить» ACTIVE-функций, included badge, Save/expectedRevision.
- [ ] Удаление extra + 409 при конфликте ревизии.
- [ ] Modal замены исполнителя: пустые обязательные доли, один API `replacements`.
- [ ] Extension: enroll, 6 ролей (`ExtensionDeliveryRoleAssignment`), тот же workspace.
- [ ] Copy-from: только scope/параметры, без людей/денег/notes.

## Деньги и Finance (без нового payout engine)

- [ ] На **первом Done** один раз проставить `earnedPeriod` (не трогать при late funding).
- [ ] QA/Tech в payroll matrix linking + history (слоты `qaLeadId` / `technicalSpecialistId`).
- [ ] Wallet: свои суммы с Development, без units; подписи ролей для 6 ролей.
- [ ] Closed/archive: scope read-only, ledger не удалять.

## Network

- [ ] После migrate: выбрать From=Network в Lead/Deal и проверить Classic / first sub / recurring.
- [ ] Убедиться, что CLIENT/SALES/MARKETING/PARTNER и канал NETWORKING не изменились.

## Приёмка S18

- [ ] Browser QA desktop/mobile: catalog, Compensation rates, Product Functions, Delivery sheet, Wallet.
- [ ] Targeted tests + typecheck + Prettier на всё затронутое.
- [ ] Негатив: PM не видит units; mass-assignment; team PATCH после плана.
- [ ] Обновить журнал; production launch **не** отмечать выполненным.
