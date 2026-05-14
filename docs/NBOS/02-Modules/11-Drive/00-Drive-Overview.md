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

## 3. Три рабочих пространства Drive

Drive должен ощущаться как полноценный рабочий файловый модуль, а не только как
вложения в карточках. Внутри одного Drive-модуля есть три пространства.

### 3.1. System Libraries / Системные библиотеки

Это автоматическая структура NBOS:

- Deals Library;
- Project Library;
- Product Library;
- Extension Library;
- Client Library;
- Finance Library;
- Partner Library;
- Task / Work Space Files;
- Support Files;
- Company Shared Library;
- Personal Library.

Системные библиотеки строятся по `FileAsset` + `FileLink` + permissions. Их нельзя
удалять, переименовывать или перемещать как обычные пользовательские папки, потому что
они являются частью бизнес-модели платформы.

### 3.2. Company Drive / Свободный общий Drive компании

Это свободная Google Drive-like зона для компании:

- пользовательские папки и подпапки;
- общие рабочие материалы;
- templates, brand, training, shared files;
- файлы без обязательной привязки к Project / Product / Deal.

Создание, переименование, перемещение, удаление папок и файлов доступно по RBAC и
folder permissions. Но даже в свободной зоне права файла и confidentiality остаются
важнее папки.

### 3.3. Personal Drive / Личный Drive сотрудника

Личная зона сотрудника:

- private-by-default файлы;
- личные рабочие черновики;
- свои папки и подпапки;
- возможность поделиться файлом или папкой с другим сотрудником / командой.

Personal Drive не должен становиться способом обхода business permissions. Если файл
связан с Finance / Legal / Credentials-adjacent context, confidentiality restrictions
продолжают действовать.

### 3.4. Shared With Me

Отдельный view для файлов и папок, к которым пользователь получил доступ. Это не
копия файла, а доступ к тому же `FileAsset` или folder placement.

---

## 4. Два технических слоя Drive

Drive должен иметь две стороны.

### 4.1. Logical Drive / Логический Drive в NBOS

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

### 4.2. Physical Storage / Физическое хранение в R2

Это понятная структура в Cloudflare R2, чтобы owner мог:

- скачать backup;
- найти файлы вручную в emergency case;
- выгрузить все offers, meetings, calls или старые файлы;
- понять, что где лежит без открытия базы.

Физическое хранение должно быть человекочитаемым, но не должно быть единственным источником бизнес-логики.

---

## 5. Основные сущности

| Сущность            | Назначение                                                                   |
| ------------------- | ---------------------------------------------------------------------------- |
| `File Asset`        | Один физический файл или external link                                       |
| `File Version`      | Версия файла, если документ обновлялся                                       |
| `File Link`         | Связь файла с Deal, Product, Invoice, Task и т.д.                            |
| `Drive Folder`      | Пользовательская папка в Company Drive / Personal Drive                      |
| `Folder Placement`  | Размещение файла или папки внутри пользовательской папки                     |
| `Library`           | Логическое представление файлов по контексту                                 |
| `Storage Object`    | Physical object in R2 / S3-compatible storage                                |
| `File Permission`   | Явное ограничение доступа поверх inherited permissions                       |
| `File Audit Event`  | Кто загрузил, просмотрел, скачал, удалил или экспортировал файл              |
| `Export Job`        | Задача на формирование ZIP / backup / archive export                         |
| `Cleanup Candidate` | Файл или версия, которую можно архивировать, удалить или вынести в cold zone |

---

## 6. Главные правила

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
11. System Libraries не являются пользовательскими папками и не удаляются вручную.
12. Company Drive и Personal Drive поддерживают свободные пользовательские папки.
13. Move в пользовательских папках меняет `FolderPlacement`, а не физический объект.
14. Share даёт доступ к тому же `FileAsset`; Copy создаёт новый независимый `FileAsset`.
15. Remove from folder удаляет только placement; Delete file everywhere переводит сам файл в Trash, если это разрешено.

---

## 7. Move, Share, Copy And Delete

### 7.1. Move

`Move` доступен для пользовательских папок в Company Drive / Personal Drive. Move
перемещает `FolderPlacement` файла или папки:

```text
Personal Drive / Design / logo.png
  -> Personal Drive / Archive / logo.png
```

Это тот же `FileAsset`. В старой пользовательской папке он больше не показывается.
Business links к Deal / Project / Product / Finance не удаляются.

### 7.2. Share

`Share` даёт доступ к тому же файлу:

```text
FileAsset f_123
  owner: Employee A
  shared with: Employee B can view
```

Если пользователь получил только view/download, он не меняет оригинал. Если получил
edit/version permission, новая версия меняет общий файл и должна быть audited.

### 7.3. Copy

`Copy` создаёт независимый новый `FileAsset`:

```text
Original: FileAsset f_123
Copy:     FileAsset f_999 copiedFrom f_123
```

Удаление или изменение оригинала не влияет на копию. Copy нужен, когда пользователь
передаёт материал другому человеку как самостоятельный файл.

### 7.4. Delete

UI должен различать три действия:

| Действие                  | Что происходит                                                                 |
| ------------------------- | ------------------------------------------------------------------------------ |
| `Remove from this folder` | Удаляется только `FolderPlacement`; сам `FileAsset` и business links остаются  |
| `Move file to trash`      | Сам файл скрывается из активного Drive везде, если нет защитных business rules |
| `Delete forever`          | Только из Trash / cleanup, только с permission, audit и retention checks       |

Если файл имеет несколько placements, основное действие в папке — `Remove from this
folder`. Если это единственное placement и нет защищающих business links, UI должен
честно предупреждать, что файл будет перемещён в Trash. Если есть `FileLink` к
Approved / Finance / Legal / Project-critical context, обычное удаление файла должно
быть заблокировано или заменено на Archive / request delete.

---

## 8. Типовой пример

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

## 9. Документы модуля

| Документ                                 | Назначение                                              |
| ---------------------------------------- | ------------------------------------------------------- |
| `01-File-Assets-and-Metadata.md`         | Сущности файла, версии, metadata, статусы               |
| `02-Libraries-and-Entity-Links.md`       | Библиотеки и связи с сущностями NBOS                    |
| `03-Permissions-Sharing-and-Audit.md`    | Права, sharing, portal visibility, audit                |
| `04-Upload-Versioning-and-Lifecycle.md`  | Загрузка, версии, lifecycle, удаление                   |
| `05-Drive-Module-Integrations.md`        | Интеграции с CRM, Projects, Tasks, Finance и другими    |
| `06-Drive-Storage-Export-and-Cleanup.md` | R2 структура, backup/export, cleanup                    |
| `07-Drive-Cleanup-Register.md`           | Что устарело в текущих docs/code и что нужно переделать |
