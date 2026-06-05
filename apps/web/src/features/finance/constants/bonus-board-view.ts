'use client';

import { createPersistedScalarStore } from '@/lib/persisted-client-state';

export type BonusBoardViewMode = 'board' | 'list' | 'employee' | 'product' | 'payroll';

const bonusBoardViewStore = createPersistedScalarStore<BonusBoardViewMode>({
  storageKey: 'nbos:finance:bonus-board-view',
  defaultValue: 'board',
  parse: (raw) => {
    if (raw === 'list' || raw === 'employee' || raw === 'product' || raw === 'payroll') {
      return raw;
    }
    return 'board';
  },
});

export const readBonusBoardViewMode = bonusBoardViewStore.read;
export const writeBonusBoardViewMode = bonusBoardViewStore.write;
export const useBonusBoardViewMode = bonusBoardViewStore.useValue;
