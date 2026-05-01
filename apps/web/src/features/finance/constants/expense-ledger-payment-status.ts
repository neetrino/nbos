import type { ExpenseLedgerPaymentStatus } from '@/lib/api/finance';

export function expenseLedgerPaymentStatusPresentation(status: ExpenseLedgerPaymentStatus): {
  label: string;
  variant: 'emerald' | 'amber' | 'gray';
} {
  switch (status) {
    case 'PAID':
      return { label: 'Paid', variant: 'emerald' };
    case 'PARTIAL':
      return { label: 'Partially paid', variant: 'amber' };
    default:
      return { label: 'Unpaid', variant: 'gray' };
  }
}
