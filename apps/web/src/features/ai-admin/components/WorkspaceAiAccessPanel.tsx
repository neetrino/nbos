'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { aiAdminApi, type ExternalAgentBundle, type WorkspaceAccessRow } from '@/lib/api/ai-admin';
import { AI_ADMIN_BASE_PATH } from '../constants';
import { grantableExternalAgents } from '../grantable-agents';
import { applySelectValue } from '../select-value';
import { agentStateVariant } from '../status-badge-map';

export function WorkspaceAiAccessPanel({ workspaceId }: { workspaceId: string }) {
  const [rows, setRows] = useState<WorkspaceAccessRow[]>([]);
  const [agents, setAgents] = useState<ExternalAgentBundle[]>([]);
  const [agentId, setAgentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextRows, nextAgents] = await Promise.all([
        aiAdminApi.listWorkspaceAccess(workspaceId),
        aiAdminApi.listExternalAgents(),
      ]);
      setRows(nextRows);
      setAgents(nextAgents);
      setError(null);
    } catch {
      setError('AI Access could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState count={2} />;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;

  const grantedIds = new Set(
    rows.map((row) => row.agent?.id).filter((id): id is string => Boolean(id)),
  );
  const available = grantableExternalAgents(agents, grantedIds);

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">AI Access</h3>
        <p className="text-muted-foreground text-xs">
          Same Work Space grants as Settings → AI & Agents. Token rotation lives only in the central
          External Agent page.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          No External Agents are scoped to this Work Space.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.scope.id} className="border-border rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{row.agent?.name ?? 'Unknown agent'}</p>
                  <p className="text-muted-foreground text-xs">
                    {row.capabilities.map((item) => item.capabilityKey).join(', ') ||
                      'No capabilities'}
                  </p>
                </div>
                {row.agent ? (
                  <StatusBadge
                    label={row.agent.state}
                    variant={agentStateVariant(row.agent.state)}
                  />
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {row.agent ? (
                  <Link
                    href={`${AI_ADMIN_BASE_PATH}/external-agents/${row.agent.id}`}
                    className="text-xs underline"
                  >
                    Open central detail
                  </Link>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void aiAdminApi
                      .revokeWorkspaceAccess(workspaceId, row.scope.id)
                      .then(load)
                      .catch(() => toast.error('Revoke failed.'))
                  }
                >
                  Revoke Work Space access
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Select value={agentId} onValueChange={(value) => applySelectValue(value, setAgentId)}>
          <SelectTrigger size="sm" className="min-w-[12rem]">
            <SelectValue placeholder="Existing External Agent" />
          </SelectTrigger>
          <SelectContent>
            {available.map((bundle) => (
              <SelectItem key={bundle.agent.id} value={bundle.agent.id}>
                {bundle.agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          disabled={!agentId}
          onClick={() =>
            void aiAdminApi
              .grantWorkspaceAccess(workspaceId, agentId)
              .then(() => {
                setAgentId('');
                return load();
              })
              .catch(() => toast.error('Grant failed.'))
          }
        >
          Grant access
        </Button>
      </div>
    </section>
  );
}
