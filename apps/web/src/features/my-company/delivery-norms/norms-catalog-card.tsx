'use client';

import type { ReactNode } from 'react';
import { KanbanCardShell } from '@/components/shared';
import { cn } from '@/lib/utils';
import { UNIT_SUM_EMPTY } from './format-unit-sum';
import { NormativeStatusBadge } from './normative-status-badge';

const CARD_BUTTON_CLASS = [
  'flex h-full w-full min-w-0 flex-col gap-3 p-3.5 text-left',
  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
].join(' ');

export function NormsCatalogCard({
  title,
  description,
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
  description?: string;
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
      className={cn('h-full min-w-0', !canOpen && 'opacity-70')}
    >
      <button
        type="button"
        disabled={!canOpen}
        className={cn(CARD_BUTTON_CLASS, !canOpen && 'hover:bg-card cursor-default')}
        onClick={onOpen}
      >
        <CardHeader
          title={title}
          description={description}
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
  description,
  icon,
  status,
  statusLabel,
  badge,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  status: string | null;
  statusLabel: string | null;
  badge?: ReactNode;
}) {
  return (
    <span className="flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-2.5">
        {icon}
        <span className="min-w-0">
          <span className="text-foreground line-clamp-2 text-sm leading-snug font-semibold">
            {title}
          </span>
          {description ? (
            <span className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-snug">
              {description}
            </span>
          ) : null}
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
  const tiles = [{ caption, value: label ?? '—' }, ...metrics];
  return (
    <span className={cn('grid gap-2', tiles.length > 2 ? 'grid-cols-3' : 'grid-cols-2')}>
      {tiles.map((tile) => (
        <MetricTile key={tile.caption} {...tile} />
      ))}
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

function MetricTile({ value, caption, muted }: CardMetric) {
  return (
    <span className="bg-background flex min-w-0 flex-col rounded-xl px-2.5 py-2">
      <span className="text-muted-foreground text-[10px] font-semibold tracking-[0.12em] uppercase">
        {caption}
      </span>
      <span
        className={cn(
          'mt-1 truncate text-base leading-none font-semibold tabular-nums',
          muted ? 'text-muted-foreground' : 'text-foreground',
        )}
      >
        {value}
      </span>
    </span>
  );
}
