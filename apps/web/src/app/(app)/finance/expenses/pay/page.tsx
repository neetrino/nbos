import { redirect } from 'next/navigation';
import { expensesPayrollPresetHref } from '@/features/finance/constants/expense-payroll-filter';

/** Canon alias for Pay Now — lands on payroll-filtered expense board. */
export default function ExpensePayAliasPage() {
  redirect(expensesPayrollPresetHref());
}
