import type { BonusStatus } from '@/lib/api/bonus';
import {
  getBoardStageKeys,
  type BoardLifecycleScope,
  type BoardStageDefinition,
} from '@/features/shared/board-lifecycle';

/** Simplified Bonus Board kanban columns (canon: Finance § Bonus Board). */
export type BonusBoardKanbanColumnKey = 'INCOMING' | 'IN_PROGRESS' | 'ACTIVE' | 'PAID' | 'CLAWBACK';

export interface BonusBoardKanbanColumnDef extends BoardStageDefinition {
  key: BonusBoardKanbanColumnKey;
  label: string;
  color: string;
  statuses: readonly BonusStatus[];
}

export const BONUS_BOARD_KANBAN_COLUMNS: readonly BonusBoardKanbanColumnDef[] = [
  {
    key: 'INCOMING',
    label: 'Incoming',
    color: 'bg-blue-500',
    statuses: ['INCOMING'],
  },
  {
    key: 'IN_PROGRESS',
    label: 'In Progress',
    color: 'bg-orange-500',
    statuses: ['EARNED', 'PENDING_ELIGIBILITY', 'VESTED'],
  },
  {
    key: 'ACTIVE',
    label: 'Active',
    color: 'bg-green-500',
    statuses: ['ACTIVE'],
  },
  {
    key: 'PAID',
    label: 'Paid',
    color: 'bg-emerald-500',
    terminal: true,
    statuses: ['PAID'],
  },
  {
    key: 'CLAWBACK',
    label: 'Clawback',
    color: 'bg-red-500',
    terminal: true,
    statuses: ['CLAWBACK'],
  },
];

export const BONUS_BOARD_LIFECYCLE_STAGES: BoardStageDefinition[] = BONUS_BOARD_KANBAN_COLUMNS.map(
  ({ key, terminal }) => ({ key, terminal }),
);

export function resolveBonusBoardKanbanColumn(
  status: BonusStatus,
): BonusBoardKanbanColumnDef | undefined {
  return BONUS_BOARD_KANBAN_COLUMNS.find((column) => column.statuses.includes(status));
}

export function matchesBonusBoardLifecycleScope(
  status: BonusStatus,
  scope: BoardLifecycleScope,
): boolean {
  if (scope === 'ALL') return true;
  const column = resolveBonusBoardKanbanColumn(status);
  if (!column) return false;
  if (scope === 'ACTIVE') return !column.terminal;
  return Boolean(column.terminal);
}

export function visibleBonusBoardKanbanColumns(
  scope: BoardLifecycleScope,
): BonusBoardKanbanColumnDef[] {
  const keys = getBoardStageKeys(BONUS_BOARD_LIFECYCLE_STAGES, scope);
  return BONUS_BOARD_KANBAN_COLUMNS.filter((column) => keys.includes(column.key));
}

export function bonusEntriesForKanbanColumn(
  rows: ReadonlyArray<{ status: BonusStatus }>,
  columnKey: BonusBoardKanbanColumnKey,
): typeof rows {
  const column = BONUS_BOARD_KANBAN_COLUMNS.find((c) => c.key === columnKey);
  if (!column) return [];
  return rows.filter((row) => column.statuses.includes(row.status));
}
