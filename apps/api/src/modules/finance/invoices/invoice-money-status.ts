import type { InvoiceMoneyStatusEnum, InvoiceStatusEnum } from '@nbos/database';

/** Manual kanban / API: money column maps to a legacy pipeline status kept in sync for orders/deals. */
export const MONEY_STATUS_TO_LEGACY_COMPANION: Record<InvoiceMoneyStatusEnum, InvoiceStatusEnum> = {
  NEW: 'THIS_MONTH',
  AWAITING_PAYMENT: 'WAITING',
  OVERDUE: 'DELAYED',
  ON_HOLD: 'ON_HOLD',
  PAID: 'PAID',
  CANCELLED: 'FAIL',
};

const MONEY_STATUS_VALUES = Object.keys(
  MONEY_STATUS_TO_LEGACY_COMPANION,
) as InvoiceMoneyStatusEnum[];

export function parseInvoiceMoneyStatus(value: string): InvoiceMoneyStatusEnum | null {
  const trimmed = value.trim();
  return MONEY_STATUS_VALUES.includes(trimmed as InvoiceMoneyStatusEnum)
    ? (trimmed as InvoiceMoneyStatusEnum)
    : null;
}

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

  /** Legacy `FAIL` is the companion for money `CANCELLED` (terminal, not collectible). */
  if (legacyStatus === 'FAIL') {
    return 'CANCELLED';
  }

  const overdueByDueDate = dueDate != null && dueDate.getTime() < now.getTime() && paid < amount;

  if (overdueByDueDate || legacyStatus === 'DELAYED') {
    return 'OVERDUE';
  }

  if (legacyStatus === 'WAITING') {
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
