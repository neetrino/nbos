# External Messenger and CRM Inbox

`External Messenger` - зона реальной коммуникации с клиентами и внешними участниками. Всё, что здесь отправлено, потенциально видно не только команде Neetrino.

Эта зона должна быть визуально отделена от Internal Messenger.

## Вкладки

| Tab                       | Что показывает                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| `CRM Inbox`               | Direct client conversations по Lead/Deal из WhatsApp, Instagram, Facebook, Telegram, email |
| `Project WhatsApp Groups` | Клиентские группы после Deal Won                                                           |
| `Support Conversations`   | Общение по support tickets                                                                 |
| `Finance Conversations`   | Общение по оплатам, счетам, reminders                                                      |
| `All External`            | Все внешние conversations с фильтрами                                                      |
| `Favorites / Collections` | Личные избранные внешние чаты                                                              |

## CRM Inbox

`CRM Inbox` - это не внутренний Deal Chat.

Это реальная внешняя переписка с клиентом по каналу, где клиент написал:

- WhatsApp;
- Instagram;
- Facebook Messenger;
- Telegram;
- email;
- website chat, если будет подключён.

CRM Inbox используется для:

- входящих лидов;
- sales переписки;
- уточнения оффера;
- фиксации согласования;
- связи conversation с Contact, Company, Lead, Deal.

Если из CRM Inbox появляется бизнес-действие, система может:

- создать Lead;
- привязать conversation к существующему Lead/Deal;
- создать Task;
- сохранить файл/скриншот как Drive File Asset;
- отметить сообщение как offer proof.

Для WhatsApp 1:1 в NBOS используется тот же `WhatsAppWebAdapter`, что и для групп. 1:1 chats являются вторичным сценарием: в основном Seller может отвечать клиенту напрямую из CRM Inbox.

## Project WhatsApp Groups

После Deal Won может существовать клиентская WhatsApp group.

Это внешний чат, где участвуют:

- клиент;
- PM;
- Seller при необходимости;
- support/maintenance team;
- другие сотрудники, если их добавили.

Канон:

- WhatsApp group связана с Project и обычно с одним или несколькими Products;
- она не заменяет internal Product Chat;
- она может жить после завершения разработки и использоваться годами для Maintenance;
- системные сообщения по Maintenance, Support и Finance могут попадать сюда, если клиенту включены такие уведомления.

## Support Conversations

Support conversation - внешнее общение вокруг Ticket.

Правило:

- Ticket остаётся рабочей сущностью;
- Messenger показывает переписку;
- Task создаётся только если нужно внутреннее выполнение;
- файлы клиента сохраняются как Drive File Assets и связываются с Ticket.

## Finance Conversations

Finance conversation - внешнее общение по оплатам.

Может использоваться для:

- напоминаний по Invoice;
- подтверждения оплаты;
- вопросов по Official Invoice;
- клиентских вопросов по подписке.

Finance status меняется в Finance module, не вручную из чата. Сообщение может только инициировать действие или оставить audit trail.

## WhatsApp adapter canon

Для WhatsApp в NBOS канонический путь на ближайшие годы:

```text
NBOS Messenger / CRM
  -> WhatsAppWebAdapter
    -> WAHA
      -> QR-connected WhatsApp account
        -> WhatsApp Groups / 1:1 chats
```

`WhatsAppWebAdapter` - тип адаптера внутри NBOS.
`WAHA` - первый технический инструмент для реализации этого адаптера.
`QR-connected WhatsApp account` - способ подключения нашего WhatsApp-аккаунта, как обычный WhatsApp Web.

Этот путь покрывает:

- Project WhatsApp Groups;
- invoice reminders в группы;
- maintenance/support уведомления в группы;
- бухгалтерскую WhatsApp-группу;
- редкие WhatsApp 1:1 chats;
- чтение и отправку сообщений из NBOS Messenger/CRM.

`WhatsAppOfficialAdapter / Meta Cloud API` не является MVP и не является планом на ближайшие годы. Его можно оставить только как distant future option, если бизнес-модель радикально изменится.

Fallback варианты, если WAHA окажется нестабильным:

| Вариант                      | Роль                                                           |
| ---------------------------- | -------------------------------------------------------------- |
| `Whapi` / `Wazzup` / `Wappi` | Managed provider fallback для WhatsApp Web / group-capable API |
| `Evolution API`              | Second self-hosted candidate, если WAHA не подойдёт            |

В любом случае бизнес-логика NBOS должна зависеть только от `External Channel Adapter`, а не от конкретного сервиса.

## External safety

Внешний composer должен явно показывать:

- что сообщение уйдёт клиенту;
- в какой канал оно уйдёт;
- имя Contact/Company/Project;
- кто отправитель;
- есть ли automation или manual send.

Для внешних сообщений желательно заложить:

- label `Client visible`;
- отдельный цвет/рамку;
- permission check перед отправкой;
- audit log;
- возможность future-delay/undo для опасных каналов.

## Что не должно попадать во External Messenger

- внутренние комментарии по Deal;
- обсуждение бонусов;
- технические споры команды;
- пароли и секреты;
- сообщения, которые должны быть Task comment только для команды.

Для этого есть Internal Messenger, Tasks, Drive и Credentials.
