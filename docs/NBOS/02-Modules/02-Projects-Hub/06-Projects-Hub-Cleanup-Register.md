# Projects Hub Cleanup Register

> NBOS Platform - реестр устаревшей логики, старых формулировок и обязательной зачистки после обновления канона Projects Hub

**Снимок 2026-05:** ниже много **истории миграций** (legacy `status` как compatibility mirror). Это не дублирует `IMPLEMENTATION_PROGRESS`: при сомнении смотреть закрытые срезы в прогрессе и код. Свежая сноска по оплате инвойсов: §A18 (`moneyStatus = PAID`).

## Назначение

Этот файл нужен, чтобы после согласования нового канона `Projects Hub` команда не продолжила опираться на старые модели:

- где `Projects Hub` смешан с CRM;
- где `Creating` ещё считается отдельной основной стадией;
- где `On Hold` живёт как stage, а не как pause-status;
- где `Lost` ещё используется вместо `Cancelled`;
- где delivery board ещё не отделена от project shell.

Реестр делит находки на три типа:

1. уже совпадает с новым каноном и это нужно сохранить;
2. устарело только в документации / UI-описаниях;
3. устарело в runtime-коде и потом потребует реального рефакторинга.

Связанный канон:

- `01-Project-Hub-Overview.md`
- `02-Project-Card.md`
- `03-Products-and-Extensions.md`
- `04-Project-Lifecycle.md`
- `05-Product-Centric-Navigation.md`
- `../../01-Platform-Overview/03-Core-Entities-and-Data-Model.md`

---

## A. Уже совпадает с каноном и должно остаться

### A1. Product-centric direction уже есть в каноне

Подтверждение в docs:

- [docs/NBOS/02-Modules/02-Projects-Hub/05-Product-Centric-Navigation.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/02-Modules/02-Projects-Hub/05-Product-Centric-Navigation.md:1)

Вывод:

- идея, что основной рабочий контекст должен быть вокруг `Product`, уже давно заложена;
- новый канон не ломает направление модуля, а делает его более строгим и operational.

### A2. Projects Hub уже мыслится как вычисляемые views, а не набор отдельных хранилищ

Подтверждение в docs:

- [docs/NBOS/01-Platform-Overview/01-Vision-and-Goals.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/01-Platform-Overview/01-Vision-and-Goals.md:86)

Вывод:

- board/view подход уже соответствует общей архитектуре платформы;
- это хорошо сочетается с новым правилом, что `Delivery Board` — это view над `Product` и `Extension`, а не отдельная сущность.

### A3. Базовая stage-gate логика для product/extension уже существует в runtime

Подтверждение в коде:

- [apps/api/src/modules/projects/products/products.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/projects/products/products.service.ts:11)
- [apps/api/src/modules/projects/extensions/extensions.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/projects/extensions/extensions.service.ts:10)

Вывод:

- в runtime уже есть контроль допустимых переходов и базовая валидация;
- модуль не надо проектировать с нуля;
- дальше потребуется не создавать stage gates заново, а перестраивать их под новый канон.

### A4. Canonical delivery lifecycle projection exists in runtime

Статус: `PHASE 4 RUNTIME + SCHEMA ALIGNMENT`

Runtime now exposes a canonical `deliveryLifecycle` projection for `Product` and `Extension` responses:

- `stage`: `STARTING / DEVELOPMENT / QA / TRANSFER / null`;
- `workStatus`: `ACTIVE / ON_HOLD`;
- `resolution`: `DONE / CANCELLED / null`;
- legacy status remains available for backward compatibility while DB enum refactor is pending.

This is the safe bridge from old runtime statuses to the new Projects Hub canon.

### A5. Canonical delivery lifecycle fields exist in schema

Статус: `PHASE 4 SCHEMA ALIGNMENT`

Runtime now has compatible canonical fields on both `Product` and `Extension`:

- `delivery_stage`;
- `delivery_work_status`;
- `delivery_resolution`;
- `on_hold_reason`;
- `on_hold_until`;
- `cancellation_reason`.

