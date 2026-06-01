'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ExternalLink } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import {
  ENTITY_ITEM_LEADING_ICON_WRAP_CLASS,
  ENTITY_ITEM_METRIC_CLASS,
  ENTITY_ITEM_SUBTITLE_CLASS,
  ENTITY_ITEM_TITLE_CLASS,
  entityItemSurfaceVariantClass,
} from '@/components/shared/entity-item/entity-item-classes';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { cn } from '@/lib/utils';

export type ClientServiceLinkedRecordRow = {
  id: string;
  href: string;
  title: string;
  subtitle?: string;
  statusLabel?: string;
  metric?: string;
  leadingIcon?: LucideIcon;
};

interface ClientServiceLinkedRecordListProps {
  items: ClientServiceLinkedRecordRow[];
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
}

/** Finance link rows styled like entity tab list rows (opens in Finance routes). */
export function ClientServiceLinkedRecordList({
  items,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDescription,
}: ClientServiceLinkedRecordListProps) {
  if (items.length === 0) {
    return <EmptyState icon={EmptyIcon} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const LeadingIcon = item.leadingIcon;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(entityItemSurfaceVariantClass('list-row'), 'group')}
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
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {item.statusLabel ? <StatusBadge label={item.statusLabel} variant="gray" /> : null}
              {item.metric ? <span className={ENTITY_ITEM_METRIC_CLASS}>{item.metric}</span> : null}
              <ExternalLink
                size={14}
                className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70"
                aria-hidden
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
