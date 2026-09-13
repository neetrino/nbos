'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { PipelineStagesBar } from '@/components/shared';
import { toSheetPipelineStages } from '@/components/shared/pipeline-stage-config';
import {
  EXPENSE_BOARD_COLUMN_KEYS,
  type ExpenseBoardColumnKey,
} from '@/features/finance/constants/expense-board';
import { translateExpenseStageShort } from './expense-i18n-labels';

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
  const t = useTranslations('expenses');
  const stages = useMemo(
    () =>
      toSheetPipelineStages([
        ...EXPENSE_BOARD_COLUMN_KEYS.map((key) => {
          const label = translateExpenseStageShort(key, t);
          return { key, label, shortLabel: label };
        }),
        {
          key: EXPENSE_PIPELINE_CANCEL_KEY,
          label: translateExpenseStageShort(EXPENSE_PIPELINE_CANCEL_KEY, t),
          shortLabel: translateExpenseStageShort(EXPENSE_PIPELINE_CANCEL_KEY, t),
        },
        {
          key: EXPENSE_PIPELINE_PAID_KEY,
          label: translateExpenseStageShort(EXPENSE_PIPELINE_PAID_KEY, t),
          shortLabel: translateExpenseStageShort(EXPENSE_PIPELINE_PAID_KEY, t),
        },
      ]),
    [t],
  );

  return (
    <PipelineStagesBar
      stages={stages}
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
