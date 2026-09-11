'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  classifyCoverageMonth,
  formatSubscriptionInvoiceMonthLabel,
  formatSubscriptionInvoiceMonthName,
  formatSubscriptionInvoiceMonthYear,
  type CoverageMonthKind,
} from '@/features/finance/utils/subscription-invoice-months';

const KIND_LABEL: Record<CoverageMonthKind, string> = {
  past: 'Past',
  current: 'Current',
  future: 'Future',
};

export function CoverageMonthTile({
  monthKey,
  checked,
  blocked,
  canAddMonth,
  disabled,
  onToggle,
}: {
  monthKey: string;
  checked: boolean;
  blocked: boolean;
  canAddMonth: boolean;
  disabled: boolean;
  onToggle: (monthKey: string) => void;
}) {
  const kind = classifyCoverageMonth(monthKey);
  const rowDisabled = disabled || blocked || (!checked && !canAddMonth);
  const name = formatSubscriptionInvoiceMonthName(monthKey);
  const year = formatSubscriptionInvoiceMonthYear(monthKey);
  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={formatSubscriptionInvoiceMonthLabel(monthKey)}
      disabled={rowDisabled}
      onClick={() => onToggle(monthKey)}
      className={cn(
        'group relative flex min-h-20 flex-col items-start rounded-xl border px-3 py-2.5 text-left transition-colors',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        tileSurfaceClass(kind, checked),
        rowDisabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <TileCheckmark checked={checked} />
      <span className={cn('text-xs font-medium tracking-wide uppercase', kindLabelClass(kind))}>
        {KIND_LABEL[kind]}
      </span>
      <span className="text-foreground mt-1 text-base leading-tight font-semibold">{name}</span>
      <span className="text-muted-foreground mt-0.5 text-sm tabular-nums">{year}</span>
    </button>
  );
}

function TileCheckmark({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'absolute top-2 right-2 flex size-5 items-center justify-center rounded-full transition-opacity',
        checked
          ? 'bg-primary text-primary-foreground opacity-100'
          : 'bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
      )}
      aria-hidden
    >
      <Check className="size-3" />
    </span>
  );
}

function tileSurfaceClass(kind: CoverageMonthKind, checked: boolean): string {
  if (checked) {
    return 'border-primary bg-primary/10 shadow-sm';
  }
  if (kind === 'past') {
    return 'border-border bg-muted/50 hover:border-border hover:bg-muted/70';
  }
  if (kind === 'current') {
    return 'border-primary/30 bg-primary/5 hover:border-primary/50';
  }
  return 'bg-card border-border hover:border-primary/40 hover:bg-accent/40';
}

function kindLabelClass(kind: CoverageMonthKind): string {
  if (kind === 'past') return 'text-muted-foreground';
  if (kind === 'current') return 'text-primary';
  return 'text-muted-foreground/80';
}