Legacy `status` remains during the transition, but backend writes now keep canonical lifecycle fields synchronized for status changes.

### A6. Dedicated pause / resume / cancel actions exist

Статус: `PHASE 4 ACTION ALIGNMENT`

Runtime now exposes explicit lifecycle actions for both `Product` and `Extension`:

- `PATCH /api/projects/products/:id/pause`;
- `PATCH /api/projects/products/:id/resume`;
- `PATCH /api/projects/products/:id/cancel`;
- `PATCH /api/projects/extensions/:id/pause`;
- `PATCH /api/projects/extensions/:id/resume`;
- `PATCH /api/projects/extensions/:id/cancel`.

These actions use canonical lifecycle fields and keep legacy `status` synchronized only for compatibility.

### A7. Dedicated stage movement actions exist

Статус: `PHASE 4 ACTION ALIGNMENT`

Runtime now exposes explicit stage movement actions for both `Product` and `Extension`:

- `PATCH /api/projects/products/:id/stage`;
- `PATCH /api/projects/extensions/:id/stage`.

These actions accept canonical stages only:

- `STARTING`;
- `DEVELOPMENT`;
- `QA`;
- `TRANSFER`.

Product and extension UI stage controls now use these canonical endpoints for active-stage movement. Legacy `status` endpoints remain available as compatibility paths and for still-unseparated terminal actions.

### A8. Dedicated complete actions exist

Статус: `PHASE 4 ACTION ALIGNMENT`

Runtime now exposes explicit terminal completion actions for both `Product` and `Extension`:

- `PATCH /api/projects/products/:id/complete`;
- `PATCH /api/projects/extensions/:id/complete`.

These actions set canonical `delivery_resolution = DONE`, clear active stage fields and keep legacy `status = DONE` only for compatibility. Product and extension UI terminal controls now use these actions instead of the legacy generic `status` endpoint.

### A9. Delivery lifecycle action UI exists

Статус: `PHASE 4 UI ALIGNMENT`

Product and extension delivery UI now exposes canonical operational controls:

- pause with required reason and expected resume date;
- resume from `ON_HOLD`;
- cancel with required reason.

Stage movement remains separate from pause/resume/cancel/complete, matching the canon rule that `On Hold` is a work status and `Cancelled` is a terminal outcome, not a delivery stage.

### A10. Delivery Board v1 exists in Project shell

Статус: `PHASE 4 UI ALIGNMENT` / `SUPERSEDED BY 2026-05-08 CANON`

Project shell now renders a first Delivery Board view over existing runtime entities:

- `Product` cards;
- `Extension` cards;
- active columns `Starting / Development / QA / Transfer`;
- separate `Closed` strip for terminal outcomes.

The board is a computed view over `Product` and `Extension`; no separate board storage or duplicate delivery entity was introduced.

New canon (2026-05-08): this embedded Project-shell board is now considered transitional UI. The main delivery lifecycle must move to a separate left-menu page `/delivery-board`. Project page should become a clean shell with product cards and compact readiness/status indicators. If project-level delivery board is needed later, it must reuse the same Delivery Board core with a `projectId` filter.

### A11. Delivery Board filters and quick actions exist

Статус: `PHASE 4 UI ALIGNMENT`

Delivery Board now supports operational filtering and light actions:

- status filters: `Active`, `On Hold`, `Closed`, `All`;
- kind filters: `Products`, `Extensions`, `All`;
- quick actions: move to next stage, resume from hold, mark done;
- `Closed` view is split by `Done` and `Cancelled` outcomes.

These controls call the same canonical delivery endpoints as the detail views and refresh the Project shell after mutation.

### A12. Delivery Board cancel flow exists

Статус: `PHASE 4 UI ALIGNMENT`

Delivery Board now exposes board-level cancel for active delivery cards:

- `Cancel` opens a confirmation dialog;
- cancellation requires a reason;
- Product cards call canonical product cancel endpoint;
- Extension cards call canonical extension cancel endpoint;
- Project shell refreshes after successful cancellation.

