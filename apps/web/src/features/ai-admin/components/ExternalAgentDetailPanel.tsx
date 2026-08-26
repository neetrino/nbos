'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BotMessageSquare, Clock, KeyRound, Radio, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorState, LoadingState } from '@/components/shared';
import type { ExternalAgentState } from '@/lib/api/ai-admin';
import { aiAdminApi, type ExternalAgentBundle } from '@/lib/api/ai-admin';
import { AI_ADMIN_DETAIL_MAIN_CLASS, AI_ADMIN_PAGE_STACK_CLASS } from '../ai-admin-ui.constants';
import {
  canEnableExternalAgent,
  canExtendExternalAgentExpiry,
  canGrantExternalAgentAccess,
  canIssueExternalAgentToken,
  isExternalAgentRevoked,
} from '../external-agent-actions';
import { formatTimestamp, shortId } from '../format';
import { agentStateVariant } from '../status-badge-map';
import { AiAdminConfirmDialog } from './AiAdminConfirmDialog';
import { AiAdminDetailHeader } from './AiAdminDetailHeader';
import { AiAdminMetaStrip } from './AiAdminMetaStrip';
import {
  ExternalAgentCapabilitiesSection,
  ExternalAgentWorkspacesSection,
} from './ExternalAgentAccessSection';
import { ExternalAgentActivitySection } from './ExternalAgentActivitySection';
import { ExternalAgentCredentialsSection } from './ExternalAgentCredentialsSection';

export function ExternalAgentDetailPanel({ agentId }: { agentId: string }) {
  const [bundle, setBundle] = useState<ExternalAgentBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<'disable' | 'enable' | 'revoke' | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setBundle(await aiAdminApi.getExternalAgent(agentId));
      setError(null);
    } catch {
      setError('External Agent could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !bundle) return <LoadingState />;
  if (error || !bundle) {
    return <ErrorState description={error ?? 'Not found'} onRetry={() => void load()} />;
  }

  const { agent } = bundle;
  const revoked = isExternalAgentRevoked(agent.state);
  const latestCred = bundle.credentials[0];
  const accessProps = {
    bundle,
    canGrant: canGrantExternalAgentAccess(agent.state),
    onChanged: () => void load(),
  };

  return (
    <div className={AI_ADMIN_PAGE_STACK_CLASS}>
      <div className={AI_ADMIN_DETAIL_MAIN_CLASS}>
        <div className="space-y-4">
          <AiAdminDetailHeader
            compact
            icon={BotMessageSquare}
            name={agent.name}
            purpose={agent.description ?? ''}
            statusLabel={agent.state}
            statusVariant={agentStateVariant(agent.state)}
            readOnly={revoked}
            onNameCommit={(name) => {
              void aiAdminApi
                .updateExternalAgent(agent.id, { name })
                .then(load)
                .catch(() => toast.error('Name could not be saved.'));
            }}
            onPurposeCommit={(description) => {
              void aiAdminApi
                .updateExternalAgent(agent.id, { description })
                .then(load)
                .catch(() => toast.error('Purpose could not be saved.'));
            }}
            meta={
              <AiAdminMetaStrip
                items={[
                  { icon: Clock, label: 'Last used', value: lastUsedLabel(agent) },
                  { icon: Radio, label: 'Expires', value: formatTimestamp(agent.expiresAt) },
                  {
                    icon: UserRound,
                    label: 'Owner',
                    value: shortId(agent.ownerId),
                  },
                  {
                    icon: KeyRound,
                    label: 'Credential',
                    value: latestCred ? latestCred.state : 'None issued',
                  },
                ]}
              />
            }
            actions={
              <ExternalAgentLifecycleActions
                agentId={agent.id}
                state={agent.state}
                revoked={revoked}
                canExtend={canExtendExternalAgentExpiry(agent.state)}
                onConfirm={setConfirm}
                onReload={load}
              />
            }
          />
          <ExternalAgentCapabilitiesSection {...accessProps} />
          <ExternalAgentActivitySection agentId={agent.id} />
        </div>
        <div className="space-y-4">
          <ExternalAgentCredentialsSection
            bundle={bundle}
            canIssue={canIssueExternalAgentToken(agent.state)}
            onChanged={() => void load()}
          />
          <ExternalAgentWorkspacesSection {...accessProps} />
        </div>
      </div>

      <AiAdminConfirmDialog
        open={confirm !== null}
        title={confirmTitle(confirm)}
        description={confirmDescription(confirm, agent.name)}
        confirmLabel={confirm === 'revoke' ? 'Revoke permanently' : 'Confirm'}
        destructive={confirm === 'revoke' || confirm === 'disable'}
        isSubmitting={busy}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        onConfirm={() => void runLifecycle(confirm, agent.id, setBusy, setConfirm, load)}
      />
    </div>
  );
}

function lastUsedLabel(agent: ExternalAgentBundle['agent']): string {
  const when = formatTimestamp(agent.lastUsedAt);
  return agent.lastUsedChannel ? `${when} · ${agent.lastUsedChannel}` : when;
}

function ExternalAgentLifecycleActions(props: {
  agentId: string;
  state: ExternalAgentState;
  revoked: boolean;
  canExtend: boolean;
  onConfirm: (action: 'disable' | 'enable' | 'revoke') => void;
  onReload: () => Promise<void>;
}) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      {props.canExtend ? (
        <ExpiryExtendInput agentId={props.agentId} onReload={props.onReload} />
      ) : null}
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        {props.state === 'ACTIVE' ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => props.onConfirm('disable')}
          >
            Disable
          </Button>
        ) : null}
        {canEnableExternalAgent(props.state) ? (
          <Button type="button" size="sm" variant="outline" onClick={() => props.onConfirm('enable')}>
            Re-enable
          </Button>
        ) : null}
        {!props.revoked ? (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => props.onConfirm('revoke')}
          >
            Revoke agent
          </Button>
        ) : (
          <span className="text-muted-foreground text-xs">Revoked permanently</span>
        )}
      </div>
    </div>
  );
}

