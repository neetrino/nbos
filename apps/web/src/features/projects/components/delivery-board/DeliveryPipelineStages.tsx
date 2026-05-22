'use client';

import { PipelineStagesBar } from '@/components/shared';
import { toSheetPipelineStages } from '@/components/shared/pipeline-stage-config';
import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import { ACTIVE_DELIVERY_STAGES } from './project-delivery-board-model';

/** UI keys for terminal actions (not API stage enums). */
export const DELIVERY_PIPELINE_DONE_KEY = '__DONE__';
export const DELIVERY_PIPELINE_CANCEL_KEY = '__CANCEL__';

export type DeliveryPipelineClickKey =
  | (typeof ACTIVE_DELIVERY_STAGES)[number]
  | typeof DELIVERY_PIPELINE_DONE_KEY
  | typeof DELIVERY_PIPELINE_CANCEL_KEY;

const STAGE_HEX: Record<string, string> = {
  STARTING: '#22c55e',
  DEVELOPMENT: '#2563eb',
  QA: '#7c3aed',
  TRANSFER: '#a855f7',
  [DELIVERY_PIPELINE_DONE_KEY]: '#22c55e',
  [DELIVERY_PIPELINE_CANCEL_KEY]: '#ef4444',
};

const ACTIVE_SHORT: Record<(typeof ACTIVE_DELIVERY_STAGES)[number], string> = {
  STARTING: 'Start',
  DEVELOPMENT: 'Dev',
  QA: 'QA',
  TRANSFER: 'Transfer',
};

const SHEET_STAGES = toSheetPipelineStages([
  ...ACTIVE_DELIVERY_STAGES.map((key) => ({
    key,
    label: ACTIVE_SHORT[key],
    shortLabel: ACTIVE_SHORT[key],
  })),
  { key: DELIVERY_PIPELINE_DONE_KEY, label: 'Done', shortLabel: 'Done' },
  { key: DELIVERY_PIPELINE_CANCEL_KEY, label: 'Cancel', shortLabel: 'Cancel' },
]);

function resolveSheetCurrentStatus(lifecycle: DeliveryLifecycleProjection | undefined): string {
  if (!lifecycle) return '';
  if (lifecycle.isTerminal && lifecycle.resolution === 'DONE') {
    return DELIVERY_PIPELINE_DONE_KEY;
  }
  if (lifecycle.isTerminal && lifecycle.resolution === 'CANCELLED') {
    return DELIVERY_PIPELINE_CANCEL_KEY;
  }
  return lifecycle.stage ?? '';
}

function canClickDeliveryStage(
  stageKey: string,
  lifecycle: DeliveryLifecycleProjection | undefined,
): boolean {
  if (!lifecycle || lifecycle.isTerminal || lifecycle.workStatus === 'ON_HOLD') {
    return false;
  }
  if (stageKey === DELIVERY_PIPELINE_DONE_KEY || stageKey === DELIVERY_PIPELINE_CANCEL_KEY) {
    return Boolean(lifecycle.stage);
  }
  const activeIdx = lifecycle.stage != null ? ACTIVE_DELIVERY_STAGES.indexOf(lifecycle.stage) : -1;
  const targetIdx = ACTIVE_DELIVERY_STAGES.indexOf(
    stageKey as (typeof ACTIVE_DELIVERY_STAGES)[number],
  );
  return activeIdx >= 0 && targetIdx > activeIdx;
}

interface DeliveryPipelineStagesProps {
  lifecycle: DeliveryLifecycleProjection | undefined;
  disabled?: boolean;
  onSelect: (key: DeliveryPipelineClickKey) => void;
}

export function DeliveryPipelineStages({
  lifecycle,
  disabled = false,
  onSelect,
}: DeliveryPipelineStagesProps) {
  return (
    <PipelineStagesBar
      stages={SHEET_STAGES}
      stageColors={STAGE_HEX}
      currentStatus={resolveSheetCurrentStatus(lifecycle)}
      fillToEndStatuses={[DELIVERY_PIPELINE_DONE_KEY]}
      disabled={disabled}
      canClickStage={(stageKey) => canClickDeliveryStage(stageKey, lifecycle)}
      onStageClick={(key) => onSelect(key as DeliveryPipelineClickKey)}
    />
  );
}
