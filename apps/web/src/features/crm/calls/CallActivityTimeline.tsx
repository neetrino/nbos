'use client';

import { Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CallActivityItem } from './CallActivityItem';
import { groupCallActivitiesByDay } from './group-call-activities';
import { useCallActivities, type CallActivityScope } from './use-call-activities';

export function CallActivityTimeline(props: {
  scope: CallActivityScope;
  emptyTitle?: string;
  emptyDescription: string;
}) {
  const t = useTranslations('crm');
  const { items, loading, errorKey } = useCallActivities(props.scope);

  if (loading) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {t('calls.loadingActivities')}
      </p>
    );
  }

  if (errorKey) {
    return <p className="text-destructive py-8 text-center text-sm">{t(errorKey as never)}</p>;
  }

  if (items.length === 0) {
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

  const groups = groupCallActivitiesByDay(items);

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
                <CallActivityItem call={call} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
