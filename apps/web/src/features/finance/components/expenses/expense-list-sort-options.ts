import type { ExpenseListSortField } from '@/lib/api/finance';

export const EXPENSE_LIST_SORT_OPTIONS: Array<{ value: ExpenseListSortField; label: string }> = [
  { value: 'createdAt', label: 'Created' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'amount', label: 'Amount' },
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
];
