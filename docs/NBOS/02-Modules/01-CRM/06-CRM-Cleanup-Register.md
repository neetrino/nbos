# CRM Cleanup Register

> NBOS Platform - реестр устаревшей CRM-логики, старых формулировок и обязательной зачистки после обновления канона

## Назначение

Этот файл нужен, чтобы после согласования нового CRM-канона мы не начали повторно реализовывать старую логику только потому, что она ещё осталась:

- в отдельных старых документах;
- в UI-текстах;
- в enum/status constants;
- в частично реализованных переходах.

Реестр делит все находки на три типа:

1. уже совпадает с новым каноном и это нужно сохранить;
2. устарело только в документации или описаниях;
3. устарело в runtime-коде и потом должно быть реально переделано.

Связанный канон:

- `01-CRM-Overview.md`
- `02-Lead-Pipeline.md`
- `03-Deal-Pipeline.md`
- `04-Offers-and-Handoff.md`
- `05-Deal-Stage-Gates-and-Won-Override.md`
- `../../04-Finance/03-Subscriptions.md`
- `../../../03-Business-Logic/04-Subscription-Billing-Logic.md`

---

## A. Уже совпадает с каноном и должно остаться

### A1. Канонические Deal Type уже ограничены четырьмя значениями

Текущий runtime-канон:

- `PRODUCT`
- `EXTENSION`
- `MAINTENANCE`
- `OUTSOURCE`

Подтверждение в коде:

- [packages/shared/src/constants/index.ts](/Users/user/{} Development/1. Production/nbos/packages/shared/src/constants/index.ts:177)
- [packages/shared/src/schemas/index.ts](/Users/user/{} Development/1. Production/nbos/packages/shared/src/schemas/index.ts:45)

Вывод:

- отдельного живого `Deal Type = Upsell` в текущем runtime, похоже, уже нет;
- удалять пятый deal type из data model не требуется;
- нужно только дочистить старые тексты, где `Upsell` ещё фигурирует как тип сделки.

### A2. Marketing attribution поля уже существуют в runtime-модели

Текущие поля:

- `source`
- `sourceDetail`
- `sourcePartnerId`
- `sourceContactId`

Подтверждение в коде:

- [apps/web/src/lib/api/deals.ts](/Users/user/{} Development/1. Production/nbos/apps/web/src/lib/api/deals.ts:33)
- [apps/web/src/lib/api/leads.ts](/Users/user/{} Development/1. Production/nbos/apps/web/src/lib/api/leads.ts:10)

Вывод:

- маркетинговый блок не нужно придумывать заново;
- следующий шаг потом не создание новой модели, а включение этих полей в обязательные stage gates для `Lead` и `Deal`.

### A3. Базовая логика Deal stage gates и Deal Won уже существует

Подтверждение в коде:

- [apps/api/src/modules/crm/deals/deal-stage-gate.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/crm/deals/deal-stage-gate.ts:34)
- [apps/api/src/modules/crm/deals/deal-won.handler.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/crm/deals/deal-won.handler.ts:1)
- [apps/api/src/modules/crm/deals/deals.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/crm/deals/deals.service.ts:277)

Вывод:

- CRM уже умеет проверять переходы и обрабатывать `Deal Won`;
- полная логика не отсутствует, а требует расширения под новый бизнес-канон.

---

## B. Устарело только в документации или текстах

### B1. Старые формулировки `New / Extension / Upsell` как будто это текущая таксономия Deal Type

Где осталось:

- [docs/NBOS/archive/00-Technical-Architecture-Brief.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/archive/00-Technical-Architecture-Brief.md:76)

Проблема:

- архивные документы всё ещё описывают старую модель;
- это конфликтует с текущим каноном `PRODUCT / EXTENSION / MAINTENANCE / OUTSOURCE`.

Что надо сделать:

- не использовать архив как активный канон;
- если нужен смысл "new client" или "upsell", описывать это как sales scenario, а не как enum.

Статус:

- active Notifications canon уже выровнен под текущие `Deal Type`.

### B2. В части документов ещё живут старые статусы подписок

Где осталось:

- [docs/NBOS/archive/00-Technical-Architecture-Brief.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/archive/00-Technical-Architecture-Brief.md:68)
- [docs/NBOS/02-Modules/02-Projects-Hub/02-Project-Card.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/02-Modules/02-Projects-Hub/02-Project-Card.md:178)
- [docs/NBOS/02-Modules/02-Projects-Hub/02-Project-Card.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/02-Modules/02-Projects-Hub/02-Project-Card.md:206)
- [docs/NBOS/05-UI-Specifications/04-Finance-Pages.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/05-UI-Specifications/04-Finance-Pages.md:322)

Проблема:

- старые тексты всё ещё используют `Active / Paused / Cancelled` или `Expired`;
- новый канон подписок уже другой: `Pending / Active / On Hold / Cancelled / Completed`.

Что надо сделать:

- выровнять все cross-module документы под новый жизненный цикл подписки;
- убрать `Paused` и `Expired` там, где речь идёт именно о subscription status.

### B3. В документации ещё встречаются старые границы CRM и старые этапы

Где осталось:

- [docs/NBOS/02-Modules/02-Projects-Hub/04-Project-Lifecycle.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/02-Modules/02-Projects-Hub/04-Project-Lifecycle.md:115)
- [docs/NBOS/02-Modules/02-Projects-Hub/04-Project-Lifecycle.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/02-Modules/02-Projects-Hub/04-Project-Lifecycle.md:116)
- [docs/NBOS/03-Business-Logic/06-Entity-Relationships.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/03-Business-Logic/06-Entity-Relationships.md:206)

