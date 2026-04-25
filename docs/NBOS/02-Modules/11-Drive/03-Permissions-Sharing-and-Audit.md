# Permissions, Sharing And Audit

## 1. Главный принцип доступа

Доступ к файлу определяется не только папкой. Он рассчитывается из:

1. global RBAC;
2. связанной сущности;
3. роли пользователя в проекте / продукте / сделке / задаче;
4. confidentiality уровня файла;
5. explicit overrides.

Формула:

```text
Can access file =
  module permission
  + entity access
  + file visibility
  - confidentiality restrictions
  + explicit grants
```

---

## 2. Visibility

| Visibility           | Значение                                      |
| -------------------- | --------------------------------------------- |
| `Personal`           | Видит только владелец                         |
| `Internal`           | Видно внутри компании по module/entity access |
| `Project Team`       | Видят участники проекта / продукта            |
| `Restricted`         | Только явно указанные сотрудники              |
| `Finance Restricted` | Finance / Owner / CEO и разрешённые           |
| `Client Visible`     | Можно показывать клиенту в future portal      |
| `Partner Visible`    | Можно показывать партнёру в future portal     |

Client Visible и Partner Visible не означают автоматическую публикацию. Это разрешение на будущую portal visibility.

---

## 3. Confidentiality

| Уровень             | Примеры                                           |
| ------------------- | ------------------------------------------------- |
| `Normal`            | Рабочие изображения, обычные attachments          |
| `Confidential`      | Internal notes, sensitive project docs            |
| `Finance Sensitive` | Invoice proof, payment proof, P&L, salary exports |
| `Legal Sensitive`   | Contracts, agreements, NDA                        |
| `Secret Adjacent`   | Документы рядом с credentials, но без паролей     |

`Secret Adjacent` не должен содержать пароль, API key или `.env`. Если содержит, файл надо перенести в Credentials или заменить encrypted credential record.

---

## 4. Inherited Access

Примеры inherited access:

| Link                     | Кто видит                                           |
| ------------------------ | --------------------------------------------------- |
| File -> Deal             | Seller, Head of Sales, CEO, allowed CRM users       |
| File -> Project          | PM, project participants, CEO                       |
| File -> Product          | Product team, PM, CEO                               |
| File -> Task             | task assignee, co-assignees, watchers, task creator |
| File -> Work Space       | users with workspace access                         |
| File -> Invoice          | Finance, CEO, allowed Seller/PM depending on policy |
| File -> Partner          | Partner manager, Finance, CEO                       |
| File -> Client Portfolio | users allowed to view that client context           |

Если файл имеет несколько links, доступ может расширяться, но confidentiality может снова ограничивать.

---

## 5. Explicit Grants

Drive должен поддерживать явные grants:

- employee can view;
- employee can edit metadata;
- employee can upload new version;
- employee can share;
- employee can delete;
- employee can export.

Для sensitive files grant должен иметь:

- who granted;
- reason;
- expiration date, если временный доступ;
- audit event.

---

## 6. Sharing

### Internal sharing

Сотрудник может поделиться файлом внутри NBOS:

- с сотрудником;
- с department / seat;
- с project team;
- с task participants.

### External sharing

Внешний sharing в MVP лучше ограничить.

Допустимые варианты:

- generated temporary download link только для authorised flow;
- portal visibility в будущем;
- manual export.

Нельзя делать публичные постоянные ссылки на finance/legal/sensitive files.

---

## 7. Audit

Audit обязателен для:

- upload;
- preview;
- download;
- new version;
- link/unlink;
- permission grant/revoke;
- archive;
- delete;
- restore;
- export;
- external share.

Audit event:

| Поле                | Назначение                 |
| ------------------- | -------------------------- |
| `file_asset_id`     | Файл                       |
| `actor_employee_id` | Кто сделал                 |
| `action`            | Что сделал                 |
| `entity_context`    | Из какой карточки / модуля |
| `ip_address`        | Для security               |
| `user_agent`        | Для security               |
| `created_at`        | Когда                      |
| `reason`            | Если требуется             |

---

## 8. Portal Readiness

Drive должен быть готов к future Client Account и Partner Account.

Для этого у файла должны быть:

- `client_visible`;
- `partner_visible`;
- `portal_label`;
- `portal_description`;
- `portal_download_allowed`;
- `portal_expires_at`.

Но до реализации portal внешние пользователи не получают доступ автоматически.