function ExpiryExtendInput(props: { agentId: string; onReload: () => Promise<void> }) {
  return (
    <Input
      aria-label="Extend expiry"
      type="datetime-local"
      className="h-8 max-w-48"
      onBlur={(event) => {
        if (!event.target.value) return;
        const expiresAt = new Date(event.target.value);
        if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
          toast.error('Pick a future expiry.');
          return;
        }
        void aiAdminApi
          .updateExternalAgent(props.agentId, { expiresAt: expiresAt.toISOString() })
          .then(props.onReload)
          .catch(() => toast.error('Expiry could not be extended.'));
      }}
    />
  );
}

async function runLifecycle(
  confirm: 'disable' | 'enable' | 'revoke' | null,
  agentId: string,
  setBusy: (value: boolean) => void,
  setConfirm: (value: 'disable' | 'enable' | 'revoke' | null) => void,
  load: () => Promise<void>,
): Promise<void> {
  setBusy(true);
  try {
    if (confirm === 'disable') await aiAdminApi.disableExternalAgent(agentId);
    if (confirm === 'enable') await aiAdminApi.enableExternalAgent(agentId);
    if (confirm === 'revoke') await aiAdminApi.revokeExternalAgent(agentId);
    setConfirm(null);
    await load();
  } catch {
    toast.error('Lifecycle change failed.');
  } finally {
    setBusy(false);
  }
}

function confirmTitle(action: 'disable' | 'enable' | 'revoke' | null): string {
  if (action === 'revoke') return 'Revoke this External Agent?';
  if (action === 'disable') return 'Disable this External Agent?';
  return 'Re-enable this External Agent?';
}

function confirmDescription(action: 'disable' | 'enable' | 'revoke' | null, name: string): string {
  if (action === 'revoke') {
    return `${name} will be permanently revoked. All credentials stop immediately. This cannot be undone.`;
  }
  if (action === 'disable') {
    return `${name} will fail authentication until you re-enable it.`;
  }
  return `${name} will be allowed to authenticate again with existing credentials.`;
}
