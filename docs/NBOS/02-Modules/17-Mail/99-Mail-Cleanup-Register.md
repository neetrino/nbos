# Mail Cleanup Register

Mail module является новым каноном. На момент создания документации полноценной реализации Mail в NBOS не зафиксировано.

Этот register нужен, чтобы при future gap-analysis не смешать Mail с Messenger, Notifications или generic email delivery.

## Status legend

| Status              | Значение                                 |
| ------------------- | ---------------------------------------- |
| `OK`                | Уже совпадает с каноном                  |
| `PARTIAL`           | Частично совпадает                       |
| `MISSING`           | Нужно добавить                           |
| `STALE`             | Устаревшая логика, нужно убрать/заменить |
| `BUSINESS DECISION` | Нужно отдельное решение owner            |

## Documentation cleanup

| Area                           | Status    | Action                                                                      |
| ------------------------------ | --------- | --------------------------------------------------------------------------- |
| Mail module docs               | `OK`      | Новый канон создан в `17-Mail`                                              |
| Documentation hub link         | `OK`      | Mail добавлен в центральный указатель документации                          |
| Cross-links from Messenger     | `MISSING` | При следующем проходе Messenger добавить явное разделение Mail vs Messenger |
| Cross-links from Notifications | `MISSING` | Уточнить, что system email delivery не равен Mail inbox                     |
| Cross-links from Credentials   | `MISSING` | Уточнить storage OAuth/SMTP secrets для Mail                                |
| Cross-links from Drive         | `MISSING` | Уточнить source `email_attachment` для File Asset                           |

## Runtime cleanup

| Area                 | Status    | Action                                                                                                                                                                                                                                                                                    |
| -------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mail backend module  | `PARTIAL` | **2026-04-29:** `POST …/drafts`, queue, `finalize-send-stub`, `reset-failed-to-draft`, `cancel`, **`POST …/accounts/:id/sync-stub`** (+ in-app notify), list `unreadOnly` + `needsLinkOnly` + **`q` subject search**, **`PATCH …/threads/:id`**, mark-read + audits; без SMTP/sync/worker |
| Mail database schema | `PARTIAL` | **2026-04-29:** + `EmailDeliveryStatus` на `EmailMessage`; нет `EmailAttachment`, `MailDeliveryLog`, `MailProviderConnection`                                                                                                                                                             |
| Gmail adapter        | `MISSING` | Спроектировать OAuth scopes и adapter contract                                                                                                                                                                                                                                            |
| IMAP/SMTP adapter    | `MISSING` | Спроектировать connection validation, sync cursor, send flow                                                                                                                                                                                                                              |
| Queue jobs           | `MISSING` | Добавить jobs для sync, send, attachment download                                                                                                                                                                                                                                         |
| Mail UI              | `PARTIAL` | **2026-04-29:** inbox (stub **sync** per mailbox, All / Unread / **Needs link**, **subject search** debounced), thread (needs-link PATCH, **Queue**/Cancel draft, Finalize/Cancel queued, **Reset failed→draft**, reply, mark read); нет реальной отправки/settings/health                |
| Permissions          | `PARTIAL` | Модуль `MAIL` в seed RBAC (VIEW/EDIT/ADD/DELETE по матрице); list scoped ALL vs OWN mailbox owner; нет per-account roles из канона                                                                                                                                                        |
| Attachment pipeline  | `MISSING` | Интегрировать Mail attachments с Drive File Asset                                                                                                                                                                                                                                         |
| Credentials boundary | `MISSING` | Интегрировать token/password storage с secure storage / Credentials                                                                                                                                                                                                                       |
| Notifications events | `PARTIAL` | **2026-04-29:** после `sync-stub` — in-app актору (+ владелец ящика при отличии); **2026-04-29:** строки в `in_app_notifications` (Prisma), API ленты на БД; health/inbound/real sync events — ещё `MISSING`                                                                              |

## Business decisions needed before implementation

| Decision                            | Why it matters                                                             |
| ----------------------------------- | -------------------------------------------------------------------------- |
| Historical import limit             | Full mailbox import может быть дорогим и медленным                         |
| Gmail OAuth scopes                  | Security-sensitive decision                                                |
| Corporate mailbox credential policy | Нужно решить app passwords vs mailbox passwords vs provider-specific setup |
| Sync frequency                      | Влияет на cost, rate limits и user expectations                            |
| Provider read-state sync            | Нужно ли менять read/unread обратно в Gmail/IMAP                           |
| Shared mailbox assignment           | Не входит в MVP, но может понадобиться support/sales                       |
| Email retention policy              | Нужно решить, как долго хранить локальную копию писем/attachments          |

## MVP backlog

1. Утвердить Mail как `17-Mail` module в roadmap.
2. Утвердить provider support: Gmail + corporate IMAP/SMTP.
3. Утвердить initial import limit и sync frequency.
4. Спроектировать Prisma schema.
5. Спроектировать provider adapter contract.
6. Реализовать backend sync/send jobs.
7. Реализовать inbox/thread UI.
8. Подключить Drive attachments.
9. Подключить Credentials boundary.
10. Добавить admin health/error view.
