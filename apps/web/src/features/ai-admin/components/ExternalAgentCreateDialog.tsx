'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CreateFormDialog, CreateFormSwitchField, InlineField } from '@/components/shared';
import { aiAdminApi } from '@/lib/api/ai-admin';
import { resolvePublicAgentApiOrigin } from '../agent-client-setup';
import { AI_ADMIN_BASE_PATH } from '../constants';
import { finishCreateWithOptionalIssue } from '../one-time-secret-flow';
import { OneTimeSecretModal } from './OneTimeSecretModal';

export function ExternalAgentCreateDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  onIssued?: (agentId: string, token: string) => void;
  onSecretClosed?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [issueNow, setIssueNow] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [issueFailed, setIssueFailed] = useState(false);
  const formOpen = props.open && token === null;

  const resetForm = () => {
    setName('');
    setDescription('');
    setIssueNow(true);
    setSubmitting(false);
    setIssueFailed(false);
  };

  return (
    <>
      <CreateFormDialog
        open={formOpen}
        onOpenChange={(next) => {
          if (!next && token !== null) return;
          props.onOpenChange(next);
        }}
        title="Create External Agent"
        description="Machine identity first. Grant capabilities and Work Spaces on the detail page. The raw token is shown once if you issue it now."
        submitting={submitting}
        canSubmit={Boolean(name.trim()) && !submitting}
        submitLabel={createdId ? 'Retry issue token' : 'Create'}
        submittingLabel="Creating..."
        cancelLabel="Cancel"
        onSubmit={(event) =>
          void submitExternalAgent({
            event,
            name,
            description,
            issueNow,
            createdId,
            setSubmitting,
            setCreatedId,
            setToken,
            setIssueFailed,
            resetForm,
            onCreated: props.onCreated,
            onOpenChange: props.onOpenChange,
            onIssued: props.onIssued,
            router,
          })
        }
      >
        <InlineField
          variant="controlled"
          label="Name"
          type="text"
          value={name}
          disabled={createdId !== null}
          onValueChange={setName}
        />
        <InlineField
          variant="controlled"
          label="Purpose"
          type="textarea"
          value={description}
          disabled={createdId !== null}
          onValueChange={setDescription}
        />
        <CreateFormSwitchField
          label="Issue one-time token after create"
          checked={issueNow}
          disabled={createdId !== null}
          onCheckedChange={setIssueNow}
        />
        {issueFailed ? (
          <p className="text-destructive text-xs">
            Agent already exists. Retry token issuance only.
          </p>
        ) : null}
      </CreateFormDialog>
      <OneTimeSecretModal
        open={token !== null}
        title="External Agent token"
        secret={token}
        apiOrigin={resolvePublicAgentApiOrigin(process.env.NEXT_PUBLIC_BACKEND_URL)}
        onClose={() => {
          const id = createdId;
          setToken(null);
          setCreatedId(null);
          props.onSecretClosed?.();
          props.onOpenChange(false);
          resetForm();
          props.onCreated();
          if (id) router.push(`${AI_ADMIN_BASE_PATH}/external-agents/${id}`);
        }}
      />
    </>
  );
}

async function submitExternalAgent(options: {
  event: FormEvent;
  name: string;
  description: string;
  issueNow: boolean;
  createdId: string | null;
  setSubmitting: (submitting: boolean) => void;
  setCreatedId: (id: string | null) => void;
  setToken: (token: string | null) => void;
  setIssueFailed: (failed: boolean) => void;
  resetForm: () => void;
  onCreated: () => void;
  onOpenChange: (open: boolean) => void;
  onIssued?: (agentId: string, token: string) => void;
  router: ReturnType<typeof useRouter>;
}): Promise<void> {
  options.event.preventDefault();
  options.setSubmitting(true);
  let agentId = options.createdId;
  try {
    if (!agentId) {
      const agent = await aiAdminApi.createExternalAgent({
        name: options.name.trim(),
        description: options.description.trim() || undefined,
      });
      agentId = agent.id;
      options.setCreatedId(agent.id);
    }
    let failedIssue = false;
    if (options.issueNow) {
      try {
        const result = await aiAdminApi.issueCredential(agentId);
        options.setToken(result.token);
        options.setIssueFailed(false);
        options.onIssued?.(agentId, result.token);
        return;
      } catch {
        failedIssue = true;
        options.setIssueFailed(true);
      }
    }
    const outcome = finishCreateWithOptionalIssue({
      agentId,
      issueRequested: options.issueNow,
      token: null,
      issueFailed: failedIssue,
    });
    if (outcome.kind === 'created-issue-failed') {
      toast.error('Agent created. Token issue failed — retry issuance, do not create again.');
      return;
    }
    options.onCreated();
    options.onOpenChange(false);
    options.resetForm();
    options.router.push(`${AI_ADMIN_BASE_PATH}/external-agents/${agentId}`);
  } catch {
    toast.error(
      options.createdId
        ? 'Token could not be issued. Retry issuance for the existing agent.'
        : 'External Agent could not be created.',
    );
  } finally {
    options.setSubmitting(false);
  }
}
