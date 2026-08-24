'use client';

import { useCallback, useEffect, useState } from 'react';
import { BrainCircuit, Plus, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { aiAdminApi, type InternalAiAgentView } from '@/lib/api/ai-admin';
import { AI_ADMIN_CARD_GRID_CLASS, AI_ADMIN_PAGE_STACK_CLASS } from '../ai-admin-ui.constants';
import { AI_ADMIN_BASE_PATH } from '../constants';
import { agentStateVariant } from '../status-badge-map';
import { AiAdminEntityRow } from './AiAdminEntityRow';
import { AiAdminPageToolbar } from './AiAdminPageToolbar';
import { InternalAgentCreateDialog } from './InternalAgentCreateDialog';

export function InternalAgentListPanel() {
  const [rows, setRows] = useState<InternalAiAgentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await aiAdminApi.listInternalAgents());
      setError(null);
    } catch {
      setError('Internal Agents could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const showInitialLoad = loading && rows.length === 0 && !createOpen;
  if (showInitialLoad) return <LoadingState />;
  if (error && !createOpen) return <ErrorState description={error} onRetry={() => void load()} />;

  return (
    <div className={AI_ADMIN_PAGE_STACK_CLASS}>
      <AiAdminPageToolbar
        icon={BrainCircuit}
        description="Internal Agents are NBOS-owned identities, not provider connections. Create starts in DRAFT."
        actions={
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Create Internal Agent
          </Button>
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={BrainCircuit}
          title="No Internal Agents"
          description="Create a DRAFT agent, assign an ACTIVE Model Policy, then activate."
        />
      ) : (
        <div className={AI_ADMIN_CARD_GRID_CLASS}>
          {rows.map((agent) => (
            <AiAdminEntityRow
              key={agent.id}
              href={`${AI_ADMIN_BASE_PATH}/internal-agents/${agent.id}`}
              icon={BrainCircuit}
              title={agent.name}
              description={agent.description}
              statusLabel={agent.status}
              statusVariant={agentStateVariant(agent.status)}
              pills={[{ icon: Route, text: agent.modelPolicyId ? 'Policy assigned' : 'No policy' }]}
            />
          ))}
        </div>
      )}
      <InternalAgentCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void load()}
      />
    </div>
  );
}
