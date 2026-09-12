'use client';

import { useTranslations } from 'next-intl';
import { PipelineStagesBar } from '@/components/shared';
import { toSheetPipelineStages } from '@/components/shared/pipeline-stage-config';
import {
  INVOICE_STAGE_MESSAGE_KEYS,
  INVOICE_STAGE_SHORT_MESSAGE_KEYS,
} from './invoice-message-keys';

const INVOICE_PIPELINE_STAGE_KEYS = [
  'NEW',
  'AWAITING_PAYMENT',
  'OVERDUE',
  'ON_HOLD',
  'CANCELLED',
  'PAID',
] as const;

const STAGE_HEX: Record<string, string> = {
  NEW: '#3b82f6',
  AWAITING_PAYMENT: '#8b5cf6',
  OVERDUE: '#f97316',
  ON_HOLD: '#a3a3a3',
  PAID: '#22c55e',
  CANCELLED: '#ef4444',
};

/** Slight open gap between chevrons (same rhythm as expense sheet pipeline). */
const INVOICE_PIPELINE_SEGMENT_GAP_PX = 4;

interface InvoiceMoneyStagesBarProps {
  currentStatus: string;
  disabled?: boolean;
  onStageClick: (moneyStatus: string) => void;
}

export function InvoiceMoneyStagesBar({
  currentStatus,
  disabled = false,
  onStageClick,
}: InvoiceMoneyStagesBarProps) {
  const t = useTranslations('invoices');
  const stages = toSheetPipelineStages(
    INVOICE_PIPELINE_STAGE_KEYS.map((key) => ({
      key,
      label: t(INVOICE_STAGE_MESSAGE_KEYS[key]),
      shortLabel: t(INVOICE_STAGE_SHORT_MESSAGE_KEYS[key]),
    })),
  );

  return (
    <PipelineStagesBar
      stages={stages}
      stageColors={STAGE_HEX}
      currentStatus={currentStatus}
      fillToEndStatuses={['PAID']}
      disabled={disabled}
      segmentGapPx={INVOICE_PIPELINE_SEGMENT_GAP_PX}
      onStageClick={onStageClick}
    />
  );
}
