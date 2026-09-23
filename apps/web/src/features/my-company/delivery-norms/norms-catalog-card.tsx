'use client';

import type { ReactNode } from 'react';
import { KanbanCardShell } from '@/components/shared';
import { cn } from '@/lib/utils';
import { UNIT_SUM_EMPTY } from './format-unit-sum';
import { NormativeStatusBadge } from './normative-status-badge';

const CARD_BUTTON_CLASS = [
  'flex h-full w-full flex-col gap-4 p-4 text-left',
  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
].join(' ');

const METRIC_COL_CLASS = 'flex min-w-[7.5rem] shrink-0 flex-col justify-end gap-1.5';

export function NormsCatalogCard({
  title,
  icon,
  unitsLabel,
  salePriceLabel,
  includedLabel,
  salesCaption,
  unitsCaption,
  includedCaption,
  status,
  statusLabel,
  badge,
  canOpen,
  onOpen,
}: {
  title: string;
  icon?: ReactNode;
  unitsLabel: string;
  salePriceLabel?: string | null;
  includedLabel?: string | null;
  salesCaption: string;
  unitsCaption: string;
  includedCaption: string;
  status: string | null;
  statusLabel: string | null;
  badge?: ReactNode;
  canOpen: boolean;
  onOpen: () => void;
}) {
  return (
    <KanbanCardShell
      as="article"
      radius="xl"
      padding="none"
      baseShadow="sm"
      hoverShadow="md"
      className={cn('h-full', !canOpen && 'opacity-70')}
    >
      <button
        type="button"
        disabled={!canOpen}
        className={cn(CARD_BUTTON_CLASS, !canOpen && 'hover:bg-card cursor-default')}
        onClick={onOpen}
      >
        <CardHeader
          title={title}
          icon={icon}
          status={status}
          statusLabel={statusLabel}
          badge={badge}
        />
        <CardLead
          label={salePriceLabel}
          caption={salesCaption}
          metrics={cardMetrics({
            unitsLabel,
            unitsCaption,
            includedLabel,
            includedCaption,
          })}
        />
      </button>
    </KanbanCardShell>
  );
}

function CardHeader({
  title,
  icon,
  status,
  statusLabel,
  badge,
}: {
  title: string;
  icon?: ReactNode;
  status: string | null;
  statusLabel: string | null;
  badge?: ReactNode;
}) {
  return (
    <span className="flex items-start justify-between gap-2">
      <span className="flex min-w-0 items-start gap-2">
        {icon}
        <span className="text-foreground line-clamp-2 min-h-10 text-sm leading-snug font-bold">
          {title}
        </span>
      </span>
      {badge ??
        (status && statusLabel ? (
          <NormativeStatusBadge status={status} label={statusLabel} />
        ) : null)}
    </span>
  );
}

function CardLead({
  label,
  caption,
  metrics,
}: {
  label?: string | null;
  caption: string;
  metrics: readonly CardMetric[];
}) {
  return (
    <span className="flex items-end justify-between gap-4">
      <span className="min-w-0">
        <span className="text-muted-foreground text-[10px] font-semibold tracking-[0.14em] uppercase">
          {caption}
        </span>
        <span className="text-foreground mt-1 block text-xl leading-none font-bold tabular-nums">
          {label ?? '—'}
        </span>
      </span>
      {metrics.length > 0 ? (
        <span className={METRIC_COL_CLASS}>
          {metrics.map((metric) => (
            <MetricRow key={metric.caption} {...metric} />
          ))}
        </span>
      ) : null}
    </span>
  );
}

type CardMetric = { caption: string; value: string; muted?: boolean };

function cardMetrics(input: {
  unitsLabel: string;
  unitsCaption: string;
  includedLabel?: string | null;
  includedCaption: string;
}): CardMetric[] {
  const rows: CardMetric[] = [
    {
      caption: input.unitsCaption,
      value: input.unitsLabel,
      muted: input.unitsLabel === UNIT_SUM_EMPTY,
    },
  ];
  if (input.includedLabel) {
    rows.push({ caption: input.includedCaption, value: input.includedLabel, muted: true });
  }
  return rows;
}

function MetricRow({ value, caption, muted }: CardMetric) {
  return (
    <span className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground text-[10px] font-semibold tracking-[0.14em] uppercase">
        {caption}
      </span>
      <span
        className={cn(
          'truncate text-xs font-medium tabular-nums',
          muted ? 'text-muted-foreground' : 'text-foreground',
        )}
      >
        {value}
      </span>
    </span>
  );
}
