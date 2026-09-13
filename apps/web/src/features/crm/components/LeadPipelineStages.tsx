'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { PipelineStagesBar } from '@/components/shared';
import { toSheetPipelineStages } from '@/components/shared/pipeline-stage-config';
import { LEAD_STAGES } from '../constants/leadPipeline';
import { translateLeadStageLabel } from '../i18n/crm-copy';

const STAGE_HEX: Record<string, string> = Object.fromEntries(
  LEAD_STAGES.map((stage) => [stage.key, stage.hexColor]),
);

const LEAD_PIPELINE_SEGMENT_GAP_PX = 3;

interface LeadPipelineStagesProps {
  currentStatus: string;
  onStageClick: (stageKey: string) => void;
}

export function LeadPipelineStages({ currentStatus, onStageClick }: LeadPipelineStagesProps) {
  const t = useTranslations('crm');
  const sheetStages = useMemo(
    () =>
      toSheetPipelineStages(
        LEAD_STAGES.map((stage) => ({
          ...stage,
          label: translateLeadStageLabel(t, stage.key),
          shortLabel: translateLeadStageLabel(t, stage.key, 'short'),
        })),
      ),
    [t],
  );
  return (
    <PipelineStagesBar
      stages={sheetStages}
      stageColors={STAGE_HEX}
      currentStatus={currentStatus}
      fillToEndStatuses={['SQL']}
      segmentGapPx={LEAD_PIPELINE_SEGMENT_GAP_PX}
      onStageClick={onStageClick}
    />
  );
}
