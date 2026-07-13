'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { StatusBadge, type StatusVariant } from './StatusBadge';
import {
  NAVIGABLE_ENTITY_CARD_SOFT_ELEVATED_CLASS,
  PRODUCT_DETAIL_CARD_ICON_TILE_CLASS,
  PRODUCT_DETAIL_CARD_SECTION_DIVIDER_CLASS,
  PRODUCT_DETAIL_CARD_SHELL_CLASS,
  PRODUCT_DETAIL_CARD_STAT_CELL_CLASS,
  PRODUCT_DETAIL_CARD_STATS_SHELL_CLASS,
} from './navigable-entity-card.constants';
import { cn } from '@/lib/utils';

export type NavigableEntityCardBadge = {
  label: string;
  variant: StatusVariant;
};

export type NavigableEntityCardMetaLine = {
  icon?: LucideIcon;
  text: string;
};

export type NavigableEntityCardStat = {
  value: string | number;
  label: string;
};

export interface NavigableEntityCardProps {
  href: string;
  icon: LucideIcon;
  /** Small label above the title (e.g. product type). */
  eyebrow?: string;
  title: string;
  badges?: NavigableEntityCardBadge[];
  description?: string | null;
  metaLines?: NavigableEntityCardMetaLine[];
  /** Stats strip (Tasks / Ext. / Tickets). Takes precedence over `footer`. */
  stats?: NavigableEntityCardStat[];
  footer?: ReactNode;
  headerTrailing?: ReactNode;
  hoverActions?: ReactNode;
  className?: string;
}

/**
 * Hub-style card for entities with a dedicated detail route.
 * Click the body to navigate; optional footer tiles open linked sheets (sibling, not nested links).
 */
export function NavigableEntityCard({
  href,
  icon: Icon,
  eyebrow,
  title,
  badges,
  description,
  metaLines,
  stats,
  footer,
  headerTrailing,
  hoverActions,
  className,
}: NavigableEntityCardProps) {
  const hasMeta = Boolean(metaLines && metaLines.length > 0);
  const hasStats = Boolean(stats && stats.length > 0);
  const hasFooterContent = hasStats || Boolean(footer);
  const hasBadges = Boolean(badges && badges.length > 0);

  return (
    <div
      className={cn(
        PRODUCT_DETAIL_CARD_SHELL_CLASS,
        NAVIGABLE_ENTITY_CARD_SOFT_ELEVATED_CLASS,
        className,
      )}
    >
      <Link href={href} className="flex min-h-0 flex-1 flex-col p-5 focus-visible:outline-none">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className={PRODUCT_DETAIL_CARD_ICON_TILE_CLASS}>
              <Icon size={22} aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex min-h-4 min-w-0 items-center gap-2">
                {eyebrow ? (
                  <p className="text-muted-foreground min-w-0 flex-1 truncate text-xs leading-none">
                    {eyebrow}
                  </p>
                ) : (
                  <span className="min-w-0 flex-1" aria-hidden />
                )}
                {hasBadges
                  ? badges!.map((badge) => (
                      <StatusBadge
                        key={badge.label}
                        label={badge.label}
                        variant={badge.variant}
                        dot
                        className="ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                      />
                    ))
                  : null}
              </div>
              <h3 className="text-foreground line-clamp-2 min-h-[2.75rem] text-lg leading-snug font-bold tracking-tight">
                {title}
              </h3>
            </div>
          </div>
          {headerTrailing}
        </div>

        {description ? (
          <p className="text-muted-foreground mt-3 line-clamp-2 text-xs">{description}</p>
        ) : null}

        {hasMeta ? (
          <div
            className={cn(
              PRODUCT_DETAIL_CARD_SECTION_DIVIDER_CLASS,
              'mt-4 flex min-h-[3.25rem] flex-col justify-center gap-2.5 pt-4',
            )}
          >
            {metaLines!.map((line) => {
              const LineIcon = line.icon;
              return (
                <div
                  key={line.text}
                  className="text-muted-foreground flex min-w-0 items-center gap-2 text-sm"
                >
                  {LineIcon ? <LineIcon size={15} className="shrink-0" aria-hidden /> : null}
                  <span className="min-w-0 flex-1 truncate">{line.text}</span>
                </div>
              );
            })}
          </div>
        ) : null}

        {hasFooterContent ? <div className="min-h-4 flex-1" aria-hidden /> : null}

        {hasFooterContent ? (
          <div className={cn(PRODUCT_DETAIL_CARD_SECTION_DIVIDER_CLASS, 'pt-4')}>
            {hasStats ? (
              <div className={PRODUCT_DETAIL_CARD_STATS_SHELL_CLASS}>
                {stats!.map((stat) => (
                  <div key={stat.label} className={PRODUCT_DETAIL_CARD_STAT_CELL_CLASS}>
                    <span className="text-foreground text-base leading-none font-bold tabular-nums">
                      {stat.value}
                    </span>
                    <span className="text-muted-foreground text-[11px] leading-none">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground flex min-w-0 items-center justify-end text-[10px]">
                {footer}
              </div>
            )}
          </div>
        ) : null}
      </Link>

      {hoverActions ? <div className="px-5 pt-0 pb-5">{hoverActions}</div> : null}
    </div>
  );
}
