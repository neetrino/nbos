import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import ruExpenses from '@/messages/ru/expenses.json';
import { buildExpenseIntegratedFilterConfigs } from './build-expense-integrated-filter-configs';
import { localizeExpenseFilterConfigs } from './localize-expense-filters';
import { EXPENSE_BOARD_SCOPE_FILTER_KEY } from './expense-board-scope';
import type { ExpensesTranslator } from './expense-i18n-labels';

describe('localizeExpenseFilterConfigs', () => {
  it('translates filter chrome at render and keeps option VALUES', () => {
    const t = createTranslator({ locale: 'ru', messages: ruExpenses }) as ExpensesTranslator;
    const configs = localizeExpenseFilterConfigs(
      buildExpenseIntegratedFilterConfigs(
        [{ value: 'proj-1', label: 'Acme Site' }],
        [{ value: 'emp-1', label: 'Aram' }],
        { includePayrollFilters: true },
      ),
      t,
    );

    const scope = configs.find((item) => item.key === EXPENSE_BOARD_SCOPE_FILTER_KEY);
    expect(scope?.label).toBe('Область');
    expect(scope?.options.find((item) => item.value === 'active')?.label).toBe('К оплате');

    const category = configs.find((item) => item.key === 'category');
    expect(category?.options.find((item) => item.value === 'SALARY')?.label).toBe('Зарплата');

    const project = configs.find((item) => item.key === 'project');
    expect(project?.options.find((item) => item.value === 'proj-1')?.label).toBe('Acme Site');
  });
});
