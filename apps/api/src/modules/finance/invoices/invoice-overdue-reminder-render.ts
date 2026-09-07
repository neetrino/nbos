import { resolveInvoiceDisplayTitle } from '@nbos/shared';
import {
  formatCoveragePeriodLabel,
  formatDueDateLabel,
  type ClientPaymentReminderSource,
} from './client-payment-reminder-templates';
import type { RenderOverdueReminderInput } from './invoice-overdue-reminder-templates';
import type { OverdueReminderWave } from './invoice-overdue-reminder.constants';

export interface ResolvedOverdueReminderRender {
  language: RenderOverdueReminderInput['language'];
  productName: string;
  renderInput: RenderOverdueReminderInput;
}

interface OverdueReminderSubscription {
  notificationsEnabled: boolean;
  reminderLanguage: RenderOverdueReminderInput['language'];
  name: string;
  code: string;
  product: { name: string };
}

interface OverdueReminderClientService {
  notificationsEnabled: boolean;
  reminderLanguage: RenderOverdueReminderInput['language'];
  name: string;
  product: { name: string } | null;
}

export function resolveOverdueReminderRenderInput(input: {
  code: string;
  amount: unknown;
  taxStatus: string;
  coverageStartMonth: string | null;
  coverageMonthCount?: number | null;
  dueDate: Date | null;
  wave: OverdueReminderWave;
  subscription: OverdueReminderSubscription | null;
  clientServiceRecord: OverdueReminderClientService | null;
}): ResolvedOverdueReminderRender | null {
  if (input.subscription != null) {
    const serviceLabel = resolveInvoiceDisplayTitle({
      code: input.code,
      subscription: input.subscription,
    });
    return buildResolved(input, 'subscription', input.subscription.reminderLanguage, {
      serviceLabel,
      periodLabel: formatCoveragePeriodLabel(
        input.coverageStartMonth,
        input.coverageMonthCount,
        input.subscription.reminderLanguage,
      ),
      coverageMonthCount: input.coverageMonthCount ?? 1,
    });
  }
  if (input.clientServiceRecord != null && input.dueDate != null) {
    const language = input.clientServiceRecord.reminderLanguage;
    const serviceLabel =
      input.clientServiceRecord.name.trim() ||
      input.clientServiceRecord.product?.name.trim() ||
      input.code;
    return buildResolved(input, 'client_service', language, {
      serviceLabel,
      periodLabel: formatDueDateLabel(input.dueDate, language),
    });
  }
  return null;
}

function buildResolved(
  input: {
    code: string;
    amount: unknown;
    taxStatus: string;
    wave: OverdueReminderWave;
  },
  source: ClientPaymentReminderSource,
  language: RenderOverdueReminderInput['language'],
  labels: { serviceLabel: string; periodLabel: string; coverageMonthCount?: number },
): ResolvedOverdueReminderRender {
  return {
    language,
    productName: labels.serviceLabel,
    renderInput: {
      wave: input.wave,
      language,
      source,
      serviceLabel: labels.serviceLabel,
      periodLabel: labels.periodLabel,
      invoiceCode: input.code,
      amount: input.amount,
      taxStatus: input.taxStatus as RenderOverdueReminderInput['taxStatus'],
      coverageMonthCount: labels.coverageMonthCount,
    },
  };
}
