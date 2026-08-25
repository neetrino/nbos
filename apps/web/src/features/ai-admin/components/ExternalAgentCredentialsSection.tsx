'use client';

import { useState } from 'react';
import { Clock, KeyRound, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import { cn } from '@/lib/utils';
import { aiAdminApi, type AgentCredentialView, type ExternalAgentBundle } from '@/lib/api/ai-admin';
import { resolvePublicAgentApiOrigin } from '../agent-client-setup';
import { AI_ADMIN_ICON_ACCENT_CLASS } from '../ai-admin-ui.constants';
import { canRotateAgentCredential } from '../external-agent-actions';
import { formatTimestamp } from '../format';
import { agentStateVariant } from '../status-badge-map';
import { AgentClientSetupSection } from './AgentClientSetupSection';
import { AiAdminConfirmDialog } from './AiAdminConfirmDialog';
import { AiAdminSection } from './AiAdminSection';
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
  const [secretOpen, setSecretOpen] = useState(false);
  const apiOrigin = resolvePublicAgentApiOrigin(process.env.NEXT_PUBLIC_BACKEND_URL);
  const activeCount = props.bundle.credentials.filter((item) => item.state === 'ACTIVE').length;
  const tokenCount = props.bundle.credentials.length;

  const run = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      if (pending.type === 'issue') {
        const issued = await aiAdminApi.issueCredential(props.bundle.agent.id);
        setPending(null);
        setToken(issued.token);
        setSecretOpen(true);
        return;
      }
      if (pending.type === 'rotate' && pending.id) {
        const issued = await aiAdminApi.rotateCredential(props.bundle.agent.id, pending.id);
        setPending(null);
        setToken(issued.token);
        setSecretOpen(true);
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
    <AiAdminSection
      icon={KeyRound}
      title="Credentials"
      description="Raw secret is shown once. NBOS keeps only the prefix."
      summary={`${tokenCount} ${tokenCount === 1 ? 'token' : 'tokens'} · ${activeCount} active`}
      actions={
        props.canIssue ? (
          <Button type="button" size="sm" onClick={() => setPending({ type: 'issue' })}>
            Issue token
          </Button>
        ) : null
      }
    >
      {props.bundle.credentials.length === 0 ? (
        <p className="text-muted-foreground text-sm leading-relaxed">No tokens issued yet.</p>
      ) : (
        <ul className="space-y-2">
          {props.bundle.credentials.map((credential) => (
            <CredentialTokenRow
              key={credential.id}
              credential={credential}
              agentState={props.bundle.agent.state}
              canIssue={props.canIssue}
              onRotate={() => setPending({ type: 'rotate', id: credential.id })}
              onRevoke={() => setPending({ type: 'revoke', id: credential.id })}
            />
          ))}
        </ul>
      )}
      <AgentClientSetupSection token={token} apiOrigin={apiOrigin} />
      <AiAdminConfirmDialog
        open={pending !== null}
        title={
          pending?.type === 'rotate'
            ? 'Rotate token?'
            : pending?.type === 'revoke'
              ? 'Revoke token?'
              : 'Issue token?'
        }
        description="The raw secret is shown once. Copy .env or MCP from the next dialog. NBOS keeps only the prefix."
        confirmLabel="Continue"
        destructive={pending?.type === 'revoke'}
        isSubmitting={busy}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        onConfirm={() => void run()}
      />
      <OneTimeSecretModal
        open={secretOpen}
        title="One-time External Agent token"
        secret={token}
        apiOrigin={apiOrigin}
        onClose={() => {
          setSecretOpen(false);
          setToken(null);
          props.onChanged();
        }}
      />
    </AiAdminSection>
  );
}

function CredentialTokenRow(props: {
  credential: AgentCredentialView;
  agentState: ExternalAgentBundle['agent']['state'];
  canIssue: boolean;
  onRotate: () => void;
  onRevoke: () => void;
}) {
  const { credential } = props;
  const active = credential.state === 'ACTIVE';
  const showRotate = canRotateAgentCredential(props.agentState, credential.state);
  const showRevoke = props.canIssue && active;

  return (
    <li className="border-border/60 overflow-hidden rounded-lg border">
      <div className="bg-muted/50 flex items-center justify-between gap-2 px-2.5 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <StatusBadge
            label={credentialStateLabel(credential.state)}
            variant={agentStateVariant(credential.state)}
            dot
            className="shrink-0 rounded-full"
          />
          <span className="text-muted-foreground inline-flex items-center gap-1 truncate text-[11px]">
            <Clock className="size-3 shrink-0" aria-hidden />
            {formatTimestamp(credential.lastUsedAt)}
          </span>
        </div>
        {showRotate || showRevoke ? (
          <div className="flex shrink-0 items-center gap-1">
            {showRotate ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2"
                onClick={props.onRotate}
              >
                <RotateCw className="size-3.5" aria-hidden />
                Rotate
              </Button>
            ) : null}
            {showRevoke ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2"
                onClick={props.onRevoke}
              >
                Revoke
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="bg-background flex items-center gap-2 px-3 py-2.5">
        <KeyRound className={cn('size-4 shrink-0', AI_ADMIN_ICON_ACCENT_CLASS)} aria-hidden />
        <code className="text-foreground min-w-0 flex-1 truncate font-mono text-sm font-medium">
          {credential.tokenPrefix}
        </code>
      </div>
    </li>
  );
}

function credentialStateLabel(state: AgentCredentialView['state']): string {
  if (state === 'ACTIVE') return 'Connected';
  if (state === 'REVOKED') return 'Revoked';
  return 'Expired';
}
