'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { ErrorState, ListPagination, LoadingState } from '@/components/shared';
import { aiAdminApi } from '@/lib/api/ai-admin';
import { EMPTY_ACTIVITY_META } from '../activity';
import { AI_ADMIN_ACTIVITY_PAGE_SIZE } from '../constants';
import { AiAdminActivityList } from './AiAdminActivityList';
import { AiAdminSection } from './AiAdminSection';

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
    <AiAdminSection
      icon={History}
      title="Activity"
      summary={activity.isLoading ? undefined : `${meta.total} events`}
      collapsible
      defaultOpen={false}
    >
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
    </AiAdminSection>
  );
}