This keeps `Cancelled` as a terminal outcome and avoids routing cancellation through legacy status transitions.

### A13. Delivery Board exposes task/support depth

Статус: `PHASE 4 UI ALIGNMENT`

Delivery Board cards now expose operational context links:

- Product cards link to Product `Tasks`;
- Product cards link to Product support `Tickets`;
- Product cards link to Product `Extensions`;
- Extension cards link to parent Product task and extension contexts.

These links keep the board as a navigation and operational view over Product/Extension work, while `Tasks` remain the internal execution layer and `Support` remains the customer/SLA context.

### A14. Product detail exposes task/support runtime summaries

Статус: `PHASE 4 UX ALIGNMENT`

Product detail tabs now surface runtime health summaries without introducing new schema:

- Product `Tasks` tab shows completion, in-progress, high-priority and overdue task counts;
- Product support `Tickets` tab shows open, waiting, urgent and resolved ticket counts;
- summaries are computed from existing runtime task links and Product ticket relations.

This keeps `Tasks` as the internal execution layer and `Support` as customer/SLA context while making delivery risk visible from the Product screen.

### A15. Product detail exposes canonical delivery lifecycle

Статус: `PHASE 4 UX ALIGNMENT`

Product detail now surfaces the canonical delivery lifecycle directly:

- header status badge uses `deliveryLifecycle` when present;
- overview shows the `Starting / Development / QA / Transfer` stage line;
- `On Hold` is shown as a pause state on the current stage;
- `Done / Cancelled` are shown as terminal outcomes instead of plain legacy statuses.

This keeps Product detail aligned with Delivery Board and reduces dependence on old `status` labels while legacy enums are still present for compatibility.

### A16. Stage-gate UX explains next moves and blockers

Статус: `PHASE 4 UX ALIGNMENT`

Stage-gate UI now gives operators clearer context without changing runtime rules:

- Product Stage Gate shows current delivery state and next allowed move;
- Product Stage Gate explains the current gate focus before a transition;
- Extension readiness labels show business-friendly blocker names instead of raw field names;
- blocker panels still use backend validation as the source of truth.

This keeps gates enforceable in backend services while making the UI explain why movement is allowed or blocked.

### A17. Product QA/Transfer gates block open execution tasks

Статус: `PHASE 4 RUNTIME ALIGNMENT`

Product stage-gate runtime now enforces task closure for execution/QA movement:

- Product cannot move from `Development` to `QA` while linked Product tasks are open;
- Product cannot move from `QA` to `Transfer` while linked Product tasks are open;
- closed task statuses for this gate are `DONE`, `DEFERRED` and `CANCELLED`;
- blocker response uses the existing structured stage-gate error shape.

This implements the canon rule that execution/QA work must be closed before the next handoff stage while keeping deeper deployment and acceptance checklists for later runtime slices.

### A18. Product Done gate blocks unpaid linked finance state

Статус: `PHASE 4 RUNTIME ALIGNMENT`

Product Done gate now checks existing finance source data conservatively:

- when the linked Product order has invoices, all of those invoices must be paid (`moneyStatus = PAID`; legacy `Invoice.status` снят);
- when the linked Product order has a status, it must be `FULLY_PAID` or `CLOSED`;
- unpaid linked invoices block `Transfer -> Done` with the structured stage-gate error shape;
- open linked orders block `Transfer -> Done` with the same structured stage-gate error shape;
- missing invoice data is not treated as fake zero or fake paid state.

This implements the canon rule that the financial side must be closed before Product Done without inventing subscription-specific payment sufficiency rules in Phase 4.

### A19. Project shell prefers canonical delivery lifecycle

Статус: `PHASE 4 COMPATIBILITY ALIGNMENT`

Project detail runtime now exposes `deliveryLifecycle` on embedded Product and Extension rows, not only on Product/Extension detail endpoints:

