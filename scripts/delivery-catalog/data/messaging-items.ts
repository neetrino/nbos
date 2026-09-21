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
    title: 'Email notifications',
    summary: 'Template-based emails triggered by product events.',
    scopeBoundaries:
      'Delivery provider, agreed event set, email templates, unsubscribe flow, and deliverability checks.',
    units: { BACKEND: 10, FRONTEND: 3, PM: 2, DESIGNER: 2, QA: 3, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'MSG_SMS_NOTIFICATIONS',
    category: 'messaging',
    iconKey: 'Smartphone',
    title: 'SMS notifications',
    summary: 'Event-based SMS delivery through a provider.',
    scopeBoundaries:
      'One provider, agreed events, templates, sending limits and costs, and failure handling.',
    units: { BACKEND: 12, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 1 },
  },
  {
    code: 'MSG_WHATSAPP_NOTIFICATIONS',
    category: 'messaging',
    iconKey: 'MessageCircle',
    title: 'WhatsApp notifications',
    summary: 'Template message delivery through WhatsApp.',
    scopeBoundaries:
      'Number connection, template approval, event-based delivery, and error and limit handling. Operator conversations are a separate card.',
    units: { BACKEND: 18, PM: 3, QA: 4, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'MSG_TELEGRAM_BOT',
    category: 'messaging',
    iconKey: 'Send',
    title: 'Telegram bot',
    summary: 'A bot for notifications and simple commands.',
    scopeBoundaries:
      'Bot creation, account linking, agreed commands and notifications, and error handling.',
    units: { BACKEND: 14, FRONTEND: 3, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'MSG_VIBER_NOTIFICATIONS',
    category: 'messaging',
    iconKey: 'MessageCircle',
    title: 'Viber notifications',
    summary: 'Message delivery through Viber Business.',
    scopeBoundaries: 'Channel connection, templates, event-based delivery, and failure handling.',
    units: { BACKEND: 15, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'MSG_PUSH_WEB',
    category: 'messaging',
    iconKey: 'Bell',
    title: 'Web push',
    summary: 'Browser push notifications.',
    scopeBoundaries:
      'Permission request, subscriptions, event-based and manual delivery, unsubscribe flow, and browser behavior.',
    units: { BACKEND: 12, FRONTEND: 6, PM: 2, QA: 3 },
  },
  {
    code: 'MSG_IN_APP_INBOX',
    category: 'messaging',
    iconKey: 'Bell',
    title: 'In-app notification center',
    summary: 'An in-product notification list with unread state.',
    scopeBoundaries:
      'Notification storage, unread state, marking as read, grouping, and access to personal notifications.',
    units: { BACKEND: 14, FRONTEND: 10, PM: 2, DESIGNER: 3, QA: 4 },
  },
  {
    code: 'MSG_OPERATOR_CHAT',
    category: 'messaging',
    iconKey: 'Headphones',
    title: 'Customer support chat',
    summary: 'In-product conversation between a customer and an operator.',
    scopeBoundaries:
      'Conversations, operator assignment, history, attachments, and read status. A full standalone messenger is excluded.',
    units: { BACKEND: 34, FRONTEND: 22, PM: 5, DESIGNER: 6, QA: 8 },
  },
  {
    code: 'MSG_INTERNAL_MESSENGER',
    category: 'messaging',
    iconKey: 'MessageSquare',
    title: 'Internal messenger',
    summary: 'Employee messaging inside the system.',
    scopeBoundaries:
      'Direct and group conversations, attachments, history search, notifications, and permissions. Calls and video are excluded.',
    units: { BACKEND: 45, FRONTEND: 30, PM: 6, DESIGNER: 8, QA: 10 },
  },
  {
    code: 'MSG_BULK_CAMPAIGNS',
    category: 'messaging',
    iconKey: 'Send',
    title: 'Bulk messaging campaigns',
    summary: 'Segment-based campaigns with rate limiting.',
    scopeBoundaries:
      'Recipient segments, template, schedule, rate limiting, delivery report, and opt-outs.',
    units: { BACKEND: 20, FRONTEND: 10, PM: 3, DESIGNER: 2, QA: 5 },
  },
  {
    code: 'MSG_CALL_TELEPHONY',
    category: 'messaging',
    iconKey: 'Phone',
    title: 'Telephony integration',
    summary: 'Calls from the interface with call recording.',
    scopeBoundaries:
      'One PBX or provider: outbound calls from a record, call log, recording when supported, and customer linkage.',
    units: { BACKEND: 22, FRONTEND: 10, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 4 },
  },
] as const;
