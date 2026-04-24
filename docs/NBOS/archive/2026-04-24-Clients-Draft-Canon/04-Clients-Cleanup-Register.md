# Clients Cleanup Register

> NBOS Platform - реестр устаревшей client-логики, неполных мест и обязательной зачистки после обновления канона `Clients`

## Назначение

Этот файл нужен, чтобы после согласования нового канона `Clients` команда не опиралась на случайную старую модель:

- где Contact, Company и Project смешиваются;
- где Company редактируется как обычная карточка без tax/audit дисциплины;
- где Portfolio выглядит как отдельная сущность, а не view;
- где runtime уже показывает Clients, но не покрывает дедупликацию, merge и archive.

Реестр делит находки на три типа:

1. уже совпадает с новым каноном и это нужно сохранить;
2. устарело только в документации / описаниях;
3. устарело в runtime-коде и потом потребует реального рефакторинга.

Связанный канон:

- `00-Clients-Overview.md`
- `01-Companies.md`
- `02-Contacts.md`
- `03-Client-Portfolio.md`
- `../../01-Platform-Overview/03-Core-Entities-and-Data-Model.md`

---

## A. Уже совпадает с каноном и должно остаться

### A1. Contact и Company уже есть как отдельные runtime-сущности

Подтверждение в коде:

- [packages/database/prisma/schema.prisma](/Users/user/{} Development/1. Production/nbos/packages/database/prisma/schema.prisma:19)
- [packages/database/prisma/schema.prisma](/Users/user/{} Development/1. Production/nbos/packages/database/prisma/schema.prisma:53)

Вывод:

- базовое разделение `Contact` и `Company` уже правильное;
- модуль не нужно проектировать с нуля.

### A2. Company уже хранит tax status и billing fields

Подтверждение в коде:

- [packages/database/prisma/schema.prisma](/Users/user/{} Development/1. Production/nbos/packages/database/prisma/schema.prisma:57)
- [packages/database/prisma/schema.prisma](/Users/user/{} Development/1. Production/nbos/packages/database/prisma/schema.prisma:60)

Текущие поля:

- `taxId`
- `legalAddress`
- `bankDetails`
- `taxStatus`

Вывод:

- направление `Company = billing entity` уже поддержано на уровне модели;
- нужно усилить validation, audit и controlled override.

### A3. CRM и Projects уже используют Contact/Company links

Подтверждение в коде:

- [apps/api/src/modules/crm/deals/deals.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/crm/deals/deals.service.ts:103)
- [apps/api/src/modules/projects/projects.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/projects/projects.service.ts:56)

Вывод:

- client context уже проходит через соседние модули;
- следующий шаг не новая связь, а дисциплина обязательности и качества данных.

### A4. Базовые Clients pages уже существуют во frontend

Подтверждение в коде:

- [apps/web/src/app/(app)/clients/contacts/page.tsx](/Users/user/{} Development/1. Production/nbos/apps/web/src/app/(app)/clients/contacts/page.tsx:1)
- [apps/web/src/app/(app)/clients/companies/page.tsx](/Users/user/{} Development/1. Production/nbos/apps/web/src/app/(app)/clients/companies/page.tsx:1)

Вывод:

- UI уже можно развивать эволюционно;
- не требуется начинать с пустого экрана.

---

## B. Устарело только в документации или описаниях

### B1. В старом archive Clients описан как набор файлов без module overview

Где осталось:

- [docs/NBOS/archive/00-Technical-Architecture-Brief.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/archive/00-Technical-Architecture-Brief.md:319)

Проблема:

- там перечислены `Companies`, `Contacts`, `Client Portfolio`, но не зафиксирована граница модуля и ответственность.

Что надо сделать:

- считать `00-Clients-Overview.md` главным входом в новый canon;
- архив использовать только как историческую справку.

### B2. В docs нужно не смешивать Contact Portfolio и Client Portfolio

Где риск:

- [docs/NBOS/02-Modules/03-Clients/02-Contacts.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/02-Modules/03-Clients/02-Contacts.md:291)
- [docs/NBOS/02-Modules/03-Clients/03-Client-Portfolio.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/02-Modules/03-Clients/03-Client-Portfolio.md:268)

Проблема:

- карточка Contact может показывать много агрегатов, но `Client Portfolio` должен оставаться отдельным view;
- иначе Contact page начнёт превращаться в неуправляемый dashboard.

Что надо сделать:

- в UI docs отделить Contact card от full Portfolio view;
- быстрые агрегаты показывать в Contact, полную аналитику — в Portfolio.

### B3. Company tax status нужно описывать как controlled field

Где риск:

- [docs/NBOS/02-Modules/03-Clients/01-Companies.md](/Users/user/{} Development/1. Production/nbos/docs/NBOS/02-Modules/03-Clients/01-Companies.md:222)

Проблема:

- формулировка “не меняется” верная как бизнес-правило, но в жизни возможны correction / mistake / migration cases;
- нужен controlled override через CEO/Finance Director с audit, а не обычное редактирование.

Что надо сделать:

- при реализации убрать обычный edit tax status из общего Company edit flow;
- добавить отдельную процедуру override.

---

## C. Устарело в коде и потом потребует реального рефакторинга

### C1. Contact fields в runtime пока беднее канона

Подтверждение в коде:

- [packages/database/prisma/schema.prisma](/Users/user/{} Development/1. Production/nbos/packages/database/prisma/schema.prisma:19)
- [apps/api/src/modules/clients/contacts/contacts.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/clients/contacts/contacts.service.ts:5)

В каноне нужны, но в runtime пока не оформлены как отдельные поля:

- `preferred_channel`
- `language`
- `source`
- отдельные messenger handles (`whatsapp`, `telegram`, `instagram`, `facebook`)

Что потом нужно сделать:

- решить, какие поля должны быть structured columns, а какие остаются в `messengerLinks`;
- обновить DTO, forms, validation и migration.

### C2. Contact/Company delete сейчас hard delete

Подтверждение в коде:

- [apps/api/src/modules/clients/contacts/contacts.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/clients/contacts/contacts.service.ts:92)
- [apps/api/src/modules/clients/companies/companies.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/clients/companies/companies.service.ts:91)

Проблема:

- канон требует archive для records с историей;
- hard delete опасен для связей с projects, deals, invoices и tickets.

Что потом нужно сделать:

- добавить archived/active state;
- запретить hard delete для записей со связанными сущностями;
- сделать delete action как archive в UI.

### C3. Frontend edit flow вызывает create вместо update

Подтверждение в коде:

- [apps/web/src/app/(app)/clients/contacts/page.tsx](/Users/user/{} Development/1. Production/nbos/apps/web/src/app/(app)/clients/contacts/page.tsx:50)
- [apps/web/src/app/(app)/clients/companies/page.tsx](/Users/user/{} Development/1. Production/nbos/apps/web/src/app/(app)/clients/companies/page.tsx:48)
- [apps/web/src/lib/api/clients.ts](/Users/user/{} Development/1. Production/nbos/apps/web/src/lib/api/clients.ts:35)

Проблема:

- sheet edit визуально выглядит как update, но handler вызывает `create`;
- в API client вообще нет `update` methods.

Что потом нужно сделать:

- добавить `contactsApi.update` и `companiesApi.update`;
- заменить handlers в pages;
- покрыть smoke-test на редактирование.

### C4. Company taxStatus filter отправляется из UI, но API его не принимает

Подтверждение в коде:

- [apps/web/src/app/(app)/clients/companies/page.tsx](/Users/user/{} Development/1. Production/nbos/apps/web/src/app/(app)/clients/companies/page.tsx:35)
- [apps/api/src/modules/clients/companies/companies.controller.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/clients/companies/companies.controller.ts:23)
- [apps/api/src/modules/clients/companies/companies.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/clients/companies/companies.service.ts:17)

Проблема:

- frontend уже имеет фильтр `taxStatus`;
- backend принимает только `page`, `pageSize`, `search`;
- service умеет фильтровать `type`, но controller не передаёт `type`.

Что потом нужно сделать:

- добавить `type` и `taxStatus` query params в controller;
- добавить `taxStatus` в service where;
- проверить list filtering.

### C5. Deduplication и merge пока отсутствуют

Подтверждение в коде:

- [apps/api/src/modules/clients/contacts/contacts.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/clients/contacts/contacts.service.ts:64)
- [apps/api/src/modules/clients/companies/companies.service.ts](/Users/user/{} Development/1. Production/nbos/apps/api/src/modules/clients/companies/companies.service.ts:62)

Проблема:

- create flow сразу создаёт запись без duplicate candidates;
- merge workflow отсутствует.

Что потом нужно сделать:

- добавить duplicate candidate endpoint;
- показывать warning перед созданием;
- добавить controlled merge с audit log.

### C6. Client Portfolio пока описан в docs, но не реализован как endpoint/view

Подтверждение в коде:

- `apps/api/src/modules/clients` содержит только `contacts` и `companies`;
- `apps/web/src/app/(app)/clients` содержит только redirect, contacts и companies pages.

Проблема:

- `Client Portfolio` пока является каноном в docs, но не runtime feature.

Что потом нужно сделать:

- спроектировать read model / endpoint для Contact-context и Company-context;
- определить role-based masking финансовых секций;
- сделать отдельный frontend route для portfolio.