- Project Delivery Board reads canonical stage, work status and terminal outcome from `deliveryLifecycle`;
- Product tab filters and badges use canonical lifecycle buckets before legacy `status`;
- PM Intake primary Product label uses canonical lifecycle when available;
- Extension readiness checks the canonical `STARTING` stage before falling back to legacy `NEW`.

Legacy `status` is still returned as a compatibility mirror for older API clients and remaining runtime code.

### A20. Product/Extension UI no longer calls generic status endpoints

Статус: `PHASE 4 COMPATIBILITY ALIGNMENT`

Delivery lifecycle controls in the Projects UI now avoid generic status mutation paths:

- Product stage gate uses `moveStage` and `complete`; unsupported legacy targets fail locally instead of calling generic `status`;
- Extension stage movement uses `moveStage`, `complete`, `pause`, `resume` and `cancel`;
- Extension list filters and done counters use canonical lifecycle buckets;
- Extension table badges use canonical lifecycle variants before legacy status variants.

Generic `PATCH /status` endpoints remain available only as backend compatibility paths while the old enum/column retirement is staged.

### A21. Generic status endpoints are deprecated compatibility paths

Статус: `PHASE 4 API COMPATIBILITY ALIGNMENT`

The old generic lifecycle mutation endpoints remain available, but are now explicitly marked as deprecated:

- `PATCH /api/projects/products/:id/status`;
- `PATCH /api/projects/extensions/:id/status`.

Both routes keep existing behavior for old clients, return `Deprecation: true`, and are marked deprecated in Swagger docs. New clients must use canonical lifecycle endpoints: `stage`, `pause`, `resume`, `cancel` and `complete`.

### A22. Product/Extension lists accept canonical lifecycle filters

Статус: `PHASE 4 API COMPATIBILITY ALIGNMENT`

Product and Extension list APIs now expose canonical lifecycle query filters alongside legacy `status`:

- `deliveryStage`;
- `deliveryWorkStatus`;
- `deliveryResolution`.

This lets new API clients filter delivery rows by canonical lifecycle state without using old `NEW / CREATING / LOST` status values. Legacy `status` query remains available as a compatibility filter until the old enum/column path can be removed.

### A23. Expired On Hold state is visible in delivery UI

Статус: `PHASE 4 UX ALIGNMENT`

Delivery UI now surfaces overdue paused work from existing lifecycle data:

- `deliveryLifecycle.onHoldUntil` is interpreted read-only;
- expired `ON_HOLD` badges use an amber warning variant;
- Delivery Board cards show hold-until or hold-expired copy;
- Product detail lifecycle card explains expired holds and keeps the Resume action as the next operational step.

No scheduler, auto-resume or automatic status mutation was introduced.

### A24. Product detail exposes Done readiness

Статус: `PHASE 4 RUNTIME + UX ALIGNMENT`

Product detail exposes a read-only Done readiness projection:

- backend builds `doneReadiness` from existing delivery, finance and project documentation data;
- runtime blockers include missing client acceptance, open extensions, tasks, support tickets, unpaid invoices and open linked order state;
- credentials and domains are surfaced as documentation warnings when project records are missing;
- missing runtime signals are reserved for canon requirements that still have no stable runtime source, such as DB-backed Drive file links.

This keeps the Done readiness panel aligned with actual runtime data and avoids silently treating missing credentials/domains as complete.

### A25. Product Done requires explicit client acceptance

Статус: `PHASE 4 RUNTIME ALIGNMENT`

Product runtime now has explicit client acceptance fields:

- `client_accepted_at`;
- `client_accepted_by`;
- `client_acceptance_note`.

The backend exposes `PATCH /api/projects/products/:id/acceptance` to record acceptance. Product Done validation now blocks `Transfer -> Done` until `client_accepted_at` exists, and Product Stage Gate UI provides a dedicated `Record acceptance` action.

This implements the acceptance part of the Done canon as real runtime state instead of a placeholder warning.

### A26. Product Done readiness includes handoff documentation health

