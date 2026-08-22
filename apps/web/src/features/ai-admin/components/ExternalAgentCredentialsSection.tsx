'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import { aiAdminApi, type ExternalAgentBundle } from '@/lib/api/ai-admin';
import { canRotateAgentCredential } from '../external-agent-actions';
import { formatTimestamp } from '../format';
import { agentStateVariant } from '../status-badge-map';
import { AiAdminConfirmDialog } from './AiAdminConfirmDialog';
import { OneTimeSecretModal } from './OneTimeSecretModal';

export function ExternalAgentCredentialsSection(props: {
  bundle: ExternalAgentBundle;
  canIssue: boolean;
  onChanged: () => void;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    type: 'issue' | 'rotate' | 'revoke';
    id?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      if (pending.type === 'issue') {
        const issued = await aiAdminApi.issueCredential(props.bundle.agent.id);
        setPending(null);
        setToken(issued.token);
        return;
      }
      if (pending.type === 'rotate' && pending.id) {
        const issued = await aiAdminApi.rotateCredential(props.bundle.agent.id, pending.id);
        setPending(null);
        setToken(issued.token);
        return;
      }
      if (pending.type === 'revoke' && pending.id) {
        await aiAdminApi.revokeCredential(props.bundle.agent.id, pending.id);
      }
      setPending(null);
      props.onChanged();
    } catch {
      toast.error('Credential action failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border-border bg-card rounded-xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Credentials</h2>
        {props.canIssue ? (
          <Button type="button" size="sm" onClick={() => setPending({ type: 'issue' })}>
            Issue token
          </Button>
        ) : null}
      </div>
      <ul className="space-y-3">
        {props.bundle.credentials.map((credential) => (
          <li key={credential.id} className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono text-xs">{credential.tokenPrefix}</p>
              <p className="text-muted-foreground text-xs">
                Last used {formatTimestamp(credential.lastUsedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge label={credential.state} variant={agentStateVariant(credential.state)} />
              {canRotateAgentCredential(props.bundle.agent.state, credential.state) ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPending({ type: 'rotate', id: credential.id })}
                >
                  Rotate
                </Button>
              ) : null}
              {props.canIssue && credential.state === 'ACTIVE' ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPending({ type: 'revoke', id: credential.id })}
                >
                  Revoke
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <AiAdminConfirmDialog
        open={pending !== null}
        title={
          pending?.type === 'rotate'
            ? 'Rotate token?'
            : pending?.type === 'revoke'
              ? 'Revoke token?'
              : 'Issue token?'
        }
        description="The raw secret is shown once. After close, only the prefix remains."
        confirmLabel="Continue"
        destructive={pending?.type === 'revoke'}
        isSubmitting={busy}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        onConfirm={() => void run()}
      />
      <OneTimeSecretModal
        open={token !== null}
        title="One-time External Agent token"
        secret={token}
        setupHint="Use Authorization: Bearer. REST and MCP share this credential."
        onClose={() => {
          setToken(null);
          props.onChanged();
        }}
      />
    </section>
  );
}
