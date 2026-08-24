'use client';

import { useCallback, useEffect, useReducer, useState } from 'react';
import { BotMessageSquare, Clock, KeyRound, Layers, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { aiAdminApi, type ExternalAgentBundle } from '@/lib/api/ai-admin';
import { AI_ADMIN_CARD_GRID_CLASS, AI_ADMIN_PAGE_STACK_CLASS } from '../ai-admin-ui.constants';
import { AI_ADMIN_BASE_PATH } from '../constants';
import { AiAdminPageToolbar } from './AiAdminPageToolbar';
import { isCurrentGrant } from '../grant-current';
import { formatTimestamp } from '../format';
import {
  initialSecretHostState,
  isCreateHostMounted,
  reduceSecretHost,
} from '../one-time-secret-host';
import { agentStateVariant } from '../status-badge-map';
import { AiAdminEntityRow } from './AiAdminEntityRow';
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
    <div className={AI_ADMIN_PAGE_STACK_CLASS}>
      <AiAdminPageToolbar
        icon={BotMessageSquare}
        description="Machine clients with scoped capabilities and Work Space access. Issue tokens from the agent detail page."
        actions={
          <Button type="button" size="sm" onClick={() => dispatch({ type: 'OPEN_CREATE' })}>
            <Plus className="size-4" aria-hidden />
            Create External Agent
          </Button>
        }
      />
      {showInitialLoad ? <LoadingState /> : null}
      {error && !keepHost ? <ErrorState description={error} onRetry={() => void load()} /> : null}
      {!showInitialLoad && !error && rows.length === 0 ? (
        <EmptyState
          icon={BotMessageSquare}
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
        <div className={AI_ADMIN_CARD_GRID_CLASS}>
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
  const workspaceCount = row.scopes.filter(
    (item) => isCurrentGrant(item) && item.scopeType === 'WORKSPACE',
  ).length;
  const latestCred = row.credentials[0];
  return (
    <AiAdminEntityRow
      href={`${AI_ADMIN_BASE_PATH}/external-agents/${row.agent.id}`}
      icon={BotMessageSquare}
      title={row.agent.name}
      description={row.agent.description}
      statusLabel={row.agent.state}
      statusVariant={agentStateVariant(row.agent.state)}
      pills={[
        {
          icon: Sparkles,
          text: `${activeCaps.length} ${activeCaps.length === 1 ? 'capability' : 'capabilities'}`,
        },
        {
          icon: Layers,
          text: `${workspaceCount} ${workspaceCount === 1 ? 'work space' : 'work spaces'}`,
        },
        { icon: Clock, text: formatTimestamp(row.agent.lastUsedAt) },
        {
          icon: KeyRound,
          text: latestCred ? `Token ${latestCred.state}` : 'No token',
        },
      ]}
    />
  );
}
