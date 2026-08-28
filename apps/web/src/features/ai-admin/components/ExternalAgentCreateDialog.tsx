'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

  const resetForm = () => {
    setName('');
    setDescription('');
    setIssueNow(true);
    setSubmitting(false);
    setIssueFailed(false);
  };

  const closeAfterSecret = () => {
    const id = createdId;
    setToken(null);
    setCreatedId(null);
    props.onSecretClosed?.();
    props.onOpenChange(false);
    resetForm();
    props.onCreated();
    if (id) router.push(`${AI_ADMIN_BASE_PATH}/external-agents/${id}`);
  };

  const issueForCreated = async (agentId: string) => {
    const result = await aiAdminApi.issueCredential(agentId);
    setToken(result.token);
    setIssueFailed(false);
    props.onIssued?.(agentId, result.token);
  };

  const submit = async () => {
    setSubmitting(true);
    let agentId = createdId;
    try {
      if (!agentId) {
        const agent = await aiAdminApi.createExternalAgent({
          name: name.trim(),
          description: description.trim() || undefined,
        });
        agentId = agent.id;
        setCreatedId(agent.id);
      }
      let failedIssue = false;
      if (issueNow) {
        try {
          await issueForCreated(agentId);
          return;
        } catch {
          failedIssue = true;
          setIssueFailed(true);
        }
      }
      const outcome = finishCreateWithOptionalIssue({
        agentId,
        issueRequested: issueNow,
        token: null,
        issueFailed: failedIssue,
      });
      if (outcome.kind === 'created-issue-failed') {
        toast.error('Agent created. Token issue failed — retry issuance, do not create again.');
        return;
      }
      props.onCreated();
      props.onOpenChange(false);
      resetForm();
      router.push(`${AI_ADMIN_BASE_PATH}/external-agents/${agentId}`);
    } catch {
      toast.error(
        createdId
          ? 'Token could not be issued. Retry issuance for the existing agent.'
          : 'External Agent could not be created.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formOpen = props.open && token === null;
  return (
    <>
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open && token !== null) return;
          props.onOpenChange(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create External Agent</DialogTitle>
            <DialogDescription>
              Machine identity first. Grant capabilities and Work Spaces on the detail page. The raw
              token is shown once if you issue it now.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="agent-name">Name</Label>
              <Input
                id="agent-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={createdId !== null}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="agent-purpose">Purpose</Label>
              <Textarea
                id="agent-purpose"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={createdId !== null}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={issueNow}
                disabled={createdId !== null}
                onCheckedChange={(value) => setIssueNow(value === true)}
              />
              Issue one-time token after create
            </label>
            {issueFailed ? (
              <p className="text-destructive text-xs">
                Agent already exists. Retry token issuance only.
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!name.trim() || submitting}
              onClick={() => void submit()}
            >
              {createdId ? 'Retry issue token' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <OneTimeSecretModal
        open={token !== null}
        title="External Agent token"
        secret={token}
        apiOrigin={resolvePublicAgentApiOrigin(process.env.NEXT_PUBLIC_BACKEND_URL)}
        onClose={closeAfterSecret}
      />
    </>
  );
}
