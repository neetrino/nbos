'use client';

import { useCallback, useEffect, useReducer, useState } from 'react';
import Link from 'next/link';
import { Bot, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { aiAdminApi, type ExternalAgentBundle } from '@/lib/api/ai-admin';
import { AI_ADMIN_BASE_PATH } from '../constants';
import { isCurrentGrant } from '../grant-current';
import { formatTimestamp } from '../format';
import {
  initialSecretHostState,
  isCreateHostMounted,
  reduceSecretHost,
} from '../one-time-secret-host';
import { agentStateVariant } from '../status-badge-map';
import { ExternalAgentCreateDialog } from './ExternalAgentCreateDialog';

export function ExternalAgentListPanel() {
  const [rows, setRows] = useState<ExternalAgentBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [host, dispatch] = useReducer(reduceSecretHost, undefined, initialSecretHostState);

  const load = useCallback(async () => {
    dispatch({ type: 'PARENT_REFRESH_START' });
    setLoading(true);
    try {
      setRows(await aiAdminApi.listExternalAgents());
      setError(null);
    } catch {
      setError('External Agents could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const keepHost = isCreateHostMounted(host);
  const showInitialLoad = loading && rows.length === 0 && !keepHost;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => dispatch({ type: 'OPEN_CREATE' })}>
          <Plus className="size-4" aria-hidden />
          Create External Agent
        </Button>
      </div>
      {showInitialLoad ? <LoadingState /> : null}
      {error && !keepHost ? <ErrorState description={error} onRetry={() => void load()} /> : null}
      {!showInitialLoad && !error && rows.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No External Agents"
          description="Create a machine client, grant Work Space scopes, then issue a one-time token."
          action={
            <Button type="button" onClick={() => dispatch({ type: 'OPEN_CREATE' })}>
              Create External Agent
            </Button>
          }
        />
      ) : null}
      {!showInitialLoad && rows.length > 0 ? (
        <div className="space-y-3">
          {rows.map((row) => (
            <AgentRow key={row.agent.id} row={row} />
          ))}
        </div>
      ) : null}
      <ExternalAgentCreateDialog
        open={host.createOpen}
        onOpenChange={(open) => {
          if (open) dispatch({ type: 'OPEN_CREATE' });
          else dispatch({ type: 'CANCEL_CREATE' });
        }}
        onCreated={() => void load()}
        onIssued={(agentId, token) => dispatch({ type: 'CREATE_WITH_TOKEN', agentId, token })}
        onSecretClosed={() => dispatch({ type: 'CLOSE_SECRET' })}
      />
    </div>
  );
}

function AgentRow({ row }: { row: ExternalAgentBundle }) {
  const activeCaps = row.capabilities.filter((item) => isCurrentGrant(item));
  const activeScopes = row.scopes.filter((item) => isCurrentGrant(item));
  const latestCred = row.credentials[0];
  return (
    <Link
      href={`${AI_ADMIN_BASE_PATH}/external-agents/${row.agent.id}`}
      className="border-border bg-card hover:bg-muted/40 block rounded-xl border p-4 transition-colors"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{row.agent.name}</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            {row.agent.description || 'No purpose recorded'}
          </p>
        </div>
        <StatusBadge label={row.agent.state} variant={agentStateVariant(row.agent.state)} />
      </div>
      <dl className="text-muted-foreground mt-3 grid gap-2 text-xs sm:grid-cols-3">
        <div>
          <dt className="font-medium">Capabilities</dt>
          <dd>{activeCaps.length} granted</dd>
        </div>
        <div>
          <dt className="font-medium">Work Spaces</dt>
          <dd>{activeScopes.filter((item) => item.scopeType === 'WORKSPACE').length} scoped</dd>
        </div>
        <div>
          <dt className="font-medium">Last used</dt>
          <dd>{formatTimestamp(row.agent.lastUsedAt)}</dd>
        </div>
      </dl>
      {latestCred ? (
        <p className="text-muted-foreground mt-2 font-mono text-xs">
          {latestCred.tokenPrefix} · {latestCred.state}
        </p>
      ) : null}
    </Link>
  );
}
