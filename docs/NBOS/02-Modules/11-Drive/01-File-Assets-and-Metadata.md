# File Assets And Metadata

## 1. Назначение

`File Asset` - центральная сущность Drive. Она описывает файл как бизнес-объект NBOS, независимо от того, где физически лежит файл.

Файл может быть:

- uploaded file;
- external link;
- generated export;
- screenshot / proof;
- archived file;
- generated document.

---

## 2. File Asset

Минимальная модель:

| Поле                 | Назначение                                                                              |
| -------------------- | --------------------------------------------------------------------------------------- |
| `id`                 | Внутренний ID файла                                                                     |
| `display_name`       | Человеческое имя файла                                                                  |
| `original_name`      | Имя при загрузке                                                                        |
| `file_type`          | Document, Image, Video, Audio, Archive, Code, Spreadsheet, Link, Other                  |
| `purpose`            | Offer, Contract, Handoff, Design, Invoice Proof, Payment Proof, Support Evidence и т.д. |
| `source_module`      | Из какого модуля файл был добавлен                                                      |
| `owner_employee_id`  | Кто загрузил / владеет                                                                  |
| `created_by`         | Кто создал запись                                                                       |
| `status`             | Draft, Active, Approved, Archived, Deleted                                              |
| `visibility`         | Internal, Project Team, Restricted, Client Visible, Partner Visible, Personal           |
| `confidentiality`    | Public Internal, Confidential, Finance Sensitive, Legal Sensitive, Secret Adjacent      |
| `storage_provider`   | R2, External URL, Future Google Drive                                                   |
| `storage_key`        | Physical key в R2, если файл хранится внутри NBOS                                       |
| `mime_type`          | MIME type                                                                               |
| `size_bytes`         | Размер                                                                                  |
| `checksum`           | Hash для deduplication и integrity                                                      |
| `current_version_id` | Активная версия                                                                         |
| `retention_policy`   | Как долго хранить                                                                       |
| `deleted_at`         | Soft delete marker                                                                      |
| `archived_at`        | Когда вынесен в archive                                                                 |

---

## 3. Purpose / Назначение файла

`purpose` нужен, чтобы Drive понимал, что это за файл и как с ним работать.

Примеры:

| Purpose                 | Где используется                              |
| ----------------------- | --------------------------------------------- |
| `OFFER_DRAFT`           | Черновик КП                                   |
| `OFFER_SENT`            | Отправленное КП                               |
| `OFFER_APPROVED`        | Согласованное КП                              |
| `MESSENGER_PROOF`       | Screenshot переписки с подтверждением условий |
| `CONTRACT`              | Договор                                       |
| `HANDOFF_DOCUMENT`      | Документ передачи Seller -> PM                |
| `DESIGN_ASSET`          | Макеты, картинки, брендовые материалы клиента |
| `DELIVERY_FILE`         | Итоговая передача клиенту                     |
| `INVOICE_REQUEST_PROOF` | Подтверждение отправки запроса бухгалтерии    |
| `PAYMENT_PROOF`         | Подтверждение оплаты                          |
| `EXPENSE_PROOF`         | Чек / подтверждение расхода                   |
| `PARTNER_AGREEMENT`     | Партнёрское соглашение                        |
| `SUPPORT_EVIDENCE`      | Screenshot / log / запись проблемы            |
| `TASK_ATTACHMENT`       | Вложение задачи                               |
| `WORKSPACE_ARTIFACT`    | Файл из Work Space / Scrum                    |
| `SOP_DOCUMENT`          | SOP / инструкция                              |
| `TRAINING_MATERIAL`     | Обучающий материал                            |
| `MEETING_RECORDING`     | Запись встречи                                |
| `CALL_RECORDING`        | Запись звонка                                 |

Purpose используется для:

- поиска;
- export;
- cleanup;
- прав доступа;
- auto-linking;
- stage gates.

---

## 4. File Version

Для важных документов нельзя перезаписывать файл молча.

Версионирование обязательно для:

- Offer;
- contract / agreement;
- handoff document;
- final delivery document;
- finance proof, если файл был заменён;
- SOP / template;
- legal / partner documents.

Поля версии:

| Поле             | Назначение              |
| ---------------- | ----------------------- |
| `id`             | ID версии               |
| `file_asset_id`  | Родительский File Asset |
| `version_number` | 1, 2, 3...              |
| `storage_key`    | Physical key версии     |
| `uploaded_by`    | Кто загрузил            |
| `uploaded_at`    | Когда                   |
| `change_note`    | Что изменилось          |
| `size_bytes`     | Размер версии           |
| `checksum`       | Hash версии             |
| `is_current`     | Текущая версия          |

---

## 5. File Link

`File Link` связывает один файл с бизнес-сущностями NBOS.

Минимальная модель:

| Поле               | Назначение                                                            |
| ------------------ | --------------------------------------------------------------------- |
| `file_asset_id`    | Какой файл                                                            |
| `entity_type`      | Deal, Project, Product, Invoice, Task, SupportTicket и т.д.           |
| `entity_id`        | ID сущности                                                           |
| `link_type`        | Attachment, Approved Document, Proof, Source Material, Final Delivery |
| `purpose_override` | Если в этом контексте файл имеет особый смысл                         |
| `is_primary`       | Главный файл этого типа                                               |
| `linked_by`        | Кто связал                                                            |
| `linked_at`        | Когда                                                                 |
| `unlinked_at`      | Если связь удалена                                                    |

Пример:

```text
File Asset: offer-v3.pdf
Links:
  Deal #123 -> Offer Approved
  Product #456 -> Handoff Source
  Project #789 -> Commercial Document
  Company #321 -> Client Commercial Archive
```

---

## 6. Status

| Status     | Значение                                              |
| ---------- | ----------------------------------------------------- |
| `Draft`    | Черновик, может быть очищен быстрее                   |
| `Active`   | Рабочий файл                                          |
| `Approved` | Финальный / согласованный документ                    |
| `Archived` | Больше не используется в активной работе, но хранится |
| `Deleted`  | Soft deleted, ожидает physical cleanup                |

Approved files нельзя удалять обычным delete.

---

## 7. External Links

Не все материалы должны быть загружены физически.

Drive должен поддерживать `External Link File Asset`:

- Google Docs;
- Figma;
- Notion;
- Loom;
- external invoice / receipt link;
- messenger file URL, если файл не перенесён.

Для external link всё равно создаётся File Asset с metadata и связями. Если ссылка важная, позже можно сделать internal snapshot.
