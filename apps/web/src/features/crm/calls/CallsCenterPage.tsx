'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PermissionGate, usePermission } from '@/lib/permissions';
import { CallActivityFeed } from './CallActivityTimeline';
import { useWorkspaceCallActivities } from './use-workspace-call-activities';

export function CallsCenterPage() {
  const t = useTranslations('crm');
  return (
    <PermissionGate
      module="CALLS"
      action="VIEW"
      fallback={
        <p className="text-muted-foreground py-16 text-center text-sm">
          {t('calls.centerNoPermission')}
        </p>
      }
    >
      <CallsCenterJournal />
    </PermissionGate>
  );
}

function CallsCenterJournal() {
  const t = useTranslations('crm');
  const { isLoading } = usePermission();
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const { items, total, loading, errorKey, hasMore, loadMore, loadingMore } =
    useWorkspaceCallActivities();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        {total == null ? t('calls.centerDescription') : t('calls.centerCount', { count: total })}
      </p>
      <div ref={setScrollRoot} className="min-h-0 flex-1 overflow-y-auto pr-1">
        <CallActivityFeed
          items={items}
          loading={isLoading || loading}
          errorKey={errorKey}
          variant="center"
          emptyTitle={t('calls.centerEmptyTitle')}
          emptyDescription={t('calls.centerEmptyDescription')}
          hasMore={hasMore}
          onLoadMore={loadMore}
          loadingMore={loadingMore}
          scrollRoot={scrollRoot}
        />
      </div>
    </div>
  );
}
