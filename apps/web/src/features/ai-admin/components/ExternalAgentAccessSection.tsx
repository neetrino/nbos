'use client';

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
import { aiAdminApi, type ExternalAgentBundle } from '@/lib/api/ai-admin';
import { AI_ADMIN_ID_PREFIX_LENGTH } from '../constants';
import { isCurrentGrant } from '../grant-current';
import { applySelectValue } from '../select-value';
import { useAccessCatalog } from '../use-access-catalog';
import type { WorkSpace } from '@/lib/api/tasks';

export function ExternalAgentAccessSection(props: {
  bundle: ExternalAgentBundle;
  canGrant: boolean;
  onChanged: () => void;
}) {
  const catalog = useAccessCatalog();
  const [workspaceId, setWorkspaceId] = useState('');
  const mutationsBlocked = !catalog.ready || !props.canGrant;

  const activeCaps = new Set(
    props.bundle.capabilities
      .filter((item) => isCurrentGrant(item))
      .map((item) => item.capabilityKey),
  );
  const activeScopes = props.bundle.scopes.filter((item) => isCurrentGrant(item));

  const toggleCapability = async (key: string, enabled: boolean) => {
    if (!catalog.ready) return;
    try {
      if (enabled) await aiAdminApi.grantCapability(props.bundle.agent.id, key);
      else await aiAdminApi.revokeCapability(props.bundle.agent.id, key);
      props.onChanged();
    } catch {
      toast.error('Capability grant failed.');
    }
  };

  if (catalog.loading) return <LoadingState count={2} />;
  if (catalog.error) return <ErrorState description={catalog.error} onRetry={catalog.retry} />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="border-border bg-card rounded-xl border p-4">
        <h2 className="text-sm font-semibold">WHAT — capabilities</h2>
        <p className="text-muted-foreground mt-1 mb-3 text-xs">
          Task delete and force-complete are not grantable.
        </p>
        <ul className="space-y-2">
          {catalog.catalog.map((item) => (
            <li key={item.key} className="flex items-start gap-2">
              <Checkbox
                checked={activeCaps.has(item.key)}
                disabled={mutationsBlocked}
                onCheckedChange={(value) => void toggleCapability(item.key, value === true)}
              />
              <div>
                <p className="font-mono text-xs">{item.key}</p>
                <p className="text-muted-foreground text-xs">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="border-border bg-card rounded-xl border p-4">
        <h2 className="text-sm font-semibold">WHERE — Work Space scopes</h2>
        <p className="text-muted-foreground mt-1 mb-3 text-xs">
          A capability never implies all resources. Expired grants are hidden.
        </p>
        <ul className="mb-3 space-y-2">
          {activeScopes.map((scope) => (
            <li key={scope.id} className="flex items-center justify-between gap-2">
              <span className="text-xs">
                {scope.scopeType} · {workspaceName(catalog.workspaces, scope.scopeId)}
              </span>
              {props.canGrant ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!catalog.ready}
                  onClick={() =>
                    void aiAdminApi
                      .revokeScope(props.bundle.agent.id, scope.id)
                      .then(props.onChanged)
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
              disabled={!workspaceId || !catalog.ready}
              onClick={() => {
                void aiAdminApi
                  .grantWorkspaceScope(props.bundle.agent.id, workspaceId)
                  .then(() => {
                    setWorkspaceId('');
                    props.onChanged();
                  })
                  .catch(() => toast.error('Work Space grant failed.'));
              }}
            >
              Grant
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function workspaceName(workspaces: WorkSpace[], id: string): string {
  return workspaces.find((item) => item.id === id)?.name ?? id.slice(0, AI_ADMIN_ID_PREFIX_LENGTH);
}
