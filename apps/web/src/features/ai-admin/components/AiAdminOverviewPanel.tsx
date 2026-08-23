'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bot, Cable, Route } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { aiAdminApi } from '@/lib/api/ai-admin';
import { AI_ADMIN_BASE_PATH } from '../constants';
import { agentStateVariant } from '../status-badge-map';
import { AiAdminActivityList } from './AiAdminActivityList';

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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <OverviewCard
          href={`${AI_ADMIN_BASE_PATH}/external-agents`}
          icon={Bot}
          title="External Agents"
          value={`${data.externalAgents.active} active`}
          detail={`${data.externalAgents.total} total · ${data.externalAgents.revoked} revoked`}
        />
        <OverviewCard
          href={`${AI_ADMIN_BASE_PATH}/providers`}
          icon={Cable}
          title="Internal providers"
          value={`${data.providers.active} connected`}
          detail={`${data.providers.disabled} disabled · ${data.providers.revoked} revoked`}
        />
        <OverviewCard
          href={`${AI_ADMIN_BASE_PATH}/policies`}
          icon={Route}
          title="Model policies"
          value={`${data.modelPolicies.active} active`}
          detail={`${data.modelPolicies.total} total`}
        />
      </div>

      <section className="border-border bg-card rounded-xl border p-4">
        <h2 className="text-sm font-semibold">Needs attention</h2>
        {data.attention.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">
            No disabled, revoked, or expired agents or connections.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.attention.map((item) => (
              <li
                key={`${item.kind}-${item.id}`}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-sm">{item.name}</span>
                <StatusBadge label={item.reason} variant={agentStateVariant(item.reason)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-border bg-card rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Approvals</h2>
          <span className="text-muted-foreground text-xs">Foundation</span>
        </div>
        <EmptyState
          icon={Route}
          title="Approval queue is not enabled yet"
          description="Pending approvals will appear here when the approval runtime ships."
        />
      </section>

      <section className="border-border bg-card rounded-xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent activity</h2>
          <Link
            href={`${AI_ADMIN_BASE_PATH}/audit`}
            className="text-muted-foreground text-xs underline"
          >
            Open AI Audit
          </Link>
        </div>
        <AiAdminActivityList items={data.recentActivity} />
      </section>
    </div>
  );
}

function OverviewCard(props: {
  href: string;
  icon: typeof Bot;
  title: string;
  value: string;
  detail: string;
}) {
  const Icon = props.icon;
  return (
    <Link
      href={props.href}
      className="border-border bg-card hover:bg-muted/40 rounded-xl border p-4 transition-colors"
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon className="text-muted-foreground size-4" aria-hidden />
        <h2 className="text-sm font-semibold">{props.title}</h2>
      </div>
      <p className="text-foreground text-lg font-semibold">{props.value}</p>
      <p className="text-muted-foreground mt-1 text-xs">{props.detail}</p>
    </Link>
  );
}
