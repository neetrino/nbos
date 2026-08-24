'use client';

import {
  Building2,
  CalendarDays,
  FileInput,
  Hash,
  Loader2,
  MapPin,
  Scale,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PORTAL_DROPDOWN_Z_CLASS } from '@/lib/overlay-z-index';
import { cn } from '@/lib/utils';
import type { ArmeniaCompanyLookupItem } from '@/lib/api/clients';

const MATCH_OVERLAY_MAX_HEIGHT_CLASS = 'max-h-72';
const MATCH_META_ICON_SIZE = 12;

const MATCH_OVERLAY_PANEL_CLASS = cn(
  PORTAL_DROPDOWN_Z_CLASS,
  'border-border/40 bg-card/50 absolute top-full left-0 mt-1 w-full overflow-y-auto rounded-xl border shadow-lg backdrop-blur-xl',
  'animate-in fade-in-0 zoom-in-95 duration-150',
);

export function CompanyLookupMatchList({
  items,
  disabled,
  onFill,
}: {
  items: ArmeniaCompanyLookupItem[];
  disabled?: boolean;
  onFill: (item: ArmeniaCompanyLookupItem) => void;
}) {
  return (
    <div
      role="listbox"
      aria-label="Armenian registry matches"
      className={cn(MATCH_OVERLAY_PANEL_CLASS, MATCH_OVERLAY_MAX_HEIGHT_CLASS)}
    >
      <ul className="divide-border/60 divide-y">
        {items.map((item) => (
          <CompanyLookupMatchRow key={item.tin} item={item} disabled={disabled} onFill={onFill} />
        ))}
      </ul>
    </div>
  );
}

export function CompanyLookupLoadingPanel() {
  return (
    <div role="status" aria-live="polite" className={cn(MATCH_OVERLAY_PANEL_CLASS, 'px-3 py-2.5')}>
      <div className="flex items-center gap-3">
        <span className="bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Loader2 size={16} className="animate-spin" />
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-foreground text-sm font-medium">Searching registry…</p>
          <div className="flex items-center gap-1" aria-hidden>
            <span className="bg-primary nbos-animate-pulse-soft size-1.5 rounded-full" />
            <span className="bg-primary/70 nbos-animate-pulse-soft size-1.5 rounded-full [animation-delay:200ms]" />
            <span className="bg-primary/40 nbos-animate-pulse-soft size-1.5 rounded-full [animation-delay:400ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanyLookupMatchRow({
  item,
  disabled,
  onFill,
}: {
  item: ArmeniaCompanyLookupItem;
  disabled?: boolean;
  onFill: (item: ArmeniaCompanyLookupItem) => void;
}) {
  return (
    <li className="flex flex-col gap-2.5 px-3.5 py-3">
      <div className="flex items-start gap-2.5">
        <Building2 size={18} className="text-muted-foreground mt-0.5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-foreground text-base leading-snug font-semibold">{item.name}</p>
          <CompanyLookupMatchMeta item={item} />
          <CompanyLookupMatchSecondary item={item} />
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        disabled={disabled}
        aria-label={`Fill empty fields from ${item.name}`}
        className="w-full rounded-lg"
        onClick={() => onFill(item)}
      >
        <FileInput size={14} aria-hidden />
        Fill empty fields
      </Button>
    </li>
  );
}

function CompanyLookupMatchMeta({ item }: { item: ArmeniaCompanyLookupItem }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="text-foreground/80 inline-flex min-w-0 items-center gap-1 text-sm">
        <Hash size={MATCH_META_ICON_SIZE} className="shrink-0" aria-hidden />
        <span className="truncate tabular-nums">{item.tin}</span>
      </span>
      <StatusBadge
        label={item.status ?? (item.isActive ? 'Active' : 'Inactive')}
        variant={item.isActive ? 'green' : 'amber'}
      />
    </div>
  );
}

function CompanyLookupMatchSecondary({ item }: { item: ArmeniaCompanyLookupItem }) {
  const hasFacts = Boolean(item.legalForm || item.registeredAddress);
  const hasExtras = Boolean(item.registrationDate || item.activityCode);
  if (!hasFacts && !hasExtras) return null;

  return (
    <div className="text-muted-foreground/80 space-y-0.5 text-[11px] leading-snug">
      {item.legalForm ? (
        <p className="flex min-w-0 items-start gap-1.5">
          <Scale size={MATCH_META_ICON_SIZE} className="mt-0.5 shrink-0" aria-hidden />
          <span className="line-clamp-2">{item.legalForm}</span>
        </p>
      ) : null}
      {item.registeredAddress ? (
        <p className="flex min-w-0 items-start gap-1.5">
          <MapPin size={MATCH_META_ICON_SIZE} className="mt-0.5 shrink-0" aria-hidden />
          <span className="line-clamp-2">{item.registeredAddress}</span>
        </p>
      ) : null}
      {hasExtras ? <CompanyLookupMatchExtras item={item} /> : null}
    </div>
  );
}

function CompanyLookupMatchExtras({ item }: { item: ArmeniaCompanyLookupItem }) {
  return (
    <p className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5">
      {item.registrationDate ? (
        <span className="inline-flex min-w-0 items-center gap-1.5 tabular-nums">
          <CalendarDays size={MATCH_META_ICON_SIZE} className="shrink-0" aria-hidden />
          <span className="truncate">{item.registrationDate}</span>
        </span>
      ) : null}
      {item.activityCode ? (
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Tag size={MATCH_META_ICON_SIZE} className="shrink-0" aria-hidden />
          <span className="truncate">{item.activityCode}</span>
        </span>
      ) : null}
    </p>
  );
}
