'use client';

import { INVOICE_MONEY_STAGES } from '@/features/finance/constants/finance';

const STAGE_HEX: Record<string, string> = {
  NEW: '#3b82f6',
  AWAITING_PAYMENT: '#8b5cf6',
  OVERDUE: '#f97316',
  ON_HOLD: '#a3a3a3',
  PAID: '#22c55e',
  CANCELLED: '#ef4444',
};

const ACTIVE_KEYS = ['NEW', 'AWAITING_PAYMENT', 'OVERDUE', 'ON_HOLD'] as const;

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
  const stages = INVOICE_MONEY_STAGES.filter((s) =>
    ACTIVE_KEYS.includes(s.value as (typeof ACTIVE_KEYS)[number]),
  );

  return (
    <div className="flex flex-wrap gap-1.5">
      {stages.map((stage) => {
        const isActive = stage.value === currentStatus;
        const color = STAGE_HEX[stage.value] ?? '#a3a3a3';
        return (
          <button
            key={stage.value}
            type="button"
            disabled={disabled}
            title={stage.label}
            onClick={() => onStageClick(stage.value)}
            className={
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity ' +
              (isActive
                ? 'text-white shadow-sm'
                : 'text-muted-foreground bg-muted/60 hover:bg-muted')
            }
            style={isActive ? { backgroundColor: color } : undefined}
          >
            {stage.label}
          </button>
        );
      })}
      {currentStatus === 'PAID' || currentStatus === 'CANCELLED' ? (
        <span
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
          style={{ backgroundColor: STAGE_HEX[currentStatus] }}
        >
          {INVOICE_MONEY_STAGES.find((s) => s.value === currentStatus)?.label ?? currentStatus}
        </span>
      ) : null}
    </div>
  );
}
