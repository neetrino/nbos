'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  getPriorityCardCode,
  resolvePriorityCardCount,
} from '../dashboard-desk-header';
import { priorityClass, type PriorityCard } from '../dashboard-control-registry';

export { MiniAnalytics } from './MiniAnalyticsPanel';

interface PriorityFeedProps {
  priorities: PriorityCard[];
}

export function PriorityFeed({ priorities }: PriorityFeedProps) {
  const t = useTranslations('dashboard');
  return (
    <div className="nbos-desk-surface p-4">
      <p className="nbos-desk-kicker">{t('priorityFeed.kicker')}</p>
      <div className="mt-2 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <h2 className="text-base font-semibold">{t('priorityFeed.title')}</h2>
      </div>
      {priorities.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">{t('priorityFeed.empty')}</p>
      ) : (
        <div className="mt-3 max-h-36 space-y-2 overflow-y-auto pr-1">
          {priorities.map((priority) => (
            <PriorityFeedItem key={`${priority.source}:${priority.title}`} priority={priority} />
          ))}
        </div>
      )}
    </div>
  );
}

function PriorityFeedItem({ priority }: { priority: PriorityCard }) {
  const t = useTranslations('dashboard');
  const code = getPriorityCardCode(priority);
  const count = resolvePriorityCardCount(priority);
  const title =
    code !== null
      ? t(`priorityFeed.cards.${code}.title`, { count })
      : priority.title;
  const context =
    code !== null ? t(`priorityFeed.cards.${code}.context`) : priority.context;

  return (
    <Link
      href={priority.href}
      className={`block rounded-xl border px-3 py-2 transition-colors hover:brightness-95 ${priorityClass(
        priority.severity,
      )}`}
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-0.5 text-xs leading-5 opacity-80">{context}</p>
    </Link>
  );
}
