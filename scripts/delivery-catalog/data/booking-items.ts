import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * Бронирование и записи. Может быть и самостоятельным продуктом, и модулем внутри системы —
 * карточки здесь про модуль; отдельная платформа бронирования собирается из ядра плюс эти модули.
 */
export const BOOKING_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'BOOK_RESOURCE_SCHEDULE',
    category: 'booking',
    iconKey: 'CalendarCheck',
    title: 'Запись к ресурсу',
    summary: 'Бронирование времени специалиста или ресурса.',
    scopeBoundaries:
      'Ресурсы и их график, свободные слоты, создание и отмена записи, защита от двойного бронирования.',
    units: { BACKEND: 24, FRONTEND: 14, PM: 3, DESIGNER: 4, QA: 6 },
  },
  {
    code: 'BOOK_CALENDAR_VIEW',
    category: 'booking',
    iconKey: 'Calendar',
    title: 'Календарь занятости',
    summary: 'Календарь записей по дням, неделям и ресурсам.',
    scopeBoundaries:
      'Виды день и неделя, несколько ресурсов рядом, перенос перетаскиванием, фильтры. Мобильный вид входит.',
    units: { BACKEND: 12, FRONTEND: 20, PM: 3, DESIGNER: 5, QA: 5 },
  },
  {
    code: 'BOOK_RECURRING',
    category: 'booking',
    iconKey: 'Repeat',
    title: 'Повторяющиеся записи',
    summary: 'Серии записей с правилом повторения.',
    scopeBoundaries:
      'Правило повторения, исключения в серии, изменение одной записи или всей серии, конфликты.',
    units: { BACKEND: 18, FRONTEND: 10, PM: 2, QA: 5 },
  },
  {
    code: 'BOOK_REMINDERS',
    category: 'booking',
    iconKey: 'Bell',
    title: 'Напоминания о записи',
    summary: 'Автоматические напоминания клиенту и исполнителю.',
    scopeBoundaries:
      'Сроки напоминаний, канал из уже подключённых, подтверждение или отмена по ссылке, отписка.',
    units: { BACKEND: 12, FRONTEND: 4, PM: 2, QA: 3 },
  },
  {
    code: 'BOOK_PREPAYMENT',
    category: 'booking',
    iconKey: 'CreditCard',
    title: 'Предоплата за бронь',
    summary: 'Оплата или депозит при записи.',
    scopeBoundaries:
      'Сумма или процент предоплаты, удержание слота до оплаты, отмена с возвратом по правилам, связь с подключённым шлюзом.',
    units: { BACKEND: 16, FRONTEND: 7, PM: 2, QA: 4 },
  },
  {
    code: 'BOOK_STAFF_WORKLOAD',
    category: 'booking',
    iconKey: 'Gauge',
    title: 'Графики и загрузка сотрудников',
    summary: 'Рабочие часы, выходные и загрузка по сотрудникам.',
    scopeBoundaries:
      'Индивидуальные графики, перерывы и выходные, влияние на свободные слоты, отчёт загрузки.',
    units: { BACKEND: 18, FRONTEND: 10, PM: 3, QA: 4 },
  },
  {
    code: 'BOOK_EXTERNAL_CALENDAR_SYNC',
    category: 'booking',
    iconKey: 'RefreshCw',
    title: 'Синхронизация с внешним календарём',
    summary: 'Двусторонний обмен с Google или Outlook.',
    scopeBoundaries:
      'Один провайдер, направление обмена, разрешение конфликтов, повторная синхронизация без дублей.',
    units: { BACKEND: 22, FRONTEND: 6, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'BOOK_QUEUE_MANAGEMENT',
    category: 'booking',
    iconKey: 'Timer',
    title: 'Электронная очередь',
    summary: 'Живая очередь с номерами и вызовом.',
    scopeBoundaries:
      'Выдача номера, экран вызова, приоритеты, статистика ожидания. Оборудование и терминалы не входят.',
    units: { BACKEND: 20, FRONTEND: 14, PM: 3, DESIGNER: 4, QA: 5 },
  },
] as const;
