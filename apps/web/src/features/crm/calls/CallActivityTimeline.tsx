'use client';

import { Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { InfiniteScrollSentinel } from '@/components/shared/InfiniteScrollSentinel';
import { CallActivityItem } from './CallActivityItem';
import { groupCallActivitiesByDay } from './group-call-activities';
import { useCallActivities, type CallActivityScope } from './use-call-activities';
import type { CallActivity } from '@/lib/api/calls';

export function CallActivityTimeline(props: {
  scope: CallActivityScope;
  emptyTitle?: string;
  emptyDescription: string;
}) {
  const { items, loading, errorKey } = useCallActivities(props.scope);
  return (
    <CallActivityFeed
      items={items}
      loading={loading}
      errorKey={errorKey}
      emptyTitle={props.emptyTitle}
      emptyDescription={props.emptyDescription}
    />
  );
}

export function CallActivityFeed(props: {
  items: CallActivity[];
  loading: boolean;
  errorKey: string | null;
  variant?: 'entity' | 'center';
  emptyTitle?: string;
  emptyDescription: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}) {
  const t = useTranslations('crm');

  if (props.loading) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {t('calls.loadingActivities')}
      </p>
    );
  }

  if (props.errorKey) {
    return (
      <p className="text-destructive py-8 text-center text-sm">{t(props.errorKey as never)}</p>
    );
  }

  if (props.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-muted mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
          <Phone size={24} className="text-stone-400" />
        </div>
        <h3 className="text-foreground mb-1.5 text-sm font-semibold">
          {props.emptyTitle ?? t('calls.noActivities')}
        </h3>
        <p className="text-muted-foreground max-w-[280px] text-xs leading-relaxed">
          {props.emptyDescription}
        </p>
      </div>
    );
  }

  const groups = groupCallActivitiesByDay(props.items);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.day} className="space-y-3">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {group.day}
          </h3>
          <ul className="space-y-3">
            {group.items.map((call) => (
              <li key={call.id}>
                <CallActivityItem call={call} variant={props.variant} />
              </li>
            ))}
          </ul>
        </section>
      ))}
      {props.onLoadMore ? (
        <InfiniteScrollSentinel onReach={props.onLoadMore} disabled={!props.hasMore} />
      ) : null}
      {props.loadingMore ? (
        <p className="text-muted-foreground py-4 text-center text-sm">{t('calls.loadingMore')}</p>
      ) : null}
    </div>
  );
}