Проблема:

- некоторые тексты всё ещё звучат так, как будто `Creating`, `Get Final Pay` или `Maintenance Offer` являются стадиями CRM;
- это противоречит новому разделению ответственности между CRM, Projects и Finance.

Что надо сделать:

- закрепить единый boundary;
- CRM заканчивается на `Deal Won / Failed`;
- `Creating` живёт в Projects Hub;
- остатки оплат и подписочное сопровождение живут в Finance.

### B4. Старые project/subscription формулировки в смежных документах

Где осталось:

- [docs/NBOS/02-Modules/02-Projects-Hub/02-Project-Card.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/02-Modules/02-Projects-Hub/02-Project-Card.md:372)
- [docs/NBOS/05-UI-Specifications/04-Finance-Pages.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/05-UI-Specifications/04-Finance-Pages.md:369)

Проблема:

- там ещё смешаны статусы доменов/контрактов/подписок;
- это может снова запутать реализацию досок и фильтров.

Что надо сделать:

- отделить `subscription status` от `license/domain status` и от `agreement status`;
- при реализации использовать отдельные словари для разных сущностей.

---

## C. Устарело в коде и потом потребует реального рефакторинга

### C1. Subscription statuses во frontend ещё старые

Подтверждение в коде:

- [packages/shared/src/constants/index.ts](/Users/user/{} Development/1. Production/nbos/packages/shared/src/constants/index.ts:47)
- [apps/web/src/features/finance/constants/finance.ts](/Users/user/{} Development/1. Production/nbos/apps/web/src/features/finance/constants/finance.ts:51)
- [apps/web/src/features/projects/components/tabs/FinanceTab.tsx](/Users/user/{} Development/1. Production/nbos/apps/web/src/features/projects/components/tabs/FinanceTab.tsx:46)

Текущий runtime shape:

- `ACTIVE`
- `PAUSED`
- `CANCELLED`

Целевой канон:

- `PENDING`
- `ACTIVE`
- `ON_HOLD`
- `CANCELLED`
- `COMPLETED`

Что потом нужно сделать:

- обновить shared constants и схемы;
- обновить finance/project UI badges, filters и board columns;
- проверить backend enum и DTO;
- проверить генерацию invoice-циклов и отображение первой subscription-оплаты.

### C2. CRM transition validation пока уже нового канона не покрывает полностью

Статус: `OFFER/WON FOUNDATION DONE / MAINTENANCE DEPTH NEXT`

Текущая база есть, Phase 2 attribution foundation уже расширил обязательные source gates,
transition popup foundation уже показывает structured blockers вместо общего page error,
Deal Won foundation уже блокирует non-maintenance Won без linked paid invoice,
а offer/contract foundation добавил dedicated поля и gates для `SEND_OFFER`, `GET_ANSWER`
и `DEPOSIT_AND_CONTRACT`.

Новые требования, которые надо будет реализовать:

- проверить, что все remaining popup actions получают direct create/open shortcuts, а не только `Open details`;
- `MAINTENANCE` должен иметь отдельную won-логику и planned start semantics;
- `PRODUCT + Subscription` должен запускать активную подписку только после первой оплаченной invoice;
- `MAINTENANCE` должен создавать подписку в `Pending`.

Опорные места в коде:

- [apps/api/src/modules/crm/deals/deal-stage-gate.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/crm/deals/deal-stage-gate.ts:34)
- [apps/api/src/modules/crm/deals/deal-won.handler.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/crm/deals/deal-won.handler.ts:1)

Что потом нужно сделать:

- углубить `MAINTENANCE` planned start / subscription semantics;
- добавить `PRODUCT + Subscription` first-paid-invoice activation rules;
- добавить maintenance auto-create flow после основного Product Won.

### C3. Автосоздание связанного `MAINTENANCE Deal` пока надо считать функциональным backlog item

Новый канон:

- после основного `PRODUCT -> Deal Won` должен автоматически создаваться связанный `MAINTENANCE Deal`;
- карточка должна быть уже связана с исходным `Project/Product`;
- часть полей переносится автоматически;
- seller позже дозаполняет `amount`, `offer` и planned maintenance start.

Текущее состояние:

- в текущем коде это поведение пока не подтверждено как реализованное;
- до отдельной проверки считать это не реализованным backlog item.

Что потом нужно сделать:

- отдельно проверить CRM create/won flows;
- если автосоздания нет, реализовать как post-won automation;
- если есть частично, выровнять под новый канон.

---

## Очерёдность зачистки

Когда перейдём от документации к реализации, приоритет лучше держать таким:

1. дочистить stale docs в CRM и соседних модулях;
2. привести subscription statuses к новому канону в shared/backend/frontend;
3. расширить CRM stage gates и popup transitions;
4. реализовать maintenance auto-created flow;
5. только после этого полировать вторичные UI детали и automation texts.

---

## Решение по `Upsell`

Текущий вывод:

- `Upsell` считать устаревшей формулировкой, а не активным runtime `Deal Type`;
- если когда-нибудь бизнес снова захочет этот смысл, его надо вводить как:
- тег;
- sales scenario;
- reporting dimension;
- но не как пятый канонический `Deal Type`, если модель данных специально не пересматривается.
