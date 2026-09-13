'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { PipelineStagesBar } from '@/components/shared';
import { toSheetPipelineStages } from '@/components/shared/pipeline-stage-config';
import { DEAL_STAGES } from '../constants/dealPipeline';
import { translateDealStageLabel } from '../i18n/crm-copy';

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
  const t = useTranslations('crm');
  const sheetStages = useMemo(
    () =>
      toSheetPipelineStages(
        DEAL_STAGES.map((stage) => ({
          ...stage,
          label: translateDealStageLabel(t, stage.key),
          shortLabel: translateDealStageLabel(t, stage.key, 'short'),
        })),
      ),
    [t],
  );
  return (
    <PipelineStagesBar
      stages={sheetStages}
      stageColors={STAGE_HEX}
      currentStatus={currentStatus}
      fillToEndStatuses={['WON']}
      onStageClick={onStageClick}
    />
  );
}
