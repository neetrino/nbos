'use client';

import { useCallback, useEffect, useState } from 'react';
import { Route } from 'lucide-react';
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
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import {
  aiAdminApi,
  type AiModelPolicyView,
  type AiModelView,
  type AiProviderConnectionView,
} from '@/lib/api/ai-admin';
import { AI_ADMIN_POLICY_MODES, type AiAdminPolicyMode } from '../constants';
import { productionEligibleModels } from '../model-catalog-groups';
import { applySelectValue } from '../select-value';
import { agentStateVariant } from '../status-badge-map';
import { DisableImpactConfirm } from './DisableImpactConfirm';
import { PolicyCandidateEditor } from './PolicyCandidateEditor';
import { ModelSelect } from './PolicyModelSelect';

export function ModelPolicyPanel() {
  const [policies, setPolicies] = useState<AiModelPolicyView[]>([]);
  const [models, setModels] = useState<AiModelView[]>([]);
  const [connections, setConnections] = useState<AiProviderConnectionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDisable, setPendingDisable] = useState<AiModelPolicyView | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextPolicies, nextModels, nextConnections] = await Promise.all([
        aiAdminApi.listPolicies(),
        aiAdminApi.listModels(),
        aiAdminApi.listProviders(),
      ]);
      setPolicies(nextPolicies);
      setModels(nextModels);
      setConnections(nextConnections);
      setError(null);
    } catch {
      setError('Model policies could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;

  const eligible = productionEligibleModels(models, connections);
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Phase 1 modes: FIXED and PRIMARY_FALLBACK. Candidates may come from different providers.
        TIERED and ADAPTIVE are not available.
      </p>
      <PolicyCreateForm eligible={eligible} onCreated={() => void load()} />
      {policies.length === 0 ? (
        <EmptyState
          icon={Route}
          title="No Model Policies"
          description="Create a FIXED or PRIMARY_FALLBACK policy from production-eligible models."
        />
      ) : (
        policies.map((policy) => (
          <article key={policy.id} className="border-border bg-card rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold">{policy.name}</h2>
                <p className="text-muted-foreground text-xs">
                  {policy.mode} · v{policy.version}
                </p>
              </div>
              <StatusBadge label={policy.status} variant={agentStateVariant(policy.status)} />
            </div>
            <ul className="mt-3 space-y-1 text-xs">
              {policy.candidates.map((candidate) => (
                <li key={candidate.id}>
                  {candidate.role} #{candidate.priority} · {modelLabel(models, candidate.modelId)}
                  {candidate.enabled ? '' : ' (disabled)'}
                </li>
              ))}
            </ul>
            <PolicyCandidateEditor
              policy={policy}
              eligible={eligible}
              onChanged={() => void load()}
            />
            <div className="mt-3 flex gap-2">
              {policy.status !== 'ACTIVE' ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void aiAdminApi
                      .activatePolicy(policy.id)
                      .then(load)
                      .catch(() => toast.error('Activate failed.'))
                  }
                >
                  Activate
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPendingDisable(policy)}
                >
                  Disable
                </Button>
              )}
            </div>
          </article>
        ))
      )}
      <DisableImpactConfirm
        open={pendingDisable !== null}
        kind="policy"
        targetId={pendingDisable?.id ?? null}
        title="Disable this Model Policy?"
        confirmLabel="Disable"
        onOpenChange={(open) => {
          if (!open) setPendingDisable(null);
        }}
        onConfirm={() => {
          if (!pendingDisable) return;
          void aiAdminApi
            .disablePolicy(pendingDisable.id)
            .then(() => {
              setPendingDisable(null);
              return load();
            })
            .catch(() => toast.error('Disable failed.'));
        }}
      />
    </div>
  );
}

function PolicyCreateForm(props: { eligible: AiModelView[]; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<AiAdminPolicyMode>('FIXED');
  const [primaryId, setPrimaryId] = useState('');
  const [fallbackId, setFallbackId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const candidates =
      mode === 'FIXED'
        ? [{ modelId: primaryId, role: 'PRIMARY' as const, priority: 0 }]
        : [
            { modelId: primaryId, role: 'PRIMARY' as const, priority: 0 },
            { modelId: fallbackId, role: 'FALLBACK' as const, priority: 10 },
          ];
    setSubmitting(true);
    try {
      await aiAdminApi.createPolicy({ name: name.trim(), mode, candidates });
      setName('');
      setPrimaryId('');
      setFallbackId('');
      props.onCreated();
    } catch {
      toast.error('Policy create failed. Use only ACTIVE models.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-border bg-card space-y-3 rounded-xl border p-4">
      <h2 className="text-sm font-semibold">Create policy</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="policy-name">Name</Label>
          <Input id="policy-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Mode</Label>
          <Select
            value={mode}
            onValueChange={(value) =>
              applySelectValue(value, (next) => setMode(next as AiAdminPolicyMode))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_ADMIN_POLICY_MODES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ModelSelect
          label="Primary model"
          value={primaryId}
          onChange={setPrimaryId}
          models={props.eligible}
        />
        {mode === 'PRIMARY_FALLBACK' ? (
          <ModelSelect
            label="Fallback model"
            value={fallbackId}
            onChange={setFallbackId}
            models={props.eligible}
          />
        ) : null}
      </div>
      <Button
        type="button"
        size="sm"
        disabled={
          !name.trim() || !primaryId || (mode === 'PRIMARY_FALLBACK' && !fallbackId) || submitting
        }
        onClick={() => void submit()}
      >
        Create
      </Button>
    </section>
  );
}

function modelLabel(models: AiModelView[], id: string): string {
  const model = models.find((item) => item.id === id);
  return model ? `${model.provider} / ${model.displayName}` : id.slice(0, 8);
}
