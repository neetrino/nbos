'use client';

import { PipelineStagesBar } from '@/components/shared';
import { toSheetPipelineStages } from '@/components/shared/pipeline-stage-config';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { DEAL_STAGES } from '../constants/dealPipeline';
import { CrmSheetPipelineStatusSelect } from './CrmSheetPipelineStatusSelect';

const STAGE_HEX: Record<string, string> = {
  START_CONVERSATION: '#56b5eb',
  DISCUSS_NEEDS: '#39a0d8',
  SEND_OFFER: '#7c3aed',
  GET_ANSWER: '#8b5cf6',
  DEPOSIT_AND_CONTRACT: '#a855f7',
  FAILED: '#ef4444',
  WON: '#22c55e',
};

const SHEET_STAGES = toSheetPipelineStages(DEAL_STAGES);

interface DealPipelineStagesProps {
  currentStatus: string;
  onStageClick: (stageKey: string) => void;
  disabled?: boolean;
}

export function DealPipelineStages({
  currentStatus,
  onStageClick,
  disabled = false,
}: DealPipelineStagesProps) {
  const isMobileViewport = useIsMobileViewport();

  if (isMobileViewport) {
    return (
      <CrmSheetPipelineStatusSelect
        stages={SHEET_STAGES}
        stageColors={STAGE_HEX}
        currentStatus={currentStatus}
        onStageChange={onStageClick}
        disabled={disabled}
        ariaLabel="Deal status"
      />
    );
  }

  return (
    <PipelineStagesBar
      stages={SHEET_STAGES}
      stageColors={STAGE_HEX}
      currentStatus={currentStatus}
      fillToEndStatuses={['WON']}
      disabled={disabled}
      onStageClick={onStageClick}
    />
  );
}
