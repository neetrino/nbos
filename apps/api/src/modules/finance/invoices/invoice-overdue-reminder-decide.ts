import {
  addCalendarDaysToKey,
  yerevanCalendarDateKey,
} from './yerevan-calendar-date';
import {
  OVERDUE_REMINDER_MIN_DAYS_BETWEEN_WAVES,
  type OverdueReminderSkipReason,
  type OverdueReminderWave,
} from './invoice-overdue-reminder.constants';

export interface OverdueReminderDecideInput {
  moneyStatus: string;
  hasProductLink: boolean;
  notificationsEnabled: boolean;
  taxBlocked: boolean;
  hasWhatsAppGroup: boolean;
  wave1ScheduledFor: Date | null;
  hasWave2: boolean;
  asOfKey: string;
}

export type OverdueReminderDecision =
  | { kind: 'send'; wave: OverdueReminderWave }
  | { kind: 'skip'; reason: OverdueReminderSkipReason };

export function decideOverdueReminderAction(
  input: OverdueReminderDecideInput,
): OverdueReminderDecision {
  if (input.moneyStatus !== 'OVERDUE') return { kind: 'skip', reason: 'not_overdue' };
  if (!input.hasProductLink) return { kind: 'skip', reason: 'no_product_link' };
  if (!input.notificationsEnabled) return { kind: 'skip', reason: 'notifications_off' };
  if (input.taxBlocked) return { kind: 'skip', reason: 'tax_gate' };
  if (!input.hasWhatsAppGroup) return { kind: 'skip', reason: 'no_whatsapp' };
  if (input.hasWave2) return { kind: 'skip', reason: 'max_wave' };
  if (input.wave1ScheduledFor == null) return { kind: 'send', wave: 1 };
  if (!hasYerevanDayGap(input.wave1ScheduledFor, input.asOfKey)) {
    return { kind: 'skip', reason: 'same_day' };
  }
  return { kind: 'send', wave: 2 };
}

export function hasYerevanDayGap(from: Date, asOfKey: string): boolean {
  const fromKey = yerevanCalendarDateKey(from);
  return asOfKey >= addCalendarDaysToKey(fromKey, OVERDUE_REMINDER_MIN_DAYS_BETWEEN_WAVES);
}
