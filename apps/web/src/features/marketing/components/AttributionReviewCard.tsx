'use client';

import { Handshake, User } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import type { StatusVariant } from '@/components/shared/StatusBadge';
import { getDealStage } from '@/features/crm/constants/dealPipeline';
import { getLeadStage } from '@/features/crm/constants/leadPipeline';
import {
  getDealDisplayTitle,
  getLeadDisplayTitle,
} from '@/features/crm/utils/crm-entity-display';
import { resolveAttributionStatusLabel } from '@/features/marketing/constants/marketing-attribution-filters';
import type { Deal } from '@/lib/api/deals';
import type { Lead } from '@/lib/api/leads';
import { cn } from '@/lib/utils';

const CARD_SURFACE_CLASS =
  'border-border/70 bg-card hover:border-primary/30 focus-visible:ring-ring rounded-2xl border p-5 text-left shadow-sm transition-[border-color,box-shadow,background-color] hover:shadow-md focus-visible:ring-2 focus-visible:outline-none';

const TITLE_ACCENT_CLASS = {
  Lead: 'bg-sky-500',
  Deal: 'bg-violet-500',
} as const;

type AttributionReviewCardProps = {
  item: Lead | Deal;
  kind: 'Lead' | 'Deal';
  issueDescription: string;
  onOpen: (item: Lead | Deal) => void;
};

function isLead(item: Lead | Deal, kind: 'Lead' | 'Deal'): item is Lead {
  return kind === 'Lead';
}

function resolveStatusVariant(kind: 'Lead' | 'Deal', status: string): StatusVariant {
  if (kind === 'Lead') return getLeadStage(status)?.variant ?? 'blue';
  return getDealStage(status)?.variant ?? 'blue';
}

export function AttributionReviewCard({
  item,
  kind,
  issueDescription,
  onOpen,
}: AttributionReviewCardProps) {
  const title = isLead(item, kind)
    ? getLeadDisplayTitle(item)
    : getDealDisplayTitle(item);
  const MetaIcon = kind === 'Lead' ? User : Handshake;
  const statusLabel = resolveAttributionStatusLabel(item.status);
  const statusVariant = resolveStatusVariant(kind, item.status);

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={CARD_SURFACE_CLASS}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className={cn('mt-0.5 h-5 w-1 shrink-0 rounded-full', TITLE_ACCENT_CLASS[kind])}
            aria-hidden
          />
          <p className="text-foreground truncate text-sm font-semibold">{title}</p>
        </div>
        <StatusBadge
          label={statusLabel}
          variant={statusVariant}
          dot
          className="rounded-full"
        />
      </div>

      <div className="text-muted-foreground mt-3 flex min-w-0 items-center gap-1.5 text-xs">
        <MetaIcon className="size-3.5 shrink-0" aria-hidden />
        <p className="truncate">
          {kind} · {item.code} · {item.source ?? 'Missing source'}
        </p>
      </div>

      <p className="text-muted-foreground mt-3 text-sm leading-snug">{issueDescription}</p>
    </button>
  );
}
