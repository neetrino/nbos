import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * Уведомления и мессенджеры. Канал и содержательный сценарий разделены: подключить WhatsApp и
 * построить в нём полноценный диалог с клиентом — работа разного объёма.
 */
export const MESSAGING_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'MSG_EMAIL_NOTIFICATIONS',
    category: 'messaging',
    iconKey: 'Mail',
    title: 'Email-уведомления',
    summary: 'Письма по событиям продукта с шаблонами.',
    scopeBoundaries:
      'Провайдер отправки, согласованный набор событий, шаблоны писем, отписка, проверка доставляемости.',
    units: { BACKEND: 10, FRONTEND: 3, PM: 2, DESIGNER: 2, QA: 3, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'MSG_SMS_NOTIFICATIONS',
    category: 'messaging',
    iconKey: 'Smartphone',
    title: 'SMS-уведомления',
    summary: 'Отправка SMS по событиям через провайдера.',
    scopeBoundaries:
      'Один провайдер, согласованные события, шаблоны, лимиты и стоимость отправки, обработка отказов.',
    units: { BACKEND: 12, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'MSG_WHATSAPP_NOTIFICATIONS',
    category: 'messaging',
    iconKey: 'MessageCircle',
    title: 'WhatsApp-уведомления',
    summary: 'Отправка шаблонных сообщений в WhatsApp.',
    scopeBoundaries:
      'Подключение номера, согласование шаблонов, отправка по событиям, обработка ошибок и лимитов. Диалог с оператором — отдельная карточка.',
    units: { BACKEND: 18, PM: 3, QA: 4, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'MSG_TELEGRAM_BOT',
    category: 'messaging',
    iconKey: 'Send',
    title: 'Telegram-бот',
    summary: 'Бот для уведомлений и простых команд.',
    scopeBoundaries:
      'Создание бота, привязка аккаунта, согласованные команды и уведомления, обработка ошибок.',
    units: { BACKEND: 14, FRONTEND: 3, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'MSG_VIBER_NOTIFICATIONS',
    category: 'messaging',
    iconKey: 'MessageCircle',
    title: 'Viber-уведомления',
    summary: 'Отправка сообщений через Viber Business.',
    scopeBoundaries: 'Подключение канала, шаблоны, отправка по событиям, обработка отказов.',
    units: { BACKEND: 15, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'MSG_PUSH_WEB',
    category: 'messaging',
    iconKey: 'Bell',
    title: 'Web push',
    summary: 'Браузерные push-уведомления.',
    scopeBoundaries:
      'Запрос разрешения, подписки, отправка по событиям и вручную, отписка, поведение в браузерах.',
    units: { BACKEND: 12, FRONTEND: 6, PM: 2, QA: 3 },
  },
  {
    code: 'MSG_IN_APP_INBOX',
    category: 'messaging',
    iconKey: 'Bell',
    title: 'Центр уведомлений в продукте',
    summary: 'Список уведомлений внутри интерфейса с непрочитанными.',
    scopeBoundaries:
      'Хранение уведомлений, непрочитанные, отметка о прочтении, группировка, права доступа к своим уведомлениям.',
    units: { BACKEND: 14, FRONTEND: 10, PM: 2, DESIGNER: 3, QA: 4 },
  },
  {
    code: 'MSG_OPERATOR_CHAT',
    category: 'messaging',
    iconKey: 'Headphones',
    title: 'Чат с оператором',
    summary: 'Диалог клиента с оператором внутри продукта.',
    scopeBoundaries:
      'Диалоги, распределение на операторов, история, вложения, статусы прочтения. Полноценный мессенджер как отдельный продукт не входит.',
    units: { BACKEND: 34, FRONTEND: 22, PM: 5, DESIGNER: 6, QA: 8 },
  },
  {
    code: 'MSG_INTERNAL_MESSENGER',
    category: 'messaging',
    iconKey: 'MessageSquare',
    title: 'Внутренний мессенджер',
    summary: 'Переписка сотрудников внутри системы.',
    scopeBoundaries:
      'Личные и групповые диалоги, вложения, поиск по истории, уведомления, права доступа. Звонки и видео не входят.',
    units: { BACKEND: 45, FRONTEND: 30, PM: 6, DESIGNER: 8, QA: 10 },
  },
  {
    code: 'MSG_BULK_CAMPAIGNS',
    category: 'messaging',
    iconKey: 'Send',
    title: 'Массовые рассылки',
    summary: 'Рассылка по сегментам с ограничением скорости.',
    scopeBoundaries:
      'Сегменты получателей, шаблон, расписание, ограничение скорости, отчёт об отправке и отписки.',
    units: { BACKEND: 20, FRONTEND: 10, PM: 3, DESIGNER: 2, QA: 5 },
  },
  {
    code: 'MSG_CALL_TELEPHONY',
    category: 'messaging',
    iconKey: 'Phone',
    title: 'Интеграция телефонии',
    summary: 'Звонки из интерфейса и запись разговоров.',
    scopeBoundaries:
      'Одна АТС или провайдер: исходящий звонок из карточки, журнал звонков, запись при наличии у провайдера, привязка к клиенту.',
    units: { BACKEND: 22, FRONTEND: 10, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 4 },
  },
] as const;
