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
    title: 'Resource booking',
    summary: 'Booking time with a specialist or resource.',
    scopeBoundaries:
      'Resources and schedules, available slots, booking creation and cancellation, and double-booking prevention.',
    units: { BACKEND: 24, FRONTEND: 14, PM: 3, DESIGNER: 4, QA: 6 },
  },
  {
    code: 'BOOK_CALENDAR_VIEW',
    category: 'booking',
    iconKey: 'Calendar',
    title: 'Availability calendar',
    summary: 'Booking calendar by day, week, and resource.',
    scopeBoundaries:
      'Day and week views, side-by-side resources, drag-and-drop rescheduling, filters, and mobile view.',
    units: { BACKEND: 12, FRONTEND: 20, PM: 3, DESIGNER: 5, QA: 5 },
  },
  {
    code: 'BOOK_RECURRING',
    category: 'booking',
    iconKey: 'Repeat',
    title: 'Recurring bookings',
    summary: 'Booking series with recurrence rules.',
    scopeBoundaries:
      'Recurrence rule, series exceptions, changes to one booking or the whole series, and conflicts.',
    units: { BACKEND: 18, FRONTEND: 10, PM: 2, QA: 5 },
  },
  {
    code: 'BOOK_REMINDERS',
    category: 'booking',
    iconKey: 'Bell',
    title: 'Booking reminders',
    summary: 'Automatic reminders for customers and assignees.',
    scopeBoundaries:
      'Reminder timing, an already connected channel, link-based confirmation or cancellation, and opt-out.',
    units: { BACKEND: 12, FRONTEND: 4, PM: 2, QA: 3 },
  },
  {
    code: 'BOOK_PREPAYMENT',
    category: 'booking',
    iconKey: 'CreditCard',
    title: 'Booking prepayment',
    summary: 'Payment or deposit during booking.',
    scopeBoundaries:
      'Fixed or percentage prepayment, slot hold until payment, policy-based cancellation and refund, and connected gateway linkage.',
    units: { BACKEND: 16, FRONTEND: 7, PM: 2, QA: 4 },
  },
  {
    code: 'BOOK_STAFF_WORKLOAD',
    category: 'booking',
    iconKey: 'Gauge',
    title: 'Staff schedules and workload',
    summary: 'Working hours, days off, and workload by employee.',
    scopeBoundaries:
      'Individual schedules, breaks and days off, effect on available slots, and workload reporting.',
    units: { BACKEND: 18, FRONTEND: 10, PM: 3, QA: 4 },
  },
  {
    code: 'BOOK_EXTERNAL_CALENDAR_SYNC',
    category: 'booking',
    iconKey: 'RefreshCw',
    title: 'External calendar synchronization',
    summary: 'Two-way synchronization with Google or Outlook.',
    scopeBoundaries:
      'One provider, synchronization direction, conflict resolution, and duplicate-free resynchronization.',
    units: { BACKEND: 22, FRONTEND: 6, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'BOOK_QUEUE_MANAGEMENT',
    category: 'booking',
    iconKey: 'Timer',
    title: 'Virtual queue',
    summary: 'A live numbered queue with customer calling.',
    scopeBoundaries:
      'Number issuance, call display, priorities, and wait-time statistics. Hardware and terminals are excluded.',
    units: { BACKEND: 20, FRONTEND: 14, PM: 3, DESIGNER: 4, QA: 5 },
  },
] as const;
