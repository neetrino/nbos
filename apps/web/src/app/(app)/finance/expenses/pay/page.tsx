import { redirect } from 'next/navigation';
import { EXPENSE_LIST_PATH } from '@/features/finance/constants/project-expenses-drilldown';

/** Canon alias for the active expense board (Pay now). */
export default function ExpensePayAliasPage() {
  redirect(EXPENSE_LIST_PATH);
}
