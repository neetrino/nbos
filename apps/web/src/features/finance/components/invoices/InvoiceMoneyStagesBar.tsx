'use client';

import { PipelineStagesBar } from '@/components/shared';
import { INVOICE_PIPELINE_MONEY_STAGES } from '@/features/finance/constants/finance';

const STAGE_HEX: Record<string, string> = {
  NEW: '#3b82f6',
  AWAITING_PAYMENT: '#8b5cf6',
  OVERDUE: '#f97316',
  ON_HOLD: '#a3a3a3',
  PAID: '#22c55e',
  CANCELLED: '#ef4444',
};

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
      stages={INVOICE_PIPELINE_MONEY_STAGES}
      stageColors={STAGE_HEX}
      currentStatus={currentStatus}
      fillToEndStatuses={['PAID', 'CANCELLED']}
      disabled={disabled}
      onStageClick={onStageClick}
    />
  );
}
