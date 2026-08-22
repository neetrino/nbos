'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ErrorState, ListPagination, LoadingState } from '@/components/shared';
import { aiAdminApi } from '@/lib/api/ai-admin';
import { EMPTY_ACTIVITY_META } from '../activity';
import { AI_ADMIN_ACTIVITY_PAGE_SIZE } from '../constants';
import { AiAdminActivityList } from './AiAdminActivityList';

export function ExternalAgentActivitySection({ agentId }: { agentId: string }) {
  const [page, setPage] = useState(1);
  const activity = useQuery({
    queryKey: ['ai-admin', 'external-agent-activity', agentId, page],
    queryFn: () =>
      aiAdminApi.getExternalAgentActivity(agentId, {
        page,
        pageSize: AI_ADMIN_ACTIVITY_PAGE_SIZE,
      }),
  });
  const items = activity.data?.items ?? [];
  const meta = activity.data?.meta ?? { ...EMPTY_ACTIVITY_META, page };

  return (
    <section className="border-border bg-card rounded-xl border p-4">
      <h2 className="mb-3 text-sm font-semibold">Activity</h2>
      {activity.isLoading && items.length === 0 ? (
        <LoadingState count={3} />
      ) : activity.isError ? (
        <ErrorState
          description="Agent activity could not be loaded."
          onRetry={() => void activity.refetch()}
        />
      ) : (
        <>
          <AiAdminActivityList items={items} />
          <ListPagination meta={meta} onPageChange={setPage} />
        </>
      )}
    </section>
  );
}
