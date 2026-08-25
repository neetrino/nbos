import type { SubscriptionReminderLanguage, TaxStatus } from '@nbos/database';
import {
  formatCoverageMonthLabel,
  renderClientPaymentReminderMessage,
} from './client-payment-reminder-templates';
import type { SubscriptionPaymentReminderOffsetDays } from './subscription-payment-reminder.constants';

export { formatCoverageMonthLabel };

export interface RenderSubscriptionPaymentReminderInput {
  offsetDays: SubscriptionPaymentReminderOffsetDays;
  language: SubscriptionReminderLanguage;
  productName: string;
  /** YYYY-MM coverage month from Invoice.coverageStartMonth */
  coverageStartMonth: string | null;
  amount: unknown;
  taxStatus: TaxStatus;
}

export function renderSubscriptionPaymentReminderMessage(
  input: RenderSubscriptionPaymentReminderInput,
): string {
  return renderClientPaymentReminderMessage({
    offsetDays: input.offsetDays,
    language: input.language,
    source: 'subscription',
    serviceLabel: input.productName,
    periodLabel: formatCoverageMonthLabel(input.coverageStartMonth, input.language),
    amount: input.amount,
    taxStatus: input.taxStatus,
  });
}
