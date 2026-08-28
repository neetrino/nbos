'use client';

import { useState } from 'react';
import { KeyRound, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/shared';
import { cn } from '@/lib/utils';
import { aiAdminApi, type ExternalAgentBundle } from '@/lib/api/ai-admin';
import type { WorkSpace } from '@/lib/api/tasks';
import { AI_ADMIN_DENSE_ROW_CLASS, AI_ADMIN_ICON_ACCENT_CLASS } from '../ai-admin-ui.constants';
import { isCurrentGrant } from '../grant-current';
import { workspaceLabel } from '../format';
import { useAccessCatalog } from '../use-access-catalog';
import { AiAdminCapabilityGrantList } from './AiAdminCapabilityGrantList';
import { AiAdminSection } from './AiAdminSection';
import { AiAdminWorkspaceGrantControls } from './AiAdminWorkspaceGrantControls';

type AccessProps = {
  bundle: ExternalAgentBundle;
  canGrant: boolean;
  onChanged: () => void;
};

export function ExternalAgentCapabilitiesSection(props: AccessProps) {
  const catalog = useAccessCatalog();
  const activeCaps = new Set(
    props.bundle.capabilities
      .filter((item) => isCurrentGrant(item))
      .map((item) => item.capabilityKey),
  );

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
    <AiAdminSection
      icon={KeyRound}
      title="Capabilities"
      description="Task delete and force-complete are not grantable."
      summary={`${activeCaps.size} of ${catalog.catalog.length} granted`}
    >
      <AiAdminCapabilityGrantList
        catalog={catalog.catalog}
        activeKeys={activeCaps}
        disabled={!catalog.ready || !props.canGrant}
        showDescription
        columns={1}
        onToggle={(key, enabled) => void toggleCapability(key, enabled)}
      />
    </AiAdminSection>
  );
}

export function ExternalAgentWorkspacesSection(props: AccessProps) {
  const catalog = useAccessCatalog();
  const [workspaceId, setWorkspaceId] = useState('');
  const activeScopes = props.bundle.scopes.filter((item) => isCurrentGrant(item));

  if (catalog.loading) return <LoadingState count={1} />;
  if (catalog.error) return <ErrorState description={catalog.error} onRetry={catalog.retry} />;

  return (
    <AiAdminSection
      icon={Layers}
      title="Work Spaces"
      description="A capability never implies all resources."
      summary={`${activeScopes.length} granted`}
    >
      <WorkspaceScopeList
        agentId={props.bundle.agent.id}
        canGrant={props.canGrant}
        catalogReady={catalog.ready}
        workspaceId={workspaceId}
        workspaces={catalog.workspaces}
        scopes={activeScopes}
        onWorkspaceId={setWorkspaceId}
        onChanged={props.onChanged}
      />
    </AiAdminSection>
  );
}

function WorkspaceScopeList(props: {
  agentId: string;
  canGrant: boolean;
  catalogReady: boolean;
  workspaceId: string;
  workspaces: WorkSpace[];
  scopes: ExternalAgentBundle['scopes'];
  onWorkspaceId: (value: string) => void;
  onChanged: () => void;
}) {
  return (
    <div className="space-y-3">
      {props.scopes.length === 0 ? (
        <p className="text-muted-foreground text-sm">No Work Space scopes yet.</p>
      ) : (
        <ul className="space-y-2">
          {props.scopes.map((scope) => (
            <li key={scope.id} className={cn(AI_ADMIN_DENSE_ROW_CLASS, 'justify-between')}>
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <Layers className={cn('size-4 shrink-0', AI_ADMIN_ICON_ACCENT_CLASS)} aria-hidden />
                <span className="truncate font-medium">
                  {workspaceLabel(props.workspaces, scope.scopeId)}
                </span>
              </span>
              {props.canGrant ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!props.catalogReady}
                  onClick={() =>
                    void aiAdminApi
                      .revokeScope(props.agentId, scope.id)
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
      )}
      {props.canGrant ? (
        <AiAdminWorkspaceGrantControls
          workspaceId={props.workspaceId}
          workspaces={props.workspaces}
          grantDisabled={!props.workspaceId || !props.catalogReady}
          onWorkspaceId={props.onWorkspaceId}
          onGrant={() => {
            void aiAdminApi
              .grantWorkspaceScope(props.agentId, props.workspaceId)
              .then(() => {
                props.onWorkspaceId('');
                props.onChanged();
              })
              .catch(() => toast.error('Work Space grant failed.'));
          }}
        />
      ) : null}
    </div>
  );
}
