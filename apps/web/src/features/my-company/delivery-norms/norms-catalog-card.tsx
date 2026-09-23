'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CatalogFunctionIcon } from '@/features/function-catalog/catalog-icon';
import { CATALOG_ICON_COMPACT_SIZE_PX } from '@/features/function-catalog/function-catalog.constants';
import { UNIT_SUM_EMPTY } from './format-unit-sum';
import { NormativeStatusBadge } from './normative-status-badge';

const CARD_CLASS =
  'border-border bg-card hover:bg-muted/40 flex h-full w-full gap-2 rounded-xl border p-2.5 text-left transition-colors';

export function NormsCatalogCard({
  title,
  unitsLabel,
  salePriceLabel,
  includedLabel,
  status,
  statusLabel,
  iconKey,
  canOpen,
  onOpen,
  publish,
}: {
  title: string;
  unitsLabel: string;
  salePriceLabel?: string | null;
  includedLabel?: string | null;
  status: string | null;
  statusLabel: string | null;
  iconKey?: string;
  canOpen: boolean;
  onOpen: () => void;
  publish?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <button
        type="button"
        disabled={!canOpen}
        className={cn(CARD_CLASS, !canOpen && 'hover:bg-card cursor-default opacity-70')}
        onClick={onOpen}
      >
        {iconKey ? <CardIcon iconKey={iconKey} /> : null}
        <CardBody
          title={title}
          unitsLabel={unitsLabel}
          salePriceLabel={salePriceLabel}
          includedLabel={includedLabel}
          status={status}
          statusLabel={statusLabel}
        />
      </button>
      {publish}
    </div>
  );
}

function CardIcon({ iconKey }: { iconKey: string }) {
  return (
    <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md">
      <CatalogFunctionIcon iconKey={iconKey} size={CATALOG_ICON_COMPACT_SIZE_PX} />
    </span>
  );
}

function CardBody({
  title,
  unitsLabel,
  salePriceLabel,
  includedLabel,
  status,
  statusLabel,
}: {
  title: string;
  unitsLabel: string;
  salePriceLabel?: string | null;
  includedLabel?: string | null;
  status: string | null;
  statusLabel: string | null;
}) {
  const empty = unitsLabel === UNIT_SUM_EMPTY;
  return (
    <span className="flex min-w-0 flex-1 items-start justify-between gap-2">
      <span className="text-foreground line-clamp-2 min-h-10 text-sm font-semibold">{title}</span>
      <span className="flex shrink-0 flex-col items-end gap-0.5">
        {status && statusLabel ? (
          <NormativeStatusBadge status={status} label={statusLabel} />
        ) : null}
        {salePriceLabel ? (
          <span className="text-foreground text-xs font-medium tabular-nums">{salePriceLabel}</span>
        ) : null}
        <span
          className={cn(
            'text-xs tabular-nums',
            empty ? 'text-muted-foreground' : 'text-foreground font-medium',
          )}
        >
          {unitsLabel}
        </span>
        {includedLabel ? (
          <span className="text-muted-foreground text-xs">{includedLabel}</span>
        ) : null}
      </span>
    </span>
  );
}
