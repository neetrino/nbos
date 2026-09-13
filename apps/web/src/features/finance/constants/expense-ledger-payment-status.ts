import type { ExpenseLedgerPaymentStatus } from '@/lib/api/finance';

export const EXPENSE_LEDGER_PAYMENT_STATUS_MESSAGE_KEY = {
  PAID: 'compensation.paymentStatus.PAID',
  PARTIAL: 'compensation.paymentStatus.PARTIAL',
  UNPAID: 'compensation.paymentStatus.UNPAID',
} as const satisfies Record<ExpenseLedgerPaymentStatus, string>;

export type ExpenseLedgerPaymentStatusPresentation = {
  messageKey: (typeof EXPENSE_LEDGER_PAYMENT_STATUS_MESSAGE_KEY)[ExpenseLedgerPaymentStatus];
  label: string;
  variant: 'emerald' | 'amber' | 'orange';
};

/** English fallback labels; prefer `messageKey` with `useTranslations('payroll')` at render. */
export function expenseLedgerPaymentStatusPresentation(
  status: ExpenseLedgerPaymentStatus,
): ExpenseLedgerPaymentStatusPresentation {
  switch (status) {
    case 'PAID':
      return {
        messageKey: EXPENSE_LEDGER_PAYMENT_STATUS_MESSAGE_KEY.PAID,
        label: 'Paid',
        variant: 'emerald',
      };
    case 'PARTIAL':
      return {
        messageKey: EXPENSE_LEDGER_PAYMENT_STATUS_MESSAGE_KEY.PARTIAL,
        label: 'Partially paid',
        variant: 'amber',
      };
    default:
      return {
        messageKey: EXPENSE_LEDGER_PAYMENT_STATUS_MESSAGE_KEY.UNPAID,
        label: 'Unpaid',
        variant: 'orange',
      };
  }
}
