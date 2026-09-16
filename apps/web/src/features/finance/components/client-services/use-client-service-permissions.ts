'use client';

import { FINANCE_CLIENT_SERVICES_MODULE, FINANCE_EXPENSE_PLANS_MODULE } from '@nbos/shared';
import { usePermission } from '@/lib/permissions';

/** Client services registry action visibility derived from the RBAC matrix. */
export function useClientServicePermissions() {
  const { can } = usePermission();

  const canAdd = can('ADD', FINANCE_CLIENT_SERVICES_MODULE);
  const canEdit = can('EDIT', FINANCE_CLIENT_SERVICES_MODULE);
  const canDelete = can('DELETE', FINANCE_CLIENT_SERVICES_MODULE);

  const canCreateInvoice = canEdit && can('ADD', 'FINANCE_INVOICES');
  // Expense creation requires FINANCE_EXPENSES EDIT per the expenses API.
  const canCreateExpense = canEdit && can('EDIT', 'FINANCE_EXPENSES');
  const canCreateExpensePlan = canEdit && can('ADD', FINANCE_EXPENSE_PLANS_MODULE);
  const canCreateTask = canEdit && can('ADD', 'TASKS');

  return {
    canAdd,
    canEdit,
    canDelete,
    canCreateInvoice,
    canCreateExpense,
    canCreateExpensePlan,
    canCreateTask,
  };
}
