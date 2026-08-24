'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BotMessageSquare, Cable, History, Route, ShieldCheck } from 'lucide-react';
import { ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { aiAdminApi } from '@/lib/api/ai-admin';
import { asActivityItems } from '../activity';
import {
  AI_ADMIN_KPI_GRID_CLASS,
  AI_ADMIN_OVERVIEW_SECONDARY_CLASS,
  AI_ADMIN_PAGE_STACK_CLASS,
} from '../ai-admin-ui.constants';
import { AI_ADMIN_BASE_PATH } from '../constants';
import { agentStateVariant } from '../status-badge-map';
import { AiAdminActivityList } from './AiAdminActivityList';
import { AiAdminKpiTile } from './AiAdminKpiTile';
import { AiAdminSection } from './AiAdminSection';

export function AiAdminOverviewPanel() {
  const query = useQuery({
    queryKey: ['ai-admin', 'overview'],
    queryFn: () => aiAdminApi.overview(),
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) {
    return (
      <ErrorState
        description="AI overview could not be loaded."
        onRetry={() => void query.refetch()}
      />
    );
  }
  const data = query.data;
  const activityItems = asActivityItems(data.recentActivity);

  return (
    <div className={AI_ADMIN_PAGE_STACK_CLASS}>
      <div className={AI_ADMIN_KPI_GRID_CLASS}>
        <AiAdminKpiTile
          href={`${AI_ADMIN_BASE_PATH}/external-agents`}
          icon={BotMessageSquare}
          title="External Agents"
          value={`${data.externalAgents.active} active`}
          detail={`${data.externalAgents.total} total · ${data.externalAgents.revoked} revoked`}
        />
        <AiAdminKpiTile
          href={`${AI_ADMIN_BASE_PATH}/providers`}
          icon={Cable}
          title="Internal providers"
          value={`${data.providers.active} connected`}
          detail={`${data.providers.disabled} disabled · ${data.providers.revoked} revoked`}
        />
        <AiAdminKpiTile
          href={`${AI_ADMIN_BASE_PATH}/policies`}
          icon={Route}
          title="Model policies"
          value={`${data.modelPolicies.active} active`}
          detail={`${data.modelPolicies.total} total`}
        />
      </div>

      <div className={AI_ADMIN_OVERVIEW_SECONDARY_CLASS}>
        <AiAdminSection
          icon={AlertTriangle}
          title="Needs attention"
          summary={data.attention.length === 0 ? 'All clear' : `${data.attention.length}`}
          collapsible
          defaultOpen={data.attention.length > 0}
        >
          {data.attention.length === 0 ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              No disabled, revoked, or expired agents or connections.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.attention.map((item) => (
                <li
                  key={`${item.kind}-${item.id}`}
                  className="bg-muted/40 flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                >
                  <span className="flex min-w-0 items-center gap-2 text-sm">
                    <AlertTriangle className="size-3.5 shrink-0 text-amber-600" aria-hidden />
                    <span className="truncate font-medium">{item.name}</span>
                  </span>
                  <StatusBadge label={item.reason} variant={agentStateVariant(item.reason)} />
                </li>
              ))}
            </ul>
          )}
        </AiAdminSection>

        <AiAdminSection
          icon={ShieldCheck}
          title="Approvals"
          summary="Foundation"
          collapsible
          defaultOpen={false}
        >
          <p className="text-muted-foreground text-sm leading-relaxed">
            Pending approvals will appear here when the approval runtime ships.
          </p>
        </AiAdminSection>
      </div>

      <AiAdminSection
        icon={History}
        title="Recent activity"
        summary={`${activityItems.length} events`}
        collapsible
        defaultOpen={activityItems.length > 0}
        actions={
          <Link
            href={`${AI_ADMIN_BASE_PATH}/audit`}
            className="text-muted-foreground hover:text-foreground text-xs font-medium underline-offset-4 hover:underline"
          >
            Open AI Audit
          </Link>
        }
      >
        <AiAdminActivityList items={data.recentActivity} />
      </AiAdminSection>
    </div>
  );
}
