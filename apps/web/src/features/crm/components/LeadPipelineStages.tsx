'use client';

import { PipelineStagesBar } from '@/components/shared';
import { toSheetPipelineStages } from '@/components/shared/pipeline-stage-config';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { LEAD_STAGES } from '../constants/leadPipeline';
import { CrmSheetPipelineStatusSelect } from './CrmSheetPipelineStatusSelect';

const STAGE_HEX: Record<string, string> = Object.fromEntries(
  LEAD_STAGES.map((stage) => [stage.key, stage.hexColor]),
);

const LEAD_PIPELINE_SEGMENT_GAP_PX = 3;

const SHEET_STAGES = toSheetPipelineStages(LEAD_STAGES);

interface LeadPipelineStagesProps {
  currentStatus: string;
  onStageClick: (stageKey: string) => void;
  disabled?: boolean;
}

export function LeadPipelineStages({
  currentStatus,
  onStageClick,
  disabled = false,
}: LeadPipelineStagesProps) {
  const isMobileViewport = useIsMobileViewport();

  if (isMobileViewport) {
    return (
      <CrmSheetPipelineStatusSelect
        stages={SHEET_STAGES}
        stageColors={STAGE_HEX}
        currentStatus={currentStatus}
        onStageChange={onStageClick}
        disabled={disabled}
        ariaLabel="Lead status"
      />
    );
  }

  return (
    <PipelineStagesBar
      stages={SHEET_STAGES}
      stageColors={STAGE_HEX}
      currentStatus={currentStatus}
      fillToEndStatuses={['SQL']}
      segmentGapPx={LEAD_PIPELINE_SEGMENT_GAP_PX}
      disabled={disabled}
      onStageClick={onStageClick}
    />
  );
}
