import type { InvoiceMoneyStatusEnum, InvoiceStatusEnum } from '@nbos/database';

export interface ResolveInvoiceMoneyStatusArgs {
  legacyStatus: InvoiceStatusEnum;
  amount: number;
  paid: number;
  dueDate: Date | null;
  now: Date;
}

/**
 * Canonical Invoice Card **money** status derived from coverage, due date, and legacy pipeline status.
 * Legacy `InvoiceStatusEnum` remains until all consumers migrate.
 */
export function resolveInvoiceMoneyStatus(
  args: ResolveInvoiceMoneyStatusArgs,
): InvoiceMoneyStatusEnum {
  const { legacyStatus, amount, paid, dueDate, now } = args;

  if (paid >= amount) {
    return 'PAID';
  }

  if (legacyStatus === 'ON_HOLD') {
    return 'ON_HOLD';
  }

  const overdueByDueDate = dueDate != null && dueDate.getTime() < now.getTime() && paid < amount;

  if (overdueByDueDate || legacyStatus === 'DELAYED') {
    return 'OVERDUE';
  }

  if (legacyStatus === 'FAIL' || legacyStatus === 'WAITING') {
    return 'AWAITING_PAYMENT';
  }

  if (legacyStatus === 'THIS_MONTH' || legacyStatus === 'CREATE_INVOICE') {
    return 'NEW';
  }

  if (legacyStatus === 'PAID') {
    return 'AWAITING_PAYMENT';
  }

  return 'NEW';
}
