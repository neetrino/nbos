'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { aiAdminApi, type ExternalAgentBundle } from '@/lib/api/ai-admin';
import { AI_ADMIN_BASE_PATH, AI_ADMIN_ID_PREFIX_LENGTH } from '../constants';
import {
  canEnableExternalAgent,
  canExtendExternalAgentExpiry,
  canGrantExternalAgentAccess,
  canIssueExternalAgentToken,
  isExternalAgentRevoked,
} from '../external-agent-actions';
import { formatTimestamp } from '../format';
import { agentStateVariant } from '../status-badge-map';
import { ExternalAgentActivitySection } from './ExternalAgentActivitySection';
import { AiAdminConfirmDialog } from './AiAdminConfirmDialog';
import { ExternalAgentAccessSection } from './ExternalAgentAccessSection';
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
  if (error || !bundle)
    return <ErrorState description={error ?? 'Not found'} onRetry={() => void load()} />;

  const { agent } = bundle;
  const revoked = isExternalAgentRevoked(agent.state);

  const runLifecycle = async () => {
    setBusy(true);
    try {
      if (confirm === 'disable') await aiAdminApi.disableExternalAgent(agent.id);
      if (confirm === 'enable') await aiAdminApi.enableExternalAgent(agent.id);
      if (confirm === 'revoke') await aiAdminApi.revokeExternalAgent(agent.id);
      setConfirm(null);
      await load();
    } catch {
      toast.error('Lifecycle change failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-border bg-card rounded-xl border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            {revoked ? (
              <>
                <h2 className="text-lg font-semibold">{agent.name}</h2>
                <p className="text-muted-foreground text-sm">
                  {agent.description || 'No purpose recorded'}
                </p>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="agent-edit-name">Name</Label>
                  <Input
                    id="agent-edit-name"
                    defaultValue={agent.name}
                    onBlur={(event) => {
                      const name = event.target.value.trim();
                      if (!name || name === agent.name) return;
                      void aiAdminApi
                        .updateExternalAgent(agent.id, { name })
                        .then(load)
                        .catch(() => toast.error('Name could not be saved.'));
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="agent-edit-purpose">Purpose</Label>
                  <Textarea
                    id="agent-edit-purpose"
                    defaultValue={agent.description ?? ''}
                    onBlur={(event) => {
                      const description = event.target.value.trim();
                      if (description === (agent.description ?? '')) return;
                      void aiAdminApi
                        .updateExternalAgent(agent.id, { description })
                        .then(load)
                        .catch(() => toast.error('Purpose could not be saved.'));
                    }}
                  />
                </div>
              </>
            )}
          </div>
          <StatusBadge label={agent.state} variant={agentStateVariant(agent.state)} />
        </div>
        <dl className="text-muted-foreground mt-4 grid gap-2 text-xs sm:grid-cols-3">
          <div>
            <dt className="font-medium">Last used</dt>
            <dd>
              {formatTimestamp(agent.lastUsedAt)}
              {agent.lastUsedChannel ? ` · ${agent.lastUsedChannel}` : ''}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Expires</dt>
            <dd>{formatTimestamp(agent.expiresAt)}</dd>
          </div>
          <div>
            <dt className="font-medium">Owner</dt>
            <dd className="font-mono">{agent.ownerId.slice(0, AI_ADMIN_ID_PREFIX_LENGTH)}</dd>
          </div>
        </dl>
        {canExtendExternalAgentExpiry(agent.state) ? (
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="agent-extend-expiry">Extend expiry to restore tokens and grants</Label>
            <Input
              id="agent-extend-expiry"
              type="datetime-local"
              onBlur={(event) => {
                if (!event.target.value) return;
                const expiresAt = new Date(event.target.value);
                if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
                  toast.error('Pick a future expiry.');
                  return;
                }
                void aiAdminApi
                  .updateExternalAgent(agent.id, { expiresAt: expiresAt.toISOString() })
                  .then(load)
                  .catch(() => toast.error('Expiry could not be extended.'));
              }}
            />
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {agent.state === 'ACTIVE' ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setConfirm('disable')}>
              Disable
            </Button>
          ) : null}
          {canEnableExternalAgent(agent.state) ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setConfirm('enable')}>
              Re-enable
            </Button>
          ) : null}
          {!revoked ? (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => setConfirm('revoke')}
            >
              Revoke
            </Button>
          ) : (
            <p className="text-muted-foreground text-xs">
              REVOKED is terminal. Tokens cannot be issued and the agent cannot be re-enabled.
            </p>
          )}
          <Link
            href={`${AI_ADMIN_BASE_PATH}/audit`}
            className="text-muted-foreground hover:text-foreground text-xs underline"
          >
            Open AI Audit
          </Link>
        </div>
      </div>

      <ExternalAgentCredentialsSection
        bundle={bundle}
        canIssue={canIssueExternalAgentToken(agent.state)}
        onChanged={() => void load()}
      />
      <ExternalAgentAccessSection
        bundle={bundle}
        canGrant={canGrantExternalAgentAccess(agent.state)}
        onChanged={() => void load()}
      />
      <ExternalAgentActivitySection agentId={agent.id} />

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
        onConfirm={() => void runLifecycle()}
      />
    </div>
  );
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
