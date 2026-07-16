'use client';

import { PipelineStagesBar } from '@/components/shared';
import { toSheetPipelineStages } from '@/components/shared/pipeline-stage-config';

const INVOICE_PIPELINE_MONEY_STAGES = [
  { key: 'NEW', label: 'New', shortLabel: 'New' },
  { key: 'AWAITING_PAYMENT', label: 'Awaiting payment', shortLabel: 'Awaiting' },
  { key: 'OVERDUE', label: 'Overdue', shortLabel: 'Overdue' },
  { key: 'ON_HOLD', label: 'On hold', shortLabel: 'Hold' },
  { key: 'PAID', label: 'Paid', shortLabel: 'Paid' },
  { key: 'CANCELLED', label: 'Cancelled', shortLabel: 'Cancelled' },
] as const;

const STAGE_HEX: Record<string, string> = {
  NEW: '#3b82f6',
  AWAITING_PAYMENT: '#8b5cf6',
  OVERDUE: '#f97316',
  ON_HOLD: '#a3a3a3',
  PAID: '#22c55e',
  CANCELLED: '#ef4444',
};

const SHEET_STAGES = toSheetPipelineStages(INVOICE_PIPELINE_MONEY_STAGES);

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
  return (
    <PipelineStagesBar
      stages={SHEET_STAGES}
      stageColors={STAGE_HEX}
      currentStatus={currentStatus}
      fillToEndStatuses={['PAID']}
      disabled={disabled}
      onStageClick={onStageClick}
    />
  );
}
