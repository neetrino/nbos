import { describe, expect, it } from 'vitest';
import { FINANCE_CLIENT_SERVICES_VIEW, FINANCE_EXPENSE_PLANS_VIEW } from '@nbos/shared';
import {
  financeClientServiceAccessFromUser,
  financeExpenseAccessFromUser,
  financeExpensePlanAccessFromUser,
} from './finance-module-access';
import { financePermissionUser } from './finance-permission-test-support';

describe('finance module access helpers', () => {
  it('reads FINANCE_EXPENSE_PLANS VIEW, not FINANCE_EXPENSES', () => {
    const user = financePermissionUser({
      [FINANCE_EXPENSE_PLANS_VIEW]: 'OWN',
      FINANCE_EXPENSES_VIEW: 'ALL',
    });

    expect(financeExpensePlanAccessFromUser(user).viewScope).toBe('OWN');
    expect(financeExpenseAccessFromUser(user).viewScope).toBe('ALL');
  });

  it('reads FINANCE_CLIENT_SERVICES VIEW independently of invoices', () => {
    const user = financePermissionUser({
      [FINANCE_CLIENT_SERVICES_VIEW]: 'DEPARTMENT',
      FINANCE_INVOICES_VIEW: 'ALL',
    });

    expect(financeClientServiceAccessFromUser(user).viewScope).toBe('DEPARTMENT');
  });

  it('does not inherit ALL from a sibling finance module', () => {
    const user = financePermissionUser({
      FINANCE_EXPENSES_VIEW: 'ALL',
      FINANCE_INVOICES_VIEW: 'ALL',
    });

    expect(financeExpensePlanAccessFromUser(user).viewScope).toBeUndefined();
    expect(financeClientServiceAccessFromUser(user).viewScope).toBeUndefined();
  });
});
