import type { SubscriptionReminderLanguage } from '@nbos/database';
import { renderClientServicePaymentReminderMessage } from './client-service-payment-reminder-templates';
import type { SubscriptionPaymentReminderOffsetDays } from './subscription-payment-reminder.constants';
import { renderSubscriptionPaymentReminderMessage } from './subscription-payment-reminder-templates';
import { yerevanCalendarDateKey } from './yerevan-calendar-date';

export const DEFAULT_CLIENT_PAYMENT_REMINDER_LANGUAGE: SubscriptionReminderLanguage = 'HY';

export interface PaymentReminderCopySource {
  dueDate: Date | null;
  coverageStartMonth: string | null;
  subscription: {
    reminderLanguage: SubscriptionReminderLanguage;
    product: { name: string };
  } | null;
  clientServiceRecord: {
    name: string;
    reminderLanguage?: SubscriptionReminderLanguage | null;
  } | null;
}

export interface PaymentReminderCopy {
  kind: 'subscription' | 'client_service';
  language: SubscriptionReminderLanguage;
  displayName: string;
  coverageStartMonth: string | null;
}

export function resolvePaymentReminderCopy(
  invoice: PaymentReminderCopySource,
): PaymentReminderCopy | null {
  const coverageStartMonth = resolveCoverageMonth(invoice);
  if (invoice.subscription) {
    return {
      kind: 'subscription',
      language: invoice.subscription.reminderLanguage,
      displayName: invoice.subscription.product.name,
      coverageStartMonth,
    };
  }
  if (invoice.clientServiceRecord) {
    return {
      kind: 'client_service',
      language:
        invoice.clientServiceRecord.reminderLanguage ?? DEFAULT_CLIENT_PAYMENT_REMINDER_LANGUAGE,
      displayName: invoice.clientServiceRecord.name,
      coverageStartMonth,
    };
  }
  return null;
}

function resolveCoverageMonth(invoice: PaymentReminderCopySource): string | null {
  if (invoice.coverageStartMonth) return invoice.coverageStartMonth;
  if (!invoice.dueDate) return null;
  return yerevanCalendarDateKey(invoice.dueDate).slice(0, 7);
}

export function renderResolvedPaymentReminderMessage(
  copy: PaymentReminderCopy,
  offsetDays: SubscriptionPaymentReminderOffsetDays,
): string {
  if (copy.kind === 'subscription') {
    return renderSubscriptionPaymentReminderMessage({
      offsetDays,
      language: copy.language,
      productName: copy.displayName,
      coverageStartMonth: copy.coverageStartMonth,
    });
  }
  return renderClientServicePaymentReminderMessage({
    offsetDays,
    language: copy.language,
    serviceName: copy.displayName,
    coverageStartMonth: copy.coverageStartMonth,
  });
}
