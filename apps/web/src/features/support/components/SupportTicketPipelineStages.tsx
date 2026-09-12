'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { PipelineStagesBar } from '@/components/shared';
import { toSheetPipelineStages } from '@/components/shared/pipeline-stage-config';
import {
  translateSupportStatus,
  type SupportTranslator,
} from '@/features/support/support-message-keys';

const SUPPORT_ACTIVE_STAGES = ['NEW', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS'] as const;

type SupportActiveStage = (typeof SUPPORT_ACTIVE_STAGES)[number];

const SUPPORT_PIPELINE_RESOLVED_KEY = 'RESOLVED';
const SUPPORT_PIPELINE_CLOSED_KEY = 'CLOSED';

const STAGE_HEX: Record<string, string> = {
  NEW: '#22c55e',
  TRIAGED: '#2563eb',
  ASSIGNED: '#7c3aed',
  IN_PROGRESS: '#a855f7',
  [SUPPORT_PIPELINE_RESOLVED_KEY]: '#22c55e',
  [SUPPORT_PIPELINE_CLOSED_KEY]: '#737373',
};

const ACTIVE_SHORT_FALLBACK: Record<SupportActiveStage, string> = {
  NEW: 'New',
  TRIAGED: 'Triaged',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'Progress',
};

function canClickSupportStage(stageKey: string, currentStatus: string): boolean {
  if (!currentStatus || currentStatus === SUPPORT_PIPELINE_CLOSED_KEY) {
    return false;
  }
  if (currentStatus === SUPPORT_PIPELINE_RESOLVED_KEY) {
    return stageKey === SUPPORT_PIPELINE_CLOSED_KEY;
  }
  if (stageKey === SUPPORT_PIPELINE_CLOSED_KEY) {
    return false;
  }
  if (stageKey === SUPPORT_PIPELINE_RESOLVED_KEY) {
    return true;
  }
  const activeIdx = SUPPORT_ACTIVE_STAGES.indexOf(currentStatus as SupportActiveStage);
  const targetIdx = SUPPORT_ACTIVE_STAGES.indexOf(stageKey as SupportActiveStage);
  return activeIdx >= 0 && targetIdx > activeIdx;
}

interface SupportTicketPipelineStagesProps {
  currentStatus: string;
  disabled?: boolean;
  onSelect: (status: string) => void;
}

/** Sheet header pipeline — same pattern as {@link DeliveryPipelineStages}. */
export function SupportTicketPipelineStages({
  currentStatus,
  disabled = false,
  onSelect,
}: SupportTicketPipelineStagesProps) {
  const t = useTranslations('support') as SupportTranslator;

  const stages = useMemo(
    () =>
      toSheetPipelineStages([
        ...SUPPORT_ACTIVE_STAGES.map((key) => {
          const label = translateSupportStatus(t, key, ACTIVE_SHORT_FALLBACK[key]);
          return { key, label, shortLabel: label };
        }),
        {
          key: SUPPORT_PIPELINE_RESOLVED_KEY,
          label: translateSupportStatus(t, SUPPORT_PIPELINE_RESOLVED_KEY, 'Resolved'),
          shortLabel: translateSupportStatus(t, SUPPORT_PIPELINE_RESOLVED_KEY, 'Resolved'),
        },
        {
          key: SUPPORT_PIPELINE_CLOSED_KEY,
          label: translateSupportStatus(t, SUPPORT_PIPELINE_CLOSED_KEY, 'Closed'),
          shortLabel: translateSupportStatus(t, SUPPORT_PIPELINE_CLOSED_KEY, 'Closed'),
        },
      ]),
    [t],
  );

  return (
    <PipelineStagesBar
      stages={stages}
      stageColors={STAGE_HEX}
      currentStatus={currentStatus}
      fillToEndStatuses={[SUPPORT_PIPELINE_RESOLVED_KEY]}
      disabled={disabled}
      canClickStage={(stageKey) => canClickSupportStage(stageKey, currentStatus)}
      onStageClick={onSelect}
    />
  );
}
