'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { aiAdminApi, type InternalAiAgentView } from '@/lib/api/ai-admin';
import { AI_ADMIN_BASE_PATH } from '../constants';
import { agentStateVariant } from '../status-badge-map';
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
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Internal Agents are NBOS-owned identities, not provider connections. Create starts in DRAFT.
      </p>
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden />
          Create Internal Agent
        </Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Internal Agents"
          description="Create a DRAFT agent, assign an ACTIVE Model Policy, then activate."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((agent) => (
            <Link
              key={agent.id}
              href={`${AI_ADMIN_BASE_PATH}/internal-agents/${agent.id}`}
              className="border-border bg-card hover:bg-muted/40 block rounded-xl border p-4 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">{agent.name}</h2>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {agent.description || 'No purpose recorded'}
                  </p>
                </div>
                <StatusBadge label={agent.status} variant={agentStateVariant(agent.status)} />
              </div>
            </Link>
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
