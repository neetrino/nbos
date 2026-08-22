'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorState, LoadingState } from '@/components/shared';
import type { AgentCapabilityGrantView, AgentResourceScopeView } from '@/lib/api/ai-admin';
import { aiAdminInternalApi } from '@/lib/api/ai-admin-internal';
import { AI_ADMIN_ID_PREFIX_LENGTH } from '../constants';
import { isCurrentGrant } from '../grant-current';
import { applySelectValue } from '../select-value';
import { useAccessCatalog } from '../use-access-catalog';

export function InternalAgentAccessSection(props: { agentId: string; canGrant: boolean }) {
  const catalog = useAccessCatalog();
  const [workspaceId, setWorkspaceId] = useState('');
  const grants = useQuery({
    queryKey: ['ai-admin', 'internal-access', props.agentId],
    queryFn: async () => {
      const [capabilities, scopes] = await Promise.all([
        aiAdminInternalApi.listCapabilities(props.agentId),
        aiAdminInternalApi.listScopes(props.agentId),
      ]);
      return { capabilities, scopes };
    },
  });

  const capabilities: AgentCapabilityGrantView[] = grants.data?.capabilities ?? [];
  const scopes: AgentResourceScopeView[] = grants.data?.scopes ?? [];
  const activeCaps = new Set(
    capabilities.filter((item) => isCurrentGrant(item)).map((item) => item.capabilityKey),
  );
  const activeScopes = scopes.filter((item) => isCurrentGrant(item));
  const ready = catalog.ready && grants.isSuccess;
  const error =
    catalog.error ?? (grants.isError ? 'Internal Agent access could not be loaded.' : null);

  const reload = () => {
    catalog.retry();
    void grants.refetch();
  };

  const toggleCapability = async (key: string, enabled: boolean) => {
    if (!ready) return;
    try {
      if (enabled) await aiAdminInternalApi.grantCapability(props.agentId, key);
      else await aiAdminInternalApi.revokeCapability(props.agentId, key);
      await grants.refetch();
    } catch {
      toast.error('Internal capability grant failed.');
    }
  };

  if (catalog.loading || grants.isLoading) return <LoadingState count={2} />;
  if (error) return <ErrorState description={error} onRetry={reload} />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="border-border bg-card rounded-xl border p-4">
        <h2 className="text-sm font-semibold">WHAT — capabilities</h2>
        <ul className="mt-3 space-y-2">
          {catalog.catalog.map((item) => (
            <li key={item.key} className="flex items-start gap-2">
              <Checkbox
                checked={activeCaps.has(item.key)}
                disabled={!props.canGrant || !ready}
                onCheckedChange={(value) => void toggleCapability(item.key, value === true)}
              />
              <p className="font-mono text-xs">{item.key}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="border-border bg-card rounded-xl border p-4">
        <h2 className="text-sm font-semibold">WHERE — Work Space scopes</h2>
        <ul className="mt-3 mb-3 space-y-2">
          {activeScopes.map((scope) => (
            <li key={scope.id} className="flex items-center justify-between gap-2">
              <span className="text-xs">
                {scope.scopeType} ·{' '}
                {catalog.workspaces.find((item) => item.id === scope.scopeId)?.name ??
                  scope.scopeId.slice(0, AI_ADMIN_ID_PREFIX_LENGTH)}
              </span>
              {props.canGrant ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!ready}
                  onClick={() =>
                    void aiAdminInternalApi
                      .revokeScope(props.agentId, scope.id)
                      .then(() => grants.refetch())
                      .catch(() => toast.error('Scope revoke failed.'))
                  }
                >
                  Revoke
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        {props.canGrant ? (
          <div className="flex gap-2">
            <Select
              value={workspaceId}
              onValueChange={(value) => applySelectValue(value, setWorkspaceId)}
            >
              <SelectTrigger size="sm" className="min-w-[12rem]">
                <SelectValue placeholder="Select Work Space" />
              </SelectTrigger>
              <SelectContent>
                {catalog.workspaces.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              disabled={!workspaceId || !ready}
              onClick={() =>
                void aiAdminInternalApi
                  .grantWorkspaceScope(props.agentId, workspaceId)
                  .then(() => {
                    setWorkspaceId('');
                    return grants.refetch();
                  })
                  .catch(() => toast.error('Work Space grant failed.'))
              }
            >
              Grant
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
