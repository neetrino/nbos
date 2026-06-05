'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { StatusBadge, type StatusVariant } from './StatusBadge';
import { NAVIGABLE_ENTITY_CARD_ELEVATED_CLASS } from './navigable-entity-card.constants';
import { cn } from '@/lib/utils';

export type NavigableEntityCardBadge = {
  label: string;
  variant: StatusVariant;
};

export type NavigableEntityCardMetaLine = {
  icon?: LucideIcon;
  text: string;
};

export interface NavigableEntityCardProps {
  href: string;
  icon: LucideIcon;
  /** Small label above the title (e.g. project code). */
  eyebrow?: string;
  title: string;
  badges?: NavigableEntityCardBadge[];
  description?: string | null;
  metaLines?: NavigableEntityCardMetaLine[];
  footer?: ReactNode;
  headerTrailing?: ReactNode;
  hoverActions?: ReactNode;
  className?: string;
}

/**
 * Hub-style card for entities with a dedicated detail route.
 * Click the body to navigate; optional hover tiles open linked sheets (sibling, not nested links).
 */
export function NavigableEntityCard({
  href,
  icon: Icon,
  eyebrow,
  title,
  badges,
  description,
  metaLines,
  footer,
  headerTrailing,
  hoverActions,
  className,
}: NavigableEntityCardProps) {
  return (
    <div
      className={cn(
        'group/entity-card border-border bg-card hover:border-accent/40 flex h-full flex-col rounded-2xl border',
        NAVIGABLE_ENTITY_CARD_ELEVATED_CLASS,
        className,
      )}
    >
      <Link href={href} className="flex min-h-0 flex-1 flex-col p-5 focus-visible:outline-none">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="bg-accent/10 text-accent shrink-0 rounded-xl p-2.5">
              <Icon size={18} aria-hidden />
            </div>
            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-muted-foreground text-[10px] font-medium">{eyebrow}</p>
              ) : null}
              <h3 className="text-foreground line-clamp-2 text-sm font-semibold">{title}</h3>
              {badges && badges.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <StatusBadge key={badge.label} label={badge.label} variant={badge.variant} />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          {headerTrailing}
        </div>

        {description ? (
          <p className="text-muted-foreground mt-3 line-clamp-2 text-xs">{description}</p>
        ) : null}

        {metaLines && metaLines.length > 0 ? (
          <div className="mt-4 space-y-2">
            {metaLines.map((line) => {
              const LineIcon = line.icon;
              return (
                <div
                  key={line.text}
                  className="text-muted-foreground flex items-center gap-1.5 text-xs"
                >
                  {LineIcon ? <LineIcon size={11} aria-hidden /> : null}
                  <span className="truncate">{line.text}</span>
                </div>
              );
            })}
          </div>
        ) : null}

        {footer ? (
          <div className="text-muted-foreground mt-4 flex min-w-0 items-center justify-end text-[10px]">
            {footer}
          </div>
        ) : null}
      </Link>

      {hoverActions ? <div className="px-5 pt-0 pb-5">{hoverActions}</div> : null}
    </div>
  );
}
