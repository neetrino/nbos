'use client';

import { PipelineStagesBar } from '@/components/shared';
import { ACTIVE_DEAL_STAGES } from '../constants/dealPipeline';

const STAGE_HEX: Record<string, string> = {
  START_CONVERSATION: '#56b5eb',
  DISCUSS_NEEDS: '#39a0d8',
  SEND_OFFER: '#7c3aed',
  GET_ANSWER: '#8b5cf6',
  DEPOSIT_AND_CONTRACT: '#a855f7',
  FAILED: '#ef4444',
  WON: '#22c55e',
};

interface DealPipelineStagesProps {
  currentStatus: string;
  onStageClick: (stageKey: string) => void;
}

export function DealPipelineStages({ currentStatus, onStageClick }: DealPipelineStagesProps) {
  return (
    <PipelineStagesBar
      stages={ACTIVE_DEAL_STAGES}
      stageColors={STAGE_HEX}
      currentStatus={currentStatus}
      fillToEndStatuses={['WON']}
      onStageClick={onStageClick}
    />
  );
}