Статус: `PHASE 4 RUNTIME + UX ALIGNMENT`

Product Done readiness now reads existing Project `credentials` and `domains` metadata for handoff depth:

- handoff credential categories count `ADMIN`, `DOMAIN`, `HOSTING`, `APP`, `API_KEY` and `DATABASE`;
- missing Project credentials/domains remain warnings because Product-specific credential links are not in runtime yet;
- existing expired domains are blockers before Done readiness;
- expiring domains are surfaced as warnings before handoff.

This improves transfer/handoff visibility using real runtime data without inventing a Product credential schema ahead of the Credentials module refactor.

### A27. Product Done readiness surfaces Drive handoff file gaps

Статус: `PHASE 4 RUNTIME + UX ALIGNMENT`

Product Done readiness now reads existing CRM/Order handoff file metadata:

- linked order deal `offer_file_url` is treated as approved offer handoff evidence;
- linked order deal `contract_file_url` is treated as contract handoff evidence;
- missing offer/contract files are warnings, not blockers, because Product Type file rules are not runtime-configured yet;
- final delivery files are reported as a missing runtime signal until Drive has DB-backed `FileAsset` / `FileLink` relations.

This makes Drive gaps visible in Product Done readiness without querying R2 folders as business truth or inventing FileAsset state before the Drive module refactor.

### A28. Projects Hub delivery closure gate exists

Статус: `PHASE 4 CLOSURE REVIEW`

The delivery lifecycle slice now has a formal closure gate in `docs/PHASE_4_CLOSURE_GATE.md`.

The gate marks Projects Hub delivery as ready for closure review, but keeps full Phase 4 open until remaining roadmap scope is resolved:

- `Tasks / Work Space` runtime foundation;
- Scrum/backlog/sprint planning separation;
- Support task/change-control/SLA runtime depth.

This prevents prematurely marking Phase 4 complete while the Projects Hub delivery lifecycle work is already reviewable as a coherent slice.

---

## B. Устарело только в документации или описаниях

### B1. Старый Projects Hub ещё местами описан как продолжение CRM

Статус: `PHASE 4 DOCS CLEANUP DONE`

Active cross-module docs now separate CRM handoff from Projects Hub operational lifecycle:

- CRM handoff creates/transfers context after `Deal Won` and paid first invoice;
- Product/Extension delivery movement happens in Projects Hub;
- `Starting → Development → QA → Transfer` is the canonical stage line for delivery entities.

This removes the confusing reading that CRM continues to own delivery after handoff.

### B2. Старые названия стадий `New / Creating / Lost` всё ещё живут в смежных docs

Статус: `PHASE 4 DOCS CLEANUP DONE`

Active docs now use the canonical delivery lifecycle:

- stages: `Starting`, `Development`, `QA`, `Transfer`;
- pause status: `On Hold`;
- terminal outcomes: `Done`, `Cancelled`.

Archived architecture notes remain historical and are not used as implementation canon.

### B3. Отдельная Delivery Board ещё не прописана во всех UI docs

Статус: `REOPENED 2026-05-08 / NEW CANON WRITTEN`

Old Phase 4 docs defined `Delivery Board` inside Project detail as the operational board over Product and Extension cards:

- active cards group by canonical stages;
- `On Hold` stays within the current stage as pause status;
- `Done / Cancelled` are shown in closed view;
- cards link into Product tasks, support tickets and extensions.

New canon: `Delivery Board` is a separate left-menu page and main delivery lifecycle screen. See `07-Delivery-Board.md`.

Runtime cleanup now needed:

- add `/delivery-board` route;
- add sidebar item;
- rename Dashboard pinned action `Product Board` -> `Delivery Board`;
- remove or demote embedded Project Delivery Board from Project page;
- move PM Intake panel logic into Kickoff/Delivery Readiness in Delivery Board opened card and Product stage-gate context;
- remove or demote the large Project-level Tasks block from Project page; delivery execution tasks belong in Product Work Space;
- keep Project page limited to compact readiness/status indicators.

