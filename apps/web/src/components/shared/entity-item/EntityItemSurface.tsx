'use client';

import type { LucideIcon } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { cn } from '@/lib/utils';
import {
  ENTITY_ITEM_LEADING_ICON_WRAP_CLASS,
  ENTITY_ITEM_METRIC_CLASS,
  ENTITY_ITEM_SUBTITLE_CLASS,
  ENTITY_ITEM_TITLE_CLASS,
  ENTITY_ITEM_TRAILING_CLASS,
  entityItemSurfaceVariantClass,
} from './entity-item-classes';
import type { EntityItemSummary, EntityItemVariant } from './entity-item.types';

export interface EntityItemSurfaceProps {
  item: EntityItemSummary;
  variant?: EntityItemVariant;
  onOpen: (item: EntityItemSummary) => void;
  className?: string;
}

export function EntityItemSurface({
  item,
  variant = 'list-row',
  onOpen,
  className,
}: EntityItemSurfaceProps) {
  const LeadingIcon = item.leadingIcon;

  if (variant === 'compact-card') {
    return (
      <button
        type="button"
        onClick={() => onOpen(item)}
        className={cn(entityItemSurfaceVariantClass('compact-card'), className)}
      >
        <EntityItemCompactCardBody item={item} LeadingIcon={LeadingIcon} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={cn(entityItemSurfaceVariantClass('list-row'), className)}
    >
      {LeadingIcon ? (
        <span className={ENTITY_ITEM_LEADING_ICON_WRAP_CLASS}>
          <LeadingIcon size={16} aria-hidden />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className={ENTITY_ITEM_TITLE_CLASS} title={item.title}>
          {item.title}
        </p>
        {item.subtitle ? <p className={ENTITY_ITEM_SUBTITLE_CLASS}>{item.subtitle}</p> : null}
        {item.meta && item.meta.length > 0 ? (
          <EntityItemMetaRow meta={item.meta} className="mt-1.5" />
        ) : null}
      </div>
      <EntityItemTrailing item={item} />
    </button>
  );
}

function EntityItemCompactCardBody({
  item,
  LeadingIcon,
}: {
  item: EntityItemSummary;
  LeadingIcon?: LucideIcon;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {LeadingIcon ? (
            <span className={ENTITY_ITEM_LEADING_ICON_WRAP_CLASS}>
              <LeadingIcon size={16} aria-hidden />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-foreground line-clamp-2 text-sm leading-snug font-semibold">
              {item.title}
            </p>
            {item.subtitle ? <p className={ENTITY_ITEM_SUBTITLE_CLASS}>{item.subtitle}</p> : null}
          </div>
        </div>
        {item.status ? (
          <StatusBadge
            label={item.status.label}
            variant={item.status.variant}
            className="shrink-0 text-[10px]"
          />
        ) : null}
      </div>
      {item.primaryMetric ? (
        <p className={cn(ENTITY_ITEM_METRIC_CLASS, 'mt-2 text-base')}>{item.primaryMetric}</p>
      ) : null}
      {item.meta && item.meta.length > 0 ? (
        <EntityItemMetaRow meta={item.meta} className="mt-2" />
      ) : null}
      {item.trailing ? (
        <p className={cn(ENTITY_ITEM_TRAILING_CLASS, 'mt-2')}>{item.trailing}</p>
      ) : null}
    </>
  );
}

function EntityItemTrailing({ item }: { item: EntityItemSummary }) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      {item.status ? (
        <StatusBadge
          label={item.status.label}
          variant={item.status.variant}
          className="text-[10px]"
        />
      ) : null}
      {item.primaryMetric ? (
        <span className={ENTITY_ITEM_METRIC_CLASS}>{item.primaryMetric}</span>
      ) : null}
      {item.trailing ? <span className={ENTITY_ITEM_TRAILING_CLASS}>{item.trailing}</span> : null}
    </div>
  );
}

function EntityItemMetaRow({
  meta,
  className,
}: {
  meta: NonNullable<EntityItemSummary['meta']>;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {meta.map((chip, index) => {
        const ChipIcon = chip.icon;
        return (
          <span
            key={`${chip.text}-${index}`}
            className="bg-muted text-muted-foreground inline-flex max-w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-[10px]"
            title={chip.text}
          >
            {ChipIcon ? <ChipIcon size={9} className="shrink-0" aria-hidden /> : null}
            <span className="min-w-0 truncate">{chip.text}</span>
          </span>
        );
      })}
    </div>
  );
}
