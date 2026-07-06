'use client';

import { cn } from '@/lib/utils';
import { PARTNER_STATUSES } from '@/features/partners/constants/partners';

const PARTNER_STATUS_FILTER_KEYS = ['ACTIVE', 'PAUSED', 'TERMINATED'] as const;

export interface PartnerStatusFilterChipsProps {
  value: string | null;
  onChange: (status: string | null) => void;
  disabled?: boolean;
}

export function PartnerStatusFilterChips({
  value,
  onChange,
  disabled = false,
}: PartnerStatusFilterChipsProps) {
  return (
    <div
      className="flex shrink-0 flex-nowrap items-center gap-1"
      role="group"
      aria-label="Filter by partner status"
    >
      {PARTNER_STATUS_FILTER_KEYS.map((key) => {
        const meta = PARTNER_STATUSES.find((s) => s.value === key);
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            title={meta?.label ?? key}
            onClick={() => onChange(active ? null : key)}
            className={cn(
              'inline-flex h-7 items-center rounded-lg border px-2.5 text-[11px] font-semibold tracking-wide whitespace-nowrap uppercase transition-colors',
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
