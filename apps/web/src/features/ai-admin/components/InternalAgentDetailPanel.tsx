'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { aiAdminApi, type AiModelPolicyView, type InternalAiAgentView } from '@/lib/api/ai-admin';
import { agentStateVariant } from '../status-badge-map';
import { AiAdminConfirmDialog } from './AiAdminConfirmDialog';
import { InternalAgentAccessSection } from './InternalAgentAccessSection';

export function InternalAgentDetailPanel({ agentId }: { agentId: string }) {
  const [agent, setAgent] = useState<InternalAiAgentView | null>(null);
  const [policies, setPolicies] = useState<AiModelPolicyView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<'activate' | 'pause' | 'disable' | 'archive' | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextAgent, nextPolicies] = await Promise.all([
        aiAdminApi.getInternalAgent(agentId),
        aiAdminApi.listPolicies(),
      ]);
      setAgent(nextAgent);
      setPolicies(nextPolicies);
      setError(null);
    } catch {
      setError('Internal Agent could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState />;
  if (error || !agent)
    return <ErrorState description={error ?? 'Not found'} onRetry={() => void load()} />;

  const archived = agent.status === 'ARCHIVED';
  const activePolicies = policies.filter((policy) => policy.status === 'ACTIVE');

  const run = async () => {
    setBusy(true);
    try {
      if (confirm === 'activate') await aiAdminApi.activateInternalAgent(agent.id);
      if (confirm === 'pause') await aiAdminApi.pauseInternalAgent(agent.id);
      if (confirm === 'disable') await aiAdminApi.disableInternalAgent(agent.id);
      if (confirm === 'archive') await aiAdminApi.archiveInternalAgent(agent.id);
      setConfirm(null);
      await load();
    } catch {
      toast.error('Lifecycle change failed. Activation requires an ACTIVE Model Policy.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="border-border bg-card rounded-xl border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{agent.name}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {agent.description || 'No purpose recorded'}
            </p>
          </div>
          <StatusBadge label={agent.status} variant={agentStateVariant(agent.status)} />
        </div>
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Model Policy</Label>
            <Select
              value={agent.modelPolicyId ?? ''}
              disabled={archived}
              onValueChange={(value) => {
                if (!value) return;
                void aiAdminApi
                  .updateInternalAgent(agent.id, { modelPolicyId: value })
                  .then(load)
                  .catch(() => toast.error('Policy assignment failed.'));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assign an ACTIVE policy" />
              </SelectTrigger>
              <SelectContent>
                {activePolicies.map((policy) => (
                  <SelectItem key={policy.id} value={policy.id}>
                    {policy.name} · {policy.mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-muted-foreground text-xs">
            Prompt and approval policy IDs are foundation placeholders. Runtime is not enabled.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="prompt-policy-id">Prompt policy ID</Label>
              <Input
                id="prompt-policy-id"
                defaultValue={agent.promptPolicyId ?? ''}
                disabled={archived}
                onBlur={(event) => {
                  const value = event.target.value.trim();
                  if (!value || value === (agent.promptPolicyId ?? '')) return;
                  void aiAdminApi
                    .updateInternalAgent(agent.id, { promptPolicyId: value })
                    .then(load)
                    .catch(() => toast.error('Prompt policy assignment failed.'));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="approval-policy-id">Approval policy ID</Label>
              <Input
                id="approval-policy-id"
                defaultValue={agent.approvalPolicyId ?? ''}
                disabled={archived}
                onBlur={(event) => {
                  const value = event.target.value.trim();
                  if (!value || value === (agent.approvalPolicyId ?? '')) return;
                  void aiAdminApi
                    .updateInternalAgent(agent.id, { approvalPolicyId: value })
                    .then(load)
                    .catch(() => toast.error('Approval policy assignment failed.'));
                }}
              />
            </div>
          </div>
        </div>
        {archived ? (
          <p className="text-muted-foreground mt-4 text-xs">
            Archived agents stay for Audit names.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {agent.status !== 'ACTIVE' ? (
              <Button type="button" size="sm" onClick={() => setConfirm('activate')}>
                Activate
              </Button>
            ) : null}
            {agent.status === 'ACTIVE' ? (
              <Button type="button" size="sm" variant="outline" onClick={() => setConfirm('pause')}>
                Pause
              </Button>
            ) : null}
            {agent.status !== 'DISABLED' ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setConfirm('disable')}
              >
                Disable
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => setConfirm('archive')}
            >
              Archive
            </Button>
          </div>
        )}
      </section>
      <InternalAgentAccessSection agentId={agent.id} canGrant={!archived} />
      <AiAdminConfirmDialog
        open={confirm !== null}
        title={lifecycleTitle(confirm)}
        description={lifecycleDescription(confirm)}
        confirmLabel="Confirm"
        destructive={confirm === 'archive' || confirm === 'disable'}
        isSubmitting={busy}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        onConfirm={() => void run()}
      />
    </div>
  );
}

function lifecycleTitle(action: 'activate' | 'pause' | 'disable' | 'archive' | null): string {
  if (action === 'activate') return 'Activate this Internal Agent?';
  if (action === 'pause') return 'Pause this Internal Agent?';
  if (action === 'disable') return 'Disable this Internal Agent?';
  return 'Archive this Internal Agent?';
}

function lifecycleDescription(action: 'activate' | 'pause' | 'disable' | 'archive' | null): string {
  if (action === 'activate') {
    return 'Activation goes through InternalAgentService and requires a production-eligible Model Policy.';
  }
  if (action === 'pause') return 'Paused agents cannot start new executions.';
  if (action === 'disable') return 'Disabled agents cannot start new executions.';
  return 'Archive keeps the row for Audit display names. This cannot be undone from this UI.';
}
