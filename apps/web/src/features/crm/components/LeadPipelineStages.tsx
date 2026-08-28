'use client';

import { PipelineStagesBar } from '@/components/shared';
import { toSheetPipelineStages } from '@/components/shared/pipeline-stage-config';
import { LEAD_STAGES } from '../constants/leadPipeline';

const STAGE_HEX: Record<string, string> = Object.fromEntries(
  LEAD_STAGES.map((stage) => [stage.key, stage.hexColor]),
);

const LEAD_PIPELINE_SEGMENT_GAP_PX = 3;

const SHEET_STAGES = toSheetPipelineStages(LEAD_STAGES);

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
      segmentGapPx={LEAD_PIPELINE_SEGMENT_GAP_PX}
      onStageClick={onStageClick}
    />
  );
}