### B4. Старое описание extension как необязательной связи с product больше не подходит

Статус: `PHASE 4 RUNTIME ALIGNMENT`

Extension ownership is now aligned at API/UI boundary:

- create extension requires `productId`;
- update extension cannot remove the linked Product;
- API validates that the linked Product belongs to the same Project;
- Create Extension UI requires Product selection before submit;
- active docs describe Extension as belonging to both Project and one primary Product.
- Prisma schema now treats `extensions.product_id` as required.

The migration includes an explicit guard: deploy stops if legacy rows with `product_id IS NULL` exist. The live Neon data check could not complete from this environment because the database was unreachable (`P1001`), so the guard keeps the data contract honest during deployment.

---

## C. Устарело в коде и потом потребует реального рефакторинга

### C1. Runtime product statuses всё ещё старые

Подтверждение в коде:

- [packages/shared/src/constants/index.ts](/Users/user/{} Development/1. Production/nbos/packages/shared/src/constants/index.ts:22)
- [apps/web/src/features/projects/constants/projects.ts](/Users/user/{} Development/1. Production/nbos/apps/web/src/features/projects/constants/projects.ts:54)
- [apps/api/src/modules/projects/products/products.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/projects/products/products.service.ts:11)

Текущий runtime shape:

- `NEW`
- `CREATING`
- `DEVELOPMENT`
- `QA`
- `TRANSFER`
- `ON_HOLD`
- `DONE`
- `LOST`

Целевой канон:

- stage: `STARTING / DEVELOPMENT / QA / TRANSFER`
- work status: `ACTIVE / ON_HOLD`
- resolution: `DONE / CANCELLED / null`

Что потом нужно сделать:

- пересобрать shared enums;
- отделить stage от pause-status и terminal outcome;
- заменить `CREATING` на `STARTING`;
- заменить `LOST` на `CANCELLED`;
- обновить backend transitions, DTO, tests и frontend badges.

Phase 4 already added read-only canonical projection, compatible schema fields, dedicated pause/resume/cancel/complete actions and Project shell lifecycle projection.

Current deprecation rule:

- `deliveryLifecycle.stage`, `deliveryLifecycle.workStatus` and `deliveryLifecycle.resolution` are the Product delivery source of truth for UI and new API behavior;
- list APIs should prefer canonical `deliveryStage`, `deliveryWorkStatus` and `deliveryResolution` query filters;
- legacy `status` remains a compatibility mirror and sync target until deprecated backend generic status endpoints are removed;
- do not remove `ProductStatusEnum` or the `products.status` column until old clients and tests stop depending on it.

### C2. Runtime extension statuses тоже старые

Подтверждение в коде:

- [packages/shared/src/constants/index.ts](/Users/user/{} Development/1. Production/nbos/packages/shared/src/constants/index.ts:181)
- [apps/web/src/features/projects/constants/projects.ts](/Users/user/{} Development/1. Production/nbos/apps/web/src/features/projects/constants/projects.ts:80)
- [apps/api/src/modules/projects/extensions/extensions.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/projects/extensions/extensions.service.ts:10)

Текущий runtime shape:

- `NEW`
- `DEVELOPMENT`
- `QA`
- `TRANSFER`
- `DONE`
- `LOST`

Целевой канон:

- stage: `STARTING / DEVELOPMENT / QA / TRANSFER`
- work status: `ACTIVE / ON_HOLD`
- resolution: `DONE / CANCELLED / null`

Что потом нужно сделать:

- remove remaining direct generic status transitions;
- replace `NEW` with canonical `STARTING` at public boundaries;
- replace `LOST` with canonical `CANCELLED` at public boundaries;
- remove old enum/column only after compatibility users are gone.

Current deprecation rule:

