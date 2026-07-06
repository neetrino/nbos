'use client';

import { cn } from '@/lib/utils';
import { PARTNER_STATUSES } from '@/features/partners/constants/partners';

const PARTNER_STATUS_KEYS = ['ACTIVE', 'PAUSED', 'TERMINATED'] as const;

export interface PartnerLifecycleStagesProps {
  currentStatus: string;
  disabled?: boolean;
  layout?: 'bar' | 'inline';
  onStatusSelect: (status: (typeof PARTNER_STATUS_KEYS)[number]) => void;
}

export function PartnerLifecycleStages({
  currentStatus,
  disabled = false,
  layout = 'bar',
  onStatusSelect,
}: PartnerLifecycleStagesProps) {
  return (
    <div
      className={cn('flex flex-wrap gap-1.5', layout === 'bar' ? 'px-5 py-2.5' : 'items-center')}
    >
      {PARTNER_STATUS_KEYS.map((key) => {
        const meta = PARTNER_STATUSES.find((s) => s.value === key);
        const active = currentStatus === key;
        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            title={meta?.label ?? key}
            onClick={() => onStatusSelect(key)}
            className={cn(
              'inline-flex items-center rounded-lg border font-semibold tracking-wide uppercase transition-colors',
              layout === 'inline' ? 'h-7 px-2.5 text-[11px]' : 'px-3 py-1.5 text-xs',
              active
                ? 'border-sky-500 bg-sky-50 text-sky-800 dark:border-sky-600 dark:bg-sky-950/40 dark:text-sky-300'
                : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50',
              disabled && 'pointer-events-none opacity-50',
            )}
          >
            {meta?.label ?? key}
          </button>
        );
      })}
    </div>
  );
}
