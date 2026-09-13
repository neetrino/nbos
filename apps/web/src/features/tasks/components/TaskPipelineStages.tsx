'use client';

import { useTranslations } from 'next-intl';
import { PipelineStagesBar } from '@/components/shared';
import { toSheetPipelineStages } from '@/components/shared/pipeline-stage-config';
import { TASK_BOARD_STAGES } from '@/features/tasks/constants/task-board-lifecycle';
import { normalizeTaskStatusForDraft } from '@/features/tasks/utils/task-status-draft';

const TASK_PIPELINE_SEGMENT_GAP_PX = 4;

const STAGE_HEX: Record<string, string> = {
  OPEN: '#3b82f6',
  IN_PROGRESS: '#f97316',
  REVIEW: '#7c3aed',
  ON_HOLD: '#a3a3a3',
  COMPLETED: '#22c55e',
};

const PIPELINE_KEYS = ['OPEN', 'IN_PROGRESS', 'REVIEW', 'ON_HOLD', 'COMPLETED'] as const;
type PipelineKey = (typeof PIPELINE_KEYS)[number];

function isPipelineKey(value: string): value is PipelineKey {
  return PIPELINE_KEYS.some((key) => key === value);
}

interface TaskPipelineStagesProps {
  currentStatus: string;
  disabled?: boolean;
  onStageClick: (status: string) => void;
}

/** Sheet header pipeline — same flush pattern as Deal / Invoice. */
export function TaskPipelineStages({
  currentStatus,
  disabled = false,
  onStageClick,
}: TaskPipelineStagesProps) {
  const t = useTranslations('tasks');
  const normalized = normalizeTaskStatusForDraft(currentStatus);
  const stages = toSheetPipelineStages(
    TASK_BOARD_STAGES.map((stage) => {
      const label = isPipelineKey(stage.key) ? t(`pipeline.${stage.key}`) : stage.key;
      return { key: stage.key, label, shortLabel: label };
    }),
  );

  return (
    <PipelineStagesBar
      stages={stages}
      stageColors={STAGE_HEX}
      currentStatus={normalized}
      fillToEndStatuses={['COMPLETED']}
      disabled={disabled}
      segmentGapPx={TASK_PIPELINE_SEGMENT_GAP_PX}
      onStageClick={onStageClick}
    />
  );
}
