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

| Area                 | Status    | Action                                                                                               |
| -------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| Mail backend module  | `MISSING` | Создать NestJS module после gap-analysis и утверждения implementation plan                           |
| Mail database schema | `MISSING` | Добавить MailAccount, EmailThread, EmailMessage, EmailRecipient, EmailAttachment, sync/delivery logs |
| Gmail adapter        | `MISSING` | Спроектировать OAuth scopes и adapter contract                                                       |
| IMAP/SMTP adapter    | `MISSING` | Спроектировать connection validation, sync cursor, send flow                                         |
| Queue jobs           | `MISSING` | Добавить jobs для sync, send, attachment download                                                    |
| Mail UI              | `MISSING` | Создать inbox, thread detail, compose/reply, settings/health screens                                 |
| Permissions          | `MISSING` | Добавить MailAccount roles и send/read/link checks                                                   |
| Attachment pipeline  | `MISSING` | Интегрировать Mail attachments с Drive File Asset                                                    |
| Credentials boundary | `MISSING` | Интегрировать token/password storage с secure storage / Credentials                                  |
| Notifications events | `MISSING` | Добавить mail health and inbound message events                                                      |

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