- `deliveryLifecycle.stage`, `deliveryLifecycle.workStatus` and `deliveryLifecycle.resolution` are the Extension delivery source of truth for UI and new API behavior;
- list APIs should prefer canonical `deliveryStage`, `deliveryWorkStatus` and `deliveryResolution` query filters;
- legacy `status` remains a compatibility mirror and sync target until deprecated backend generic status endpoints are removed;
- do not remove `ExtensionStatusEnum` or the `extensions.status` column until old clients and tests stop depending on it.

### C3. Frontend transitions и board helpers частично живут по старой схеме

Подтверждение в коде:

- [apps/web/src/features/projects/components/product-tabs/ProductOverviewTab.tsx](/Users/user/{} Development/1. Production/nbos/apps/web/src/features/projects/components/product-tabs/ProductOverviewTab.tsx:20)
- [apps/web/src/features/projects/components/tabs/ExtensionsTab.tsx](/Users/user/{} Development/1. Production/nbos/apps/web/src/features/projects/components/tabs/ExtensionsTab.tsx:54)

Текущее состояние:

- Project Delivery Board uses canonical lifecycle for grouping, filtering, quick actions and badges, but is now transitional under the 2026-05-08 Delivery Board canon;
- Product tab filters and badges prefer canonical lifecycle buckets;
- PM Intake primary Product label prefers canonical lifecycle, but the large Project page PM Intake panel is now transitional;
- Product and Extension lifecycle controls call canonical endpoints for stage movement and terminal actions.
- expired `ON_HOLD` states are highlighted from `deliveryLifecycle.onHoldUntil`.

Что потом нужно сделать:

- keep old status labels only as fallback for records that do not yet expose `deliveryLifecycle`;
- deprecate backend generic status endpoints after API consumers stop using them;
- keep any future auto-resume or escalation workflow explicit; do not infer it from expired hold UI alone.

### C4. Product / Extension stage-gate validation пока уже нового канона не покрывает полностью

Подтверждение в коде:

- [apps/api/src/modules/projects/products/products.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/projects/products/products.service.ts:33)
- [apps/api/src/modules/projects/extensions/extensions.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/projects/extensions/extensions.service.ts:19)

Текущий known gap:

- валидации пока знают только часть старых переходов;
- cumulative popup validation для прыжка сразу в `Done` нет;
- hold metadata не описана;
- разделения между active stage, pause state и resolution нет.

Что потом нужно сделать:

- расширить stage-gate contracts;
- вернуть structured blocker responses;
- добавить cumulative validation;
- отдельно поддержать:
  - `Put On Hold`
  - `Resume`
  - `Extend Hold`
  - `Close as Done`
  - `Close as Cancelled`

### C5. Extension linkage в runtime надо проверить на жёсткую обязательность `project + product`

Подтверждение в коде:

- [apps/api/src/modules/projects/extensions/extensions.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/projects/extensions/extensions.service.ts:19)
- [docs/NBOS/01-Platform-Overview/03-Core-Entities-and-Data-Model.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/01-Platform-Overview/03-Core-Entities-and-Data-Model.md:192)

Проблема:

- старый runtime и старые docs долго жили с более мягкой моделью extension;
- новый канон уже требует жёсткой связи с `Project` и `Product`.

Что потом нужно сделать:

- отдельно проверить create/update flows extension;
- если `productId` не обязателен в runtime, поднять это до обязательного правила;
- проверить CRM -> Projects handoff и support -> extension flows.

---

## Очерёдность зачистки

Когда перейдём от документации к реализации, приоритет лучше держать таким:

1. дочистить stale docs в UI / business logic / cross-module handoff;
2. привести shared/backend/frontend statuses к новому lifecycle;
3. реализовать новую board logic:
   - active stages
   - hold overlay
   - closed terminal view
4. перестроить product/extension stage gates и cumulative popup validation;
5. после этого уже полировать вторичные project views и visual details.

---

## Решение по старому `Creating`

Текущий вывод:

- `Creating` считать устаревшим названием основной delivery-стадии;
- его бизнес-смысл не выбрасывается, а переносится в `Starting` и в stage-gate правила стартового этапа;
- отдельная operational board должна называться не `Creating Board`, а `Delivery Board`.
