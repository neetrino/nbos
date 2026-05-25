import type { BonusProductPoolRow } from '@/lib/api/bonus';
import { normalizeBonusPoolLedgerStatus } from '@/features/finance/constants/bonus-pool-status-ui';

export interface BonusPoolsClientFilters {
  search: string;
  projectId: string;
  poolKind: string;
  ledgerStatus: string;
}

export function filterBonusPoolsRows(
  rows: BonusProductPoolRow[],
  filters: BonusPoolsClientFilters,
): BonusProductPoolRow[] {
  const search = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.projectId !== 'all' && row.projectId !== filters.projectId) {
      return false;
    }
    if (filters.poolKind !== 'all' && row.poolKind !== filters.poolKind) {
      return false;
    }
    if (filters.ledgerStatus !== 'all') {
      const status = normalizeBonusPoolLedgerStatus(row.ledgerPoolStatus);
      if (status !== filters.ledgerStatus) {
        return false;
      }
    }
    if (!search) return true;
    const haystack = [
      row.poolName,
      row.poolKey,
      row.projectCode,
      row.projectName,
      row.orderCode,
      row.poolKind,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(search);
  });
}

export function uniqueBonusPoolProjects(rows: BonusProductPoolRow[]) {
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.projectId, `${row.projectCode} · ${row.projectName}`);
  }
  return [...map.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
