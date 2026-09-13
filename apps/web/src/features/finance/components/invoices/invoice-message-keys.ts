import {
  INVOICE_MONEY_STAGES,
  INVOICE_PAYMENT_METHOD_OPTIONS,
  INVOICE_TAX_STATUS_OPTIONS,
  INVOICE_TYPES,
} from '@/features/finance/constants/finance';
import type { InvoiceSourceLabelInput } from '@/features/finance/utils/invoice-source-label';
import type { OverdueReminderSkipReason } from '@/lib/api/finance';

export const INVOICE_STAGE_MESSAGE_KEYS = {
  NEW: 'stage.NEW',
  AWAITING_PAYMENT: 'stage.AWAITING_PAYMENT',
  OVERDUE: 'stage.OVERDUE',
  ON_HOLD: 'stage.ON_HOLD',
  PAID: 'stage.PAID',
  CANCELLED: 'stage.CANCELLED',
} as const;

export const INVOICE_STAGE_SHORT_MESSAGE_KEYS = {
  NEW: 'stageShort.NEW',
  AWAITING_PAYMENT: 'stageShort.AWAITING_PAYMENT',
  OVERDUE: 'stageShort.OVERDUE',
  ON_HOLD: 'stageShort.ON_HOLD',
  PAID: 'stageShort.PAID',
  CANCELLED: 'stageShort.CANCELLED',
} as const;

export const INVOICE_TYPE_MESSAGE_KEYS = {
  DEVELOPMENT: 'type.DEVELOPMENT',
  EXTENSION: 'type.EXTENSION',
  SUBSCRIPTION: 'type.SUBSCRIPTION',
  DOMAIN: 'type.DOMAIN',
  SERVICE: 'type.SERVICE',
  MANUAL: 'type.MANUAL',
} as const;

export const INVOICE_TAX_MESSAGE_KEYS = {
  TAX: 'tax.TAX',
  TAX_FREE: 'tax.TAX_FREE',
} as const;

export const INVOICE_PAYMENT_METHOD_MESSAGE_KEYS = {
  TRANSACTION: 'paymentMethod.TRANSACTION',
  CASH: 'paymentMethod.CASH',
} as const;

export type InvoicePaymentMethodMessageKey =
  (typeof INVOICE_PAYMENT_METHOD_MESSAGE_KEYS)[keyof typeof INVOICE_PAYMENT_METHOD_MESSAGE_KEYS];

export const INVOICE_OFFICIAL_STATUS_MESSAGE_KEYS = {
  sent: 'official.status.sent',
  sending: 'official.status.sending',
  cancelled: 'official.status.cancelled',
  notSent: 'official.status.notSent',
} as const;

export type InvoiceOfficialStatusMessageKey =
  (typeof INVOICE_OFFICIAL_STATUS_MESSAGE_KEYS)[keyof typeof INVOICE_OFFICIAL_STATUS_MESSAGE_KEYS];

export function invoiceTaxMessageKey(taxStatus: string): 'tax.TAX' | 'tax.TAX_FREE' | null {
  if (taxStatus === 'TAX' || taxStatus === 'TAX_FREE') {
    return INVOICE_TAX_MESSAGE_KEYS[taxStatus];
  }
  return null;
}

export function invoicePaymentMethodMessageKey(
  value: string,
): InvoicePaymentMethodMessageKey | null {
  if (value === 'TRANSACTION' || value === 'CASH') {
    return INVOICE_PAYMENT_METHOD_MESSAGE_KEYS[value];
  }
  return null;
}

export function officialInvoiceRequestStatusKey(
  invoice: { officialInvoiceRequestSent: boolean; officialInvoiceCancelledAt: string | null },
  awaitingSend: boolean,
): { key: InvoiceOfficialStatusMessageKey; variant: 'green' | 'amber' | 'gray' } {
  if (invoice.officialInvoiceRequestSent) {
    return { key: INVOICE_OFFICIAL_STATUS_MESSAGE_KEYS.sent, variant: 'green' };
  }
  if (awaitingSend) {
    return { key: INVOICE_OFFICIAL_STATUS_MESSAGE_KEYS.sending, variant: 'amber' };
  }
  if (invoice.officialInvoiceCancelledAt) {
    return { key: INVOICE_OFFICIAL_STATUS_MESSAGE_KEYS.cancelled, variant: 'amber' };
  }
  return { key: INVOICE_OFFICIAL_STATUS_MESSAGE_KEYS.notSent, variant: 'gray' };
}

export const INVOICE_REMINDER_SKIP_MESSAGE_KEYS = {
  not_overdue: 'reminders.skip.not_overdue',
  notifications_off: 'reminders.skip.notifications_off',
  tax_gate: 'reminders.skip.tax_gate',
  no_whatsapp: 'reminders.skip.no_whatsapp',
  same_day: 'reminders.skip.same_day',
  too_soon: 'reminders.skip.too_soon',
  max_wave: 'reminders.skip.max_wave',
  no_product_link: 'reminders.skip.no_product_link',
  already_sent: 'reminders.skip.already_sent',
} as const satisfies Record<
  OverdueReminderSkipReason,
  `reminders.skip.${OverdueReminderSkipReason}`
>;

export type InvoiceStageMessageKey =
  (typeof INVOICE_STAGE_MESSAGE_KEYS)[keyof typeof INVOICE_STAGE_MESSAGE_KEYS];
export type InvoiceTypeMessageKey =
  (typeof INVOICE_TYPE_MESSAGE_KEYS)[keyof typeof INVOICE_TYPE_MESSAGE_KEYS];
export type InvoiceSourceMessageKey =
  | 'source.deal'
  | 'source.order'
  | 'source.subscription'
  | 'source.manual';

export function invoiceSourceMessageKey(
  invoice: InvoiceSourceLabelInput,
): InvoiceSourceMessageKey | null {
  if (invoice.order?.deal?.id) return 'source.deal';
  if (invoice.orderId || invoice.order) return 'source.order';
  if (invoice.subscriptionId) return 'source.subscription';
  if (invoice.clientServiceRecordId || invoice.clientServiceRecord) return null;
  return 'source.manual';
}

export const INVOICE_CATALOG_VALUE_SETS = {
  stages: INVOICE_MONEY_STAGES.map((stage) => stage.value),
  types: INVOICE_TYPES.map((type) => type.value),
  tax: INVOICE_TAX_STATUS_OPTIONS.map((option) => option.value),
  paymentMethods: INVOICE_PAYMENT_METHOD_OPTIONS.map((option) => option.value),
} as const;
