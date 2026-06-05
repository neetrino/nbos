'use client';

import { createPersistedScalarStore } from '@/lib/persisted-client-state';

export type SalaryBoardViewMode = 'calendar' | 'list' | 'board';

const salaryBoardViewStore = createPersistedScalarStore<SalaryBoardViewMode>({
  storageKey: 'nbos:finance:salary-board-view',
  defaultValue: 'calendar',
  parse: (raw) => {
    if (raw === 'list' || raw === 'board' || raw === 'calendar') {
      return raw;
    }
    if (raw === 'grid') {
      return 'calendar';
    }
    return 'calendar';
  },
});

export const readSalaryBoardViewMode = salaryBoardViewStore.read;
export const writeSalaryBoardViewMode = salaryBoardViewStore.write;
export const useSalaryBoardViewMode = salaryBoardViewStore.useValue;
