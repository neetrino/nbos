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

## WhatsApp / QR adapters

NBOS не должен зависеть от одного WhatsApp-провайдера. Нужен слой `External Channel Adapter`.

Возможные варианты:

| Adapter type             | Для чего                                                            |
| ------------------------ | ------------------------------------------------------------------- |
| `Provider API`           | Wappi, ChatApp или похожий сервис                                   |
| `WhatsApp Web QR Bridge` | Подключение через QR, если нужен доступ к group chats               |
| `Own QR Bridge`          | Будущий собственный мост, если будет выгодно контролировать процесс |
| `Official API`           | Если функционал официального API подходит для нужного сценария      |

Провайдер может меняться, но бизнес-логика NBOS не должна переписываться.

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
