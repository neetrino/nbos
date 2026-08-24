'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { KeyRound, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/shared';
import { cn } from '@/lib/utils';
import type { AgentResourceScopeView } from '@/lib/api/ai-admin';
import { aiAdminInternalApi } from '@/lib/api/ai-admin-internal';
import { AI_ADMIN_ACCESS_LAYOUT_CLASS, AI_ADMIN_DENSE_ROW_CLASS } from '../ai-admin-ui.constants';
import { isCurrentGrant } from '../grant-current';
import { workspaceLabel } from '../format';
import { useAccessCatalog } from '../use-access-catalog';
import { AiAdminCapabilityGrantList } from './AiAdminCapabilityGrantList';
import { AiAdminSection } from './AiAdminSection';
import { AiAdminWorkspaceGrantControls } from './AiAdminWorkspaceGrantControls';

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

  const capabilities = grants.data?.capabilities ?? [];
  const scopes = grants.data?.scopes ?? [];
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
    <div className={AI_ADMIN_ACCESS_LAYOUT_CLASS}>
      <AiAdminSection
        icon={KeyRound}
        title="WHAT — capabilities"
        summary={`${activeCaps.size} of ${catalog.catalog.length}`}
      >
        <AiAdminCapabilityGrantList
          catalog={catalog.catalog}
          activeKeys={activeCaps}
          disabled={!props.canGrant || !ready}
          onToggle={(key, enabled) => void toggleCapability(key, enabled)}
        />
      </AiAdminSection>
      <AiAdminSection
        icon={Layers}
        title="WHERE — Work Spaces"
        summary={`${activeScopes.length} granted`}
      >
        <InternalWorkspaceScopeList
          agentId={props.agentId}
          canGrant={props.canGrant}
          ready={ready}
          workspaceId={workspaceId}
          workspaces={catalog.workspaces}
          scopes={activeScopes}
          onWorkspaceId={setWorkspaceId}
          onReload={() => void grants.refetch()}
        />
      </AiAdminSection>
    </div>
  );
}

function InternalWorkspaceScopeList(props: {
  agentId: string;
  canGrant: boolean;
  ready: boolean;
  workspaceId: string;
  workspaces: Array<{ id: string; name: string }>;
  scopes: AgentResourceScopeView[];
  onWorkspaceId: (value: string) => void;
  onReload: () => void;
}) {
  return (
    <div className="space-y-2">
      {props.scopes.length === 0 ? (
        <p className="text-muted-foreground text-xs">No Work Space scopes yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {props.scopes.map((scope) => (
            <li key={scope.id} className={cn(AI_ADMIN_DENSE_ROW_CLASS, 'justify-between')}>
              <span className="truncate text-xs">
                {workspaceLabel(props.workspaces, scope.scopeId)}
              </span>
              {props.canGrant ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!props.ready}
                  onClick={() =>
                    void aiAdminInternalApi
                      .revokeScope(props.agentId, scope.id)
                      .then(props.onReload)
                      .catch(() => toast.error('Scope revoke failed.'))
                  }
                >
                  Revoke
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {props.canGrant ? (
        <AiAdminWorkspaceGrantControls
          workspaceId={props.workspaceId}
          workspaces={props.workspaces}
          grantDisabled={!props.workspaceId || !props.ready}
          onWorkspaceId={props.onWorkspaceId}
          onGrant={() =>
            void aiAdminInternalApi
              .grantWorkspaceScope(props.agentId, props.workspaceId)
              .then(() => {
                props.onWorkspaceId('');
                props.onReload();
              })
              .catch(() => toast.error('Work Space grant failed.'))
          }
        />
      ) : null}
    </div>
  );
}
