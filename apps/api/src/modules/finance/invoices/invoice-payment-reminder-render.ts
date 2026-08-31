import { resolveInvoiceDisplayTitle } from '@nbos/shared';
import {
  formatCoverageMonthLabel,
  formatDueDateLabel,
  renderClientPaymentReminderMessage,
  type RenderClientPaymentReminderInput,
} from './client-payment-reminder-templates';

export interface ResolvedPaymentReminderRenderInput {
  language: RenderClientPaymentReminderInput['language'];
  renderInput: RenderClientPaymentReminderInput;
  productName: string;
}

interface PaymentReminderSubscription {
  notificationsEnabled: boolean;
  reminderLanguage: RenderClientPaymentReminderInput['language'];
  name: string;
  code: string;
  product: { name: string };
}

interface PaymentReminderClientService {
  notificationsEnabled: boolean;
  reminderLanguage: RenderClientPaymentReminderInput['language'];
  name: string;
  product: { name: string } | null;
}

export function resolvePaymentReminderRenderInput(input: {
  code: string;
  amount: unknown;
  taxStatus: string;
  coverageStartMonth: string | null;
  dueDate: Date;
  offsetDays?: RenderClientPaymentReminderInput['offsetDays'];
  subscription: PaymentReminderSubscription | null;
  clientServiceRecord: PaymentReminderClientService | null;
}): ResolvedPaymentReminderRenderInput | null {
  if (input.subscription != null) {
    const serviceLabel = resolveInvoiceDisplayTitle({
      code: input.code,
      subscription: input.subscription,
    });
    return {
      language: input.subscription.reminderLanguage,
      productName: serviceLabel,
      renderInput: {
        offsetDays: input.offsetDays,
        language: input.subscription.reminderLanguage,
        source: 'subscription',
        serviceLabel,
        periodLabel: formatCoverageMonthLabel(
          input.coverageStartMonth,
          input.subscription.reminderLanguage,
        ),
        invoiceCode: input.code,
        amount: input.amount,
        taxStatus: input.taxStatus as RenderClientPaymentReminderInput['taxStatus'],
      },
    };
  }

  if (input.clientServiceRecord != null) {
    const language = input.clientServiceRecord.reminderLanguage;
    const serviceLabel =
      input.clientServiceRecord.name.trim() ||
      input.clientServiceRecord.product?.name.trim() ||
      input.code;
    return {
      language,
      productName: serviceLabel,
      renderInput: {
        offsetDays: input.offsetDays,
        language,
        source: 'client_service',
        serviceLabel,
        periodLabel: formatDueDateLabel(input.dueDate, language),
        invoiceCode: input.code,
        amount: input.amount,
        taxStatus: input.taxStatus as RenderClientPaymentReminderInput['taxStatus'],
      },
    };
  }

  return null;
}

export function renderPaymentReminderMessage(resolved: ResolvedPaymentReminderRenderInput): string {
  return renderClientPaymentReminderMessage(resolved.renderInput);
}
