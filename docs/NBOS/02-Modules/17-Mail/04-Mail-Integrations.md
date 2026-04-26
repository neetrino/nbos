# Mail Integrations

Mail полезен только тогда, когда письмо можно быстро связать с правильным бизнес-контекстом NBOS.

При этом Mail не должен забирать ответственность соседних модулей.

## Clients

| Связь                    | Правило                                                             |
| ------------------------ | ------------------------------------------------------------------- |
| Email address -> Contact | Письмо может автоматически предложить Contact по email              |
| Contact -> Company       | Company подтягивается из Client module                              |
| Client profile -> emails | Client profile показывает связанные email threads                   |
| Unknown sender           | Попадает в Needs Link или может создать Contact после подтверждения |

Contact/Company остаются source of truth для клиентских данных.

## CRM

| Связь               | Правило                                                         |
| ------------------- | --------------------------------------------------------------- |
| Lead email          | Входящее письмо может быть связано с Lead                       |
| Deal email          | Переписка по продаже может быть связана с Deal                  |
| Offer attachments   | Вложения/КП сохраняются через Drive и связываются с Deal        |
| New unknown inquiry | Может предложить создать Lead, но не создаёт Deal автоматически |

CRM status меняется в CRM, а не в Mail.

## Support

Support intake может прийти через email.

Процесс:

```text
Client sends email
  -> Mail receives message
  -> user links thread to Project/Product/Contact
  -> user creates Support Ticket if this is an issue/request
  -> support work continues in Support/Tasks
  -> reply can be sent from Mail context
```

Mail thread может быть виден в Ticket, но Ticket lifecycle остаётся в Support.

## Projects Hub

Project/Product pages могут показывать связанные email threads:

- client delivery questions;
- project handoff emails;
- maintenance communication;
- extension requests;
- technical confirmations without secrets.

Projects Hub не должен превращаться в email client. Он показывает relevant threads in context.

## Finance

Finance может использовать Mail для:

- отправки invoice клиенту вручную;
- просмотра клиентских вопросов по оплате;
- связи email thread с Invoice;
- хранения payment proof attachments через Drive.

Finance statuses, payments и invoice lifecycle меняются только в Finance module.

## Drive

Все email attachments идут через Drive:

- PDFs;
- screenshots;
- documents;
- signed offers;
- payment proofs;
- support evidence.

Drive управляет хранением, доступом, cleanup, preview и download.

## Credentials

Mail не хранит secrets.

Через Credentials boundary идут:

- Gmail refresh tokens или secure token reference;
- IMAP/SMTP passwords;
- app passwords;
- OAuth client secrets;
- provider service credentials.

Если в письме найден пароль, token или `.env`, это security-sensitive content. Его нельзя превращать в обычный файл/заметку без правил Credentials.

## Notifications

Notifications отвечает за системные email messages и alerts.

Mail отвечает за:

- manual inbox;
- email history;
- replies;
- connected mailboxes;
- sync/send health.

Пример:

```text
Invoice reminder due
  -> Notifications sends system email
  -> optional copy appears in Mail/Messenger history if required
  -> client reply arrives into Mail
```

Если клиент ответил на системное письмо, дальнейшая переписка уже Mail inbound, а не Notification.

## Messenger

Mail и Messenger не должны смешиваться в один неразборчивый список.

| Mail                                              | Messenger                                       |
| ------------------------------------------------- | ----------------------------------------------- |
| Email protocol, subjects, recipients, attachments | Chat/channel conversations                      |
| Gmail / IMAP / SMTP                               | Internal chat, WhatsApp, external chat adapters |
| EmailThread / EmailMessage                        | Conversation / Message                          |
| Inbox UI                                          | Chat UI                                         |

В будущем возможен unified communication surface, но source entities должны остаться разными.

## Technical Infrastructure

Mail может создавать technical health signals:

- mailbox disconnected;
- sync failed;
- SMTP failed;
- Gmail quota/rate limit;
- attachment processing failed.

Critical health events могут идти в Notifications или Technical/Admin dashboards.

## Settings / Admin

Settings/Admin управляет:

- connected mailboxes;
- provider configuration;
- send permissions;
- reconnect flow;
- feature flags;
- audit/error views.

## MVP decisions

- Mail links to business entities, but owning module keeps lifecycle authority.
- Attachments always go through Drive.
- Tokens and passwords always go through Credentials boundary.
- System-generated email belongs to Notifications; manual mailbox work belongs to Mail.
- Messenger and Mail remain separate modules in data model and UX.
