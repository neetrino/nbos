import { FINANCE_EXPENSE_PLANS_MODULE } from '@nbos/shared';
import type { CurrentUserPayload } from '../../common/decorators';
import { hasCallerPermission } from '../../common/authorization/caller-permission';

export interface ClientServiceNestedVisibility {
  invoices: boolean;
  expensePlans: boolean;
  expenses: boolean;
  tasks: boolean;
}

export const CLIENT_SERVICE_NESTED_NONE: ClientServiceNestedVisibility = {
  invoices: false,
  expensePlans: false,
  expenses: false,
  tasks: false,
};

export const CLIENT_SERVICE_NESTED_ALL: ClientServiceNestedVisibility = {
  invoices: true,
  expensePlans: true,
  expenses: true,
  tasks: true,
};

const FINANCE_INVOICES_MODULE = 'FINANCE_INVOICES';
const FINANCE_EXPENSES_MODULE = 'FINANCE_EXPENSES';
const TASKS_MODULE = 'TASKS';

export function clientServiceNestedVisibilityFromUser(
  user: CurrentUserPayload,
): ClientServiceNestedVisibility {
  return {
    invoices: hasCallerPermission(user.permissions, FINANCE_INVOICES_MODULE, 'VIEW'),
    expensePlans: hasCallerPermission(user.permissions, FINANCE_EXPENSE_PLANS_MODULE, 'VIEW'),
    expenses: hasCallerPermission(user.permissions, FINANCE_EXPENSES_MODULE, 'VIEW'),
    tasks: hasCallerPermission(user.permissions, TASKS_MODULE, 'VIEW'),
  };
}
