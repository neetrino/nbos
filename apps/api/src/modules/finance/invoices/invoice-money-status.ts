import type { InvoiceMoneyStatusEnum } from '@nbos/database';

const INVOICE_MONEY_STATUS_VALUES: readonly InvoiceMoneyStatusEnum[] = [
  'NEW',
  'AWAITING_PAYMENT',
  'OVERDUE',
  'ON_HOLD',
  'PAID',
  'CANCELLED',
];

export function parseInvoiceMoneyStatus(value: string): InvoiceMoneyStatusEnum | null {
  const trimmed = value.trim();
  return (INVOICE_MONEY_STATUS_VALUES as readonly string[]).includes(trimmed)
    ? (trimmed as InvoiceMoneyStatusEnum)
    : null;
}

export interface DeriveBaseInvoiceMoneyStatusArgs {
  amount: number;
  paid: number;
  dueDate: Date | null;
  now: Date;
}

/**
 * Money status from payments and due date only (no manual ON_HOLD / CANCELLED).
 * Used for validation against user-requested PATCH values.
 */
export function deriveBaseInvoiceMoneyStatus(
  args: DeriveBaseInvoiceMoneyStatusArgs,
): InvoiceMoneyStatusEnum {
  const { amount, paid, dueDate, now } = args;
  if (paid >= amount) {
    return 'PAID';
  }
  if (dueDate != null && dueDate.getTime() < now.getTime()) {
    return 'OVERDUE';
  }
  if (paid > 0) {
    return 'AWAITING_PAYMENT';
  }
  return 'NEW';
}

export interface SyncInvoiceMoneyStatusFromPaymentsArgs extends DeriveBaseInvoiceMoneyStatusArgs {
  currentMoneyStatus: InvoiceMoneyStatusEnum;
}

/**
 * Recomputes stored money status after payments change. Preserves manual ON_HOLD and
 * terminal CANCELLED until fully paid.
 */
export function syncInvoiceMoneyStatusFromPayments(
  args: SyncInvoiceMoneyStatusFromPaymentsArgs,
): InvoiceMoneyStatusEnum {
  const { currentMoneyStatus, amount, paid, dueDate, now } = args;
  if (paid >= amount) {
    return 'PAID';
  }
  if (currentMoneyStatus === 'ON_HOLD') {
    return 'ON_HOLD';
  }
  if (currentMoneyStatus === 'CANCELLED') {
    return 'CANCELLED';
  }
  return deriveBaseInvoiceMoneyStatus({ amount, paid, dueDate, now });
}
