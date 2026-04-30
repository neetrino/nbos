# Credentials Cleanup Register

> Что в текущей реализации Credentials нужно переделать по новому канону

## Runtime Cleanup Register

Этот раздел фиксирует, что уже реализовано частично и что нужно переделать при реализации нового канона.

| Область                       | Статус                              | Что сейчас                                                                                                             | Что нужно сделать                                                     |
| ----------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Basic credential CRUD         | PARTIAL                             | Создание, список, edit, архив, restore, permanent только для archived + подтверждение имени                            | Item types, secret fields, версии, TTL / step-up по политике          |
| Encryption                    | PARTIAL                             | Шифруются `password`, `apiKey`, `envData`                                                                              | Шифровать все secret fields и secure notes; перейти к гибкой модели   |
| Notes                         | DONE                                | `publicNotes` остаётся non-secret metadata; `secureNotes` шифруется и открывается через audited reveal/copy            | Гибкая secret-field модель позже                                      |
| Access model                  | PARTIAL                             | Есть enum accessLevel и allowedEmployees                                                                               | Добавить Access Grants, temporary access, requests, expiry            |
| Permission check              | PARTIAL                             | `findById` / `update` / `delete` используют тот же visibility OR, что и list, перед reveal/mutation                    | Grants, temporary access, requests, expiry по канону                  |
| Reveal/copy audit             | PARTIAL                             | `POST …/secrets/reveal` и `…/copy`, audit `secret_revealed` / `secret_copied`; GET/list без секретов, `secretsPresent` | Step-up, уведомления high-risk, UX auto-hide                          |
| List API                      | PARTIAL                             | List не отдаёт ciphertext; есть `secretsPresent`; открытие URL через `open-url` + audit                                | Health/context/search metadata                                        |
| URL opened audit              | PARTIAL                             | `POST …/open-url` + `credential.url_opened`; только http(s)                                                            | Уведомления high-risk, deep-links по политике                         |
| Credential types              | DONE                                | Добавлен `credentialType` поверх category                                                                              | Обязательные поля по type расширять позже                             |
| Context links                 | PARTIAL                             | Есть Project/Department/Owner + scalar context fields `productId`, `domainId`, `clientServiceRecordId`                 | Support/Work Space/grants later                                       |
| Rotation                      | PARTIAL                             | Добавлены `lastRotatedAt`, `nextRotationAt`, `rotationOwnerId`; UI показывает next rotation                            | Автоматический status/tasks later                                     |
| Emergency access              | MISSING                             | Нет                                                                                                                    | Добавить break-glass flow с reason, expiry, audit, notification       |
| Access requests               | MISSING                             | Нет                                                                                                                    | Добавить request/approve/reject flow                                  |
| Export/backup                 | PARTIAL IN DOCS, MISSING IN RUNTIME | Описано концептуально                                                                                                  | Реализовать encrypted export/backup policy                            |
| UI for 1000+ records          | PARTIAL                             | Таблица + простые tabs/filter                                                                                          | Пересобрать UX: saved views, facets, favorites, recently used, drawer |
| Bulk actions                  | MISSING                             | Нет                                                                                                                    | Добавить bulk assign/tag/rotation/archive                             |
| Offboarding support           | MISSING                             | Нет                                                                                                                    | Связать с My Company offboarding                                      |
| Drive/Messenger incident flow | MISSING                             | Есть канон в docs                                                                                                      | Реализовать detection/manual incident flow позже                      |
| Hard delete                   | PARTIAL                             | Архив + restore; `DELETE …/permanent` только для archived, audit `permanently_deleted`; UI — подтверждение по имени    | Retention TTL, scheduled purge, step-up по политике                   |

---

## Documentation: Mail module

| Область            | Статус | Примечание                                                                                   |
| ------------------ | ------ | -------------------------------------------------------------------------------------------- |
| Cross-link to Mail | `OK`   | **2026-04-30:** `05-Credentials-Integrations.md` — секция **Mail** (OAuth/IMAP/SMTP secrets) |
