# Credentials Cleanup Register

> Что в текущей реализации Credentials нужно переделать по новому канону

## Runtime Cleanup Register

Этот раздел фиксирует, что уже реализовано частично и что нужно переделать при реализации нового канона.

| Область                       | Статус                              | Что сейчас                                                              | Что нужно сделать                                                      |
| ----------------------------- | ----------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Basic credential CRUD         | PARTIAL                             | Есть создание, список, обновление, удаление                             | Расширить до item types, secret fields, soft delete, versions          |
| Encryption                    | PARTIAL                             | Шифруются `password`, `apiKey`, `envData`                               | Шифровать все secret fields и secure notes; перейти к гибкой модели    |
| Notes                         | STALE/RISK                          | `notes` не шифруются                                                    | Разделить на public notes и secure notes                               |
| Access model                  | PARTIAL                             | Есть enum accessLevel и allowedEmployees                                | Добавить Access Grants, temporary access, requests, expiry             |
| Permission check              | RISK                                | `findById` возвращает credential после общего module permission         | Проверять доступ пользователя к конкретному credential перед reveal    |
| Reveal/copy audit             | MISSING                             | View логируется, copy/reveal как отдельные события не описаны в runtime | Сделать отдельные endpoints/actions и audit events                     |
| List API                      | PARTIAL                             | List не возвращает secrets                                              | Оставить, но добавить health/context/search metadata                   |
| Credential types              | MISSING                             | Есть только category                                                    | Добавить credential type и обязательные поля по type                   |
| Context links                 | PARTIAL                             | Есть Project/Department/Owner                                           | Добавить Product, Client Service, Domain, Hosting, Support, Work Space |
| Rotation                      | MISSING                             | Нет rotation policy/status                                              | Добавить last rotated, next rotation, owner, overdue status            |
| Emergency access              | MISSING                             | Нет                                                                     | Добавить break-glass flow с reason, expiry, audit, notification        |
| Access requests               | MISSING                             | Нет                                                                     | Добавить request/approve/reject flow                                   |
| Export/backup                 | PARTIAL IN DOCS, MISSING IN RUNTIME | Описано концептуально                                                   | Реализовать encrypted export/backup policy                             |
| UI for 1000+ records          | PARTIAL                             | Таблица + простые tabs/filter                                           | Пересобрать UX: saved views, facets, favorites, recently used, drawer  |
| Bulk actions                  | MISSING                             | Нет                                                                     | Добавить bulk assign/tag/rotation/archive                              |
| Offboarding support           | MISSING                             | Нет                                                                     | Связать с My Company offboarding                                       |
| Drive/Messenger incident flow | MISSING                             | Есть канон в docs                                                       | Реализовать detection/manual incident flow позже                       |
| Hard delete                   | RISK                                | Удаление физическое                                                     | Заменить на archive/soft delete + permanent delete policy              |
