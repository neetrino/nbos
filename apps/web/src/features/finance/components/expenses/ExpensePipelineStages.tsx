'use client';

import { PipelineStagesBar } from '@/components/shared';
import { toSheetPipelineStages } from '@/components/shared/pipeline-stage-config';
import {
  EXPENSE_BOARD_COLUMN_KEYS,
  type ExpenseBoardColumnKey,
} from '@/features/finance/constants/expense-board';

const EXPENSE_PIPELINE_PAID_KEY = 'PAID';
const EXPENSE_PIPELINE_CANCEL_KEY = 'CANCELLED';
/** Extra space beyond default interlocking overlap. */
const EXPENSE_PIPELINE_SEGMENT_GAP_PX = 4;

const STAGE_HEX: Record<string, string> = {
  PLANNED: '#22c55e',
  DUE_SOON: '#2563eb',
  DUE_NOW: '#7c3aed',
  OVERDUE: '#a855f7',
  ON_HOLD: '#a3a3a3',
  [EXPENSE_PIPELINE_PAID_KEY]: '#22c55e',
  [EXPENSE_PIPELINE_CANCEL_KEY]: '#ef4444',
};

const ACTIVE_SHORT: Record<ExpenseBoardColumnKey, string> = {
  PLANNED: 'Planned',
  DUE_SOON: 'Soon',
  DUE_NOW: 'Now',
  OVERDUE: 'Overdue',
  ON_HOLD: 'Hold',
};

const SHEET_STAGES = toSheetPipelineStages([
  ...EXPENSE_BOARD_COLUMN_KEYS.map((key) => ({
    key,
    label: ACTIVE_SHORT[key],
    shortLabel: ACTIVE_SHORT[key],
  })),
  { key: EXPENSE_PIPELINE_CANCEL_KEY, label: 'Cancel', shortLabel: 'Cancel' },
  { key: EXPENSE_PIPELINE_PAID_KEY, label: 'Paid', shortLabel: 'Paid' },
]);

function canClickExpenseStage(stageKey: string, currentStatus: string): boolean {
  if (
    !currentStatus ||
    currentStatus === EXPENSE_PIPELINE_PAID_KEY ||
    currentStatus === EXPENSE_PIPELINE_CANCEL_KEY
  ) {
    return false;
  }
  if (stageKey === EXPENSE_PIPELINE_PAID_KEY || stageKey === EXPENSE_PIPELINE_CANCEL_KEY) {
    return true;
  }
  if (currentStatus === 'BACKLOG') {
    return EXPENSE_BOARD_COLUMN_KEYS.includes(stageKey as ExpenseBoardColumnKey);
  }
  const activeIdx = EXPENSE_BOARD_COLUMN_KEYS.indexOf(currentStatus as ExpenseBoardColumnKey);
  const targetIdx = EXPENSE_BOARD_COLUMN_KEYS.indexOf(stageKey as ExpenseBoardColumnKey);
  return activeIdx >= 0 && targetIdx > activeIdx;
}

interface ExpensePipelineStagesProps {
  currentStatus: string;
  disabled?: boolean;
  onSelect: (status: string) => void;
}

/** Sheet header pipeline — same pattern as {@link DeliveryPipelineStages}. */
export function ExpensePipelineStages({
  currentStatus,
  disabled = false,
  onSelect,
}: ExpensePipelineStagesProps) {
  return (
    <PipelineStagesBar
      stages={SHEET_STAGES}
      stageColors={STAGE_HEX}
      currentStatus={currentStatus}
      fillToEndStatuses={[EXPENSE_PIPELINE_PAID_KEY]}
      disabled={disabled}
      segmentGapPx={EXPENSE_PIPELINE_SEGMENT_GAP_PX}
      canClickStage={(stageKey) => canClickExpenseStage(stageKey, currentStatus)}
      onStageClick={onSelect}
    />
  );
}
