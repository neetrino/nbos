'use client';

import { createPersistedScalarStore } from '@/lib/persisted-client-state';

export type PayrollRunsListViewMode = 'list' | 'board' | 'calendar';

const payrollRunsListViewStore = createPersistedScalarStore<PayrollRunsListViewMode>({
  storageKey: 'nbos:finance:payroll-runs-list-view',
  defaultValue: 'list',
  parse: (raw) => {
    if (raw === 'calendar' || raw === 'board') {
      return raw;
    }
    return 'list';
  },
});

export const readPayrollRunsListViewMode = payrollRunsListViewStore.read;
export const writePayrollRunsListViewMode = payrollRunsListViewStore.write;
export const usePayrollRunsListViewMode = payrollRunsListViewStore.useValue;
