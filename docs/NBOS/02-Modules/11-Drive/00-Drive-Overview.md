# Drive Overview

> NBOS Drive - файловая инфраструктура платформы, а не просто папка с файлами.

## 1. Назначение

`Drive` хранит, связывает и контролирует все рабочие файлы NBOS:

- коммерческие предложения и screenshots из CRM;
- handoff-документы и материалы проекта;
- файлы Product / Extension;
- вложения задач и Work Space;
- support screenshots, логи и документы решений;
- finance documents, payment proofs, official invoice материалы;
- partner agreements;
- client/company документы;
- company templates, SOP, training и shared materials.

Главный принцип:

`One physical file -> many business links`.

Файл не должен копироваться в несколько мест только потому, что он нужен в Deal, Product и Client Portfolio. Физически файл хранится один раз, а в NBOS он виден через разные `Libraries / Библиотеки` и связи.

---

## 2. Граница модуля

Drive отвечает за:

- физическое хранение файлов;
- metadata файла;
- связи файла с сущностями NBOS;
- версии файлов;
- preview / download / export;
- file permissions и audit;
- архивирование, trash, cleanup и backup exports.

Drive не отвечает за:

- пароли, `.env`, API keys и secrets - это `Credentials`;
- смысл финансовой операции - это `Finance`;
- смысл задачи - это `Tasks`;
- бизнес-статус сделки - это `CRM`;
- официальный бухгалтерский процесс - это `Finance` и внешняя бухгалтерия.

Drive может хранить документы этих модулей, но не заменяет их source of truth.

---

## 3. Два слоя Drive

Drive должен иметь две стороны.

### 3.1. Logical Drive / Логический Drive в NBOS

Это то, что видит пользователь:

- `Deals Library`;
- `Project Library`;
- `Product Library`;
- `Extension Library`;
- `Client Library`;
- `Company Library`;
- `Finance Library`;
- `Partner Library`;
- `Task / Work Space Files`;
- `Support Files`;
- `Company Shared Library`;
- `Personal Library`.

Это не обязательно физические папки. Это views, собранные по metadata и связям.

### 3.2. Physical Storage / Физическое хранение в R2

Это понятная структура в Cloudflare R2, чтобы owner мог:

- скачать backup;
- найти файлы вручную в emergency case;
- выгрузить все offers, meetings, calls или старые файлы;
- понять, что где лежит без открытия базы.

Физическое хранение должно быть человекочитаемым, но не должно быть единственным источником бизнес-логики.

---

## 4. Основные сущности

| Сущность            | Назначение                                                                   |
| ------------------- | ---------------------------------------------------------------------------- |
| `File Asset`        | Один физический файл или external link                                       |
| `File Version`      | Версия файла, если документ обновлялся                                       |
| `File Link`         | Связь файла с Deal, Product, Invoice, Task и т.д.                            |
| `Library`           | Логическое представление файлов по контексту                                 |
| `Storage Object`    | Physical object in R2 / S3-compatible storage                                |
| `File Permission`   | Явное ограничение доступа поверх inherited permissions                       |
| `File Audit Event`  | Кто загрузил, просмотрел, скачал, удалил или экспортировал файл              |
| `Export Job`        | Задача на формирование ZIP / backup / archive export                         |
| `Cleanup Candidate` | Файл или версия, которую можно архивировать, удалить или вынести в cold zone |

---

## 5. Главные правила

1. Любой файл в NBOS должен иметь business context или быть явно `Personal / Draft / Company Shared`.
2. Файл, загруженный из карточки сущности, автоматически получает связь с этой сущностью.
3. Один файл может быть связан с несколькими сущностями без физического дублирования.
4. Папки в UI являются удобным способом навигации, а не единственной моделью данных.
5. В R2 path должен быть понятным человеку, но права и связи берутся из базы.
6. Удаление по умолчанию soft delete, физическое удаление только через cleanup policy.
7. Файлы задач часто становятся мусором, поэтому для них нужна отдельная cleanup policy.
8. Approved / final документы должны жить дольше draft-файлов.
9. Finance, legal, partner и credentials-adjacent документы требуют более строгого доступа и audit.
10. Secrets не хранятся в Drive.

---

## 6. Типовой пример

Seller прикрепил КП в Deal:

```text
Deal -> Offer Material -> File Asset
```

Пока сделка в CRM, файл виден в:

- Deal card;
- Deals Library;
- Client Portfolio, если есть доступ и связь с client/company.

После `Deal Won` система добавляет связи:

```text
File Asset
  -> Deal
  -> Approved Offer
  -> Project
  -> Product
  -> Client / Company
```

Физически файл не копируется. В NBOS он появляется в:

- Deal files;
- Product Library;
- Project Library;
- Client Library;
- Handoff documents.

---

## 7. Документы модуля

| Документ                                 | Назначение                                              |
| ---------------------------------------- | ------------------------------------------------------- |
| `01-File-Assets-and-Metadata.md`         | Сущности файла, версии, metadata, статусы               |
| `02-Libraries-and-Entity-Links.md`       | Библиотеки и связи с сущностями NBOS                    |
| `03-Permissions-Sharing-and-Audit.md`    | Права, sharing, portal visibility, audit                |
| `04-Upload-Versioning-and-Lifecycle.md`  | Загрузка, версии, lifecycle, удаление                   |
| `05-Drive-Module-Integrations.md`        | Интеграции с CRM, Projects, Tasks, Finance и другими    |
| `06-Drive-Storage-Export-and-Cleanup.md` | R2 структура, backup/export, cleanup                    |
| `07-Drive-Cleanup-Register.md`           | Что устарело в текущих docs/code и что нужно переделать |
