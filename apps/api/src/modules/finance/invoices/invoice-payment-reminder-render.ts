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
  product: { name: string };
}

interface PaymentReminderClientService {
  notificationsEnabled: boolean;
  reminderLanguage: RenderClientPaymentReminderInput['language'];
  name: string;
  product: { name: string } | null;
}

export function resolvePaymentReminderRenderInput(input: {
  amount: unknown;
  taxStatus: string;
  coverageStartMonth: string | null;
  dueDate: Date;
  offsetDays: RenderClientPaymentReminderInput['offsetDays'];
  subscription: PaymentReminderSubscription | null;
  clientServiceRecord: PaymentReminderClientService | null;
}): ResolvedPaymentReminderRenderInput | null {
  if (input.subscription != null) {
    return {
      language: input.subscription.reminderLanguage,
      productName: input.subscription.product.name,
      renderInput: {
        offsetDays: input.offsetDays,
        language: input.subscription.reminderLanguage,
        source: 'subscription',
        serviceLabel: input.subscription.product.name,
        periodLabel: formatCoverageMonthLabel(
          input.coverageStartMonth,
          input.subscription.reminderLanguage,
        ),
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
      'Client service';
    return {
      language,
      productName: serviceLabel,
      renderInput: {
        offsetDays: input.offsetDays,
        language,
        source: 'client_service',
        serviceLabel,
        periodLabel: formatDueDateLabel(input.dueDate, language),
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
