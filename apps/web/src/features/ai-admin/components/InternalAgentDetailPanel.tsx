'use client';

import { useCallback, useEffect, useState } from 'react';
import { BrainCircuit, Route, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react';
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
import { ErrorState, LoadingState } from '@/components/shared';
import { cn } from '@/lib/utils';
import { aiAdminApi, type AiModelPolicyView, type InternalAiAgentView } from '@/lib/api/ai-admin';
import { AI_ADMIN_BASE_PATH } from '../constants';
import {
  AI_ADMIN_DETAIL_PAIR_CLASS,
  AI_ADMIN_ICON_ACCENT_CLASS,
  AI_ADMIN_PAGE_STACK_CLASS,
} from '../ai-admin-ui.constants';
import { agentStateVariant } from '../status-badge-map';
import { AiAdminConfirmDialog } from './AiAdminConfirmDialog';
import { AiAdminDetailHeader } from './AiAdminDetailHeader';
import { AiAdminSection } from './AiAdminSection';
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
  if (error || !agent) {
    return <ErrorState description={error ?? 'Not found'} onRetry={() => void load()} />;
  }

  const archived = agent.status === 'ARCHIVED';
  return (
    <div className={AI_ADMIN_PAGE_STACK_CLASS}>
      <div className={AI_ADMIN_DETAIL_PAIR_CLASS}>
        <AiAdminDetailHeader
          backHref={`${AI_ADMIN_BASE_PATH}/internal-agents`}
          backLabel="Internal Agents"
          icon={BrainCircuit}
          name={agent.name}
          purpose={agent.description ?? ''}
          statusLabel={agent.status}
          statusVariant={agentStateVariant(agent.status)}
          readOnly
          actions={
            archived ? (
              <p className="text-muted-foreground text-xs">Archived agents stay for Audit names.</p>
            ) : (
              <InternalAgentLifecycleButtons status={agent.status} onConfirm={setConfirm} />
            )
          }
        />
        <InternalAgentPolicySection
          agent={agent}
          policies={policies}
          archived={archived}
          onReload={load}
        />
      </div>
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
        onConfirm={() => void runInternalLifecycle(confirm, agent.id, setBusy, setConfirm, load)}
      />
    </div>
  );
}

function InternalAgentLifecycleButtons(props: {
  status: InternalAiAgentView['status'];
  onConfirm: (action: 'activate' | 'pause' | 'disable' | 'archive') => void;
}) {
  return (
    <>
      {props.status !== 'ACTIVE' ? (
        <Button type="button" size="sm" onClick={() => props.onConfirm('activate')}>
          Activate
        </Button>
      ) : null}
      {props.status === 'ACTIVE' ? (
        <Button type="button" size="sm" variant="outline" onClick={() => props.onConfirm('pause')}>
          Pause
        </Button>
      ) : null}
      {props.status !== 'DISABLED' ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => props.onConfirm('disable')}
        >
          Disable
        </Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="destructive"
        onClick={() => props.onConfirm('archive')}
      >
        Archive
      </Button>
    </>
  );
}

function InternalAgentPolicySection(props: {
  agent: InternalAiAgentView;
  policies: AiModelPolicyView[];
  archived: boolean;
  onReload: () => Promise<void>;
}) {
  const activePolicies = props.policies.filter((policy) => policy.status === 'ACTIVE');
  return (
    <AiAdminSection
      icon={Route}
      title="Routing policies"
      description="Prompt policy must be a published Prompt Policy id."
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Route className={cn('size-3.5', AI_ADMIN_ICON_ACCENT_CLASS)} aria-hidden />
            Model Policy
          </Label>
          <Select
            value={props.agent.modelPolicyId ?? ''}
            disabled={props.archived}
            onValueChange={(value) => {
              if (!value) return;
              void aiAdminApi
                .updateInternalAgent(props.agent.id, { modelPolicyId: value })
                .then(props.onReload)
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
        <div className="grid gap-3 md:grid-cols-2">
          <PolicyIdField
            id="prompt-policy-id"
            icon={Sparkles}
            label="Prompt policy ID"
            value={props.agent.promptPolicyId ?? ''}
            disabled={props.archived}
            onCommit={(value) =>
              void aiAdminApi
                .updateInternalAgent(props.agent.id, { promptPolicyId: value })
                .then(props.onReload)
                .catch(() => toast.error('Prompt policy assignment failed.'))
            }
          />
          <PolicyIdField
            id="approval-policy-id"
            icon={ShieldCheck}
            label="Approval policy ID"
            value={props.agent.approvalPolicyId ?? ''}
            disabled={props.archived}
            onCommit={(value) =>
              void aiAdminApi
                .updateInternalAgent(props.agent.id, { approvalPolicyId: value })
                .then(props.onReload)
                .catch(() => toast.error('Approval policy assignment failed.'))
            }
          />
        </div>
      </div>
    </AiAdminSection>
  );
}

function PolicyIdField(props: {
  id: string;
  icon: LucideIcon;
  label: string;
  value: string;
  disabled: boolean;
  onCommit: (value: string) => void;
}) {
  const Icon = props.icon;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={props.id} className="flex items-center gap-1.5">
        <Icon className={cn('size-3.5', AI_ADMIN_ICON_ACCENT_CLASS)} aria-hidden />
        {props.label}
      </Label>
      <Input
        id={props.id}
        defaultValue={props.value}
        disabled={props.disabled}
        onBlur={(event) => {
          const next = event.target.value.trim();
          if (!next || next === props.value) return;
          props.onCommit(next);
        }}
      />
    </div>
  );
}

async function runInternalLifecycle(
  confirm: 'activate' | 'pause' | 'disable' | 'archive' | null,
  agentId: string,
  setBusy: (value: boolean) => void,
  setConfirm: (value: 'activate' | 'pause' | 'disable' | 'archive' | null) => void,
  load: () => Promise<void>,
): Promise<void> {
  setBusy(true);
  try {
    if (confirm === 'activate') await aiAdminApi.activateInternalAgent(agentId);
    if (confirm === 'pause') await aiAdminApi.pauseInternalAgent(agentId);
    if (confirm === 'disable') await aiAdminApi.disableInternalAgent(agentId);
    if (confirm === 'archive') await aiAdminApi.archiveInternalAgent(agentId);
    setConfirm(null);
    await load();
  } catch {
    toast.error('Lifecycle change failed. Activation requires an ACTIVE Model Policy.');
  } finally {
    setBusy(false);
  }
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
