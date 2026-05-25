'use client';

import { PipelineStagesBar } from '@/components/shared';
import { toSheetPipelineStages } from '@/components/shared/pipeline-stage-config';
import { LEAD_STAGES } from '../constants/leadPipeline';

const STAGE_HEX: Record<string, string> = {
  NEW: '#3b82f6',
  ON_HOLD: '#171717',
  DIDNT_GET_THROUGH: '#9ca3af',
  CONTACT_ESTABLISHED: '#6366f1',
  MQL: '#a855f7',
  SPAM: '#ef4444',
  SQL: '#10b981',
};

const LEAD_SHORT_LABEL: Record<(typeof LEAD_STAGES)[number]['key'], string> = {
  NEW: 'New',
  ON_HOLD: 'On Hold',
  DIDNT_GET_THROUGH: "Didn't…",
  CONTACT_ESTABLISHED: 'Contact',
  MQL: 'MQL',
  SPAM: 'Spam',
  SQL: 'Lead Won',
};

const SHEET_STAGES = toSheetPipelineStages(
  LEAD_STAGES.map((stage) => ({
    key: stage.key,
    label: stage.label,
    shortLabel: LEAD_SHORT_LABEL[stage.key],
  })),
);

interface LeadPipelineStagesProps {
  currentStatus: string;
  onStageClick: (stageKey: string) => void;
}

export function LeadPipelineStages({ currentStatus, onStageClick }: LeadPipelineStagesProps) {
  return (
    <PipelineStagesBar
      stages={SHEET_STAGES}
      stageColors={STAGE_HEX}
      currentStatus={currentStatus}
      fillToEndStatuses={['SQL']}
      onStageClick={onStageClick}
    />
  );
}
