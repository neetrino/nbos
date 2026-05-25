import type { FilterConfig } from '@/components/shared/FilterBar';
import type { BonusPoolLedgerStatus } from '@/features/finance/constants/bonus-pool-status-ui';
import { bonusPoolStatusUi } from '@/features/finance/constants/bonus-pool-status-ui';

export const BONUS_POOLS_FILTER_PROJECT_KEY = 'bonusPoolsProject';
export const BONUS_POOLS_FILTER_KIND_KEY = 'bonusPoolsKind';
export const BONUS_POOLS_FILTER_STATUS_KEY = 'bonusPoolsStatus';

const POOL_KIND_OPTIONS = [
  { value: 'PRODUCT', label: 'Product' },
  { value: 'EXTENSION', label: 'Extension' },
  { value: 'ORDER', label: 'Order' },
] as const;

const LEDGER_STATUS_OPTIONS: BonusPoolLedgerStatus[] = [
  'DRAFT',
  'ACTIVE',
  'PARTIALLY_RELEASED',
  'CLOSED',
  'UNKNOWN',
];

export function buildBonusPoolsFilterConfigs(
  projectOptions: { id: string; label: string }[],
): FilterConfig[] {
  return [
    {
      key: BONUS_POOLS_FILTER_PROJECT_KEY,
      label: 'Project',
      options: projectOptions.map((p) => ({ value: p.id, label: p.label })),
    },
    {
      key: BONUS_POOLS_FILTER_KIND_KEY,
      label: 'Kind',
      options: [...POOL_KIND_OPTIONS],
    },
    {
      key: BONUS_POOLS_FILTER_STATUS_KEY,
      label: 'Ledger status',
      options: LEDGER_STATUS_OPTIONS.map((status) => ({
        value: status,
        label: bonusPoolStatusUi(status === 'UNKNOWN' ? null : status).label,
      })),
    },
  ];
}
