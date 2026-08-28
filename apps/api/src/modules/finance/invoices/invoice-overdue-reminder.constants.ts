export const OVERDUE_REMINDER_WAVES = [1, 2] as const;

export type OverdueReminderWave = (typeof OVERDUE_REMINDER_WAVES)[number];

export const OVERDUE_REMINDER_MAX_WAVE = 2;

/** Minimum Yerevan calendar days between wave 1 and wave 2 on the same invoice. */
export const OVERDUE_REMINDER_MIN_DAYS_BETWEEN_WAVES = 1;

export const OVERDUE_REMINDER_EVENT_TYPES = {
  W1: 'finance.invoice.overdue_reminder_w1',
  W2: 'finance.invoice.overdue_reminder_w2',
} as const;

export type OverdueReminderSkipReason =
  | 'not_overdue'
  | 'notifications_off'
  | 'tax_gate'
  | 'no_whatsapp'
  | 'same_day'
  | 'max_wave'
  | 'no_product_link'
  | 'already_sent';

export function overdueReminderEventTypeForWave(wave: OverdueReminderWave): string {
  return wave === 1 ? OVERDUE_REMINDER_EVENT_TYPES.W1 : OVERDUE_REMINDER_EVENT_TYPES.W2;
}

export function buildOverdueReminderDedupeKey(invoiceId: string, wave: OverdueReminderWave): string {
  return `invoice_overdue_reminder:w${wave}:${invoiceId}`;
}

export function buildOverdueReminderIdempotencyKey(
  invoiceId: string,
  wave: OverdueReminderWave,
): string {
  return `invoice-overdue-reminder:w${wave}:${invoiceId}`;
}

export function parseOverdueReminderDedupeKey(
  dedupeKey: string,
): { invoiceId: string; wave: OverdueReminderWave } | null {
  for (const wave of OVERDUE_REMINDER_WAVES) {
    const prefix = `invoice_overdue_reminder:w${wave}:`;
    if (dedupeKey.startsWith(prefix)) {
      return { invoiceId: dedupeKey.slice(prefix.length), wave };
    }
  }
  return null;
}
