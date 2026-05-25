import { Gift } from 'lucide-react';
import type { EntityItemSummary } from '@/components/shared/entity-item';
import { BONUS_BOARD_TYPE_CONFIG } from '@/features/finance/constants/bonus-board';
import {
  BONUS_ENTRY_STATUS_LABEL,
  BONUS_ENTRY_STATUS_VARIANT,
} from '@/features/finance/constants/bonus-board-status-ui';
import { employeeDisplayName } from '@/features/finance/components/bonus/bonus-board-widgets';
import { formatAmount } from '@/features/finance/constants/finance';
import { parseBonusPoolAmount } from '@/features/finance/utils/bonus-pool-amount';
import type { BonusEntryListRow } from '@/lib/api/bonus';

/** Maps a bonus entry row to the shared entity tab preview model. */
export function bonusEntryToItemSummary(row: BonusEntryListRow): EntityItemSummary {
  const typeCfg = BONUS_BOARD_TYPE_CONFIG[row.type];
  return {
    id: row.id,
    kind: 'bonus_entry',
    title: employeeDisplayName(row.employee),
    subtitle: typeCfg.label,
    status: {
      label: BONUS_ENTRY_STATUS_LABEL[row.status],
      variant: BONUS_ENTRY_STATUS_VARIANT[row.status],
    },
    primaryMetric: formatAmount(parseBonusPoolAmount(row.amount)),
    trailing: row.project?.code ?? row.order.code,
    leadingIcon: Gift,
  };
}
