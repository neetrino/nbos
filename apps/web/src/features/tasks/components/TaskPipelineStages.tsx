'use client';

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

const STAGE_SHORT: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  REVIEW: 'Review',
  ON_HOLD: 'Hold',
  COMPLETED: 'Done',
};

const SHEET_STAGES = toSheetPipelineStages(
  TASK_BOARD_STAGES.map((stage) => ({
    key: stage.key,
    label: STAGE_SHORT[stage.key] ?? stage.key,
    shortLabel: STAGE_SHORT[stage.key] ?? stage.key,
  })),
);

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
  const normalized = normalizeTaskStatusForDraft(currentStatus);

  return (
    <PipelineStagesBar
      stages={SHEET_STAGES}
      stageColors={STAGE_HEX}
      currentStatus={normalized}
      fillToEndStatuses={['COMPLETED']}
      disabled={disabled}
      segmentGapPx={TASK_PIPELINE_SEGMENT_GAP_PX}
      onStageClick={onStageClick}
    />
  );
}
