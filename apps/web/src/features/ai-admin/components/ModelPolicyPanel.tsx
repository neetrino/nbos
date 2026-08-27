'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Plus, Route } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { cn } from '@/lib/utils';
import {
  aiAdminApi,
  type AiModelPolicyView,
  type AiModelView,
  type AiProviderConnectionView,
} from '@/lib/api/ai-admin';
import {
  AI_ADMIN_FOOTER_BAR_CLASS,
  AI_ADMIN_ICON_ACCENT_CLASS,
  AI_ADMIN_PAGE_STACK_CLASS,
} from '../ai-admin-ui.constants';
import { productionEligibleModels } from '../model-catalog-groups';
import { agentStateVariant } from '../status-badge-map';
import { shortId } from '../format';
import { DisableImpactConfirm } from './DisableImpactConfirm';
import { AiAdminPageToolbar } from './AiAdminPageToolbar';
import { AiAdminSection } from './AiAdminSection';
import { PolicyCandidateEditor } from './PolicyCandidateEditor';
import { PolicyCreateDialog } from './PolicyCreateDialog';

export function ModelPolicyPanel() {
  const [policies, setPolicies] = useState<AiModelPolicyView[]>([]);
  const [models, setModels] = useState<AiModelView[]>([]);
  const [connections, setConnections] = useState<AiProviderConnectionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
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
    <div className={AI_ADMIN_PAGE_STACK_CLASS}>
      <AiAdminPageToolbar
        icon={Route}
        description="Phase 1 modes: FIXED and PRIMARY_FALLBACK. Candidates may come from different providers. TIERED and ADAPTIVE are not available."
        actions={
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Create policy
          </Button>
        }
      />
      <PolicyCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        eligible={eligible}
        onCreated={() => void load()}
      />
      {policies.length === 0 ? (
        <EmptyState
          icon={Route}
          title="No Model Policies"
          description="Create a FIXED or PRIMARY_FALLBACK policy from production-eligible models."
          action={
            <Button type="button" onClick={() => setCreateOpen(true)}>
              Create policy
            </Button>
          }
        />
      ) : (
        policies.map((policy) => (
          <AiAdminSection
            key={policy.id}
            icon={Route}
            title={policy.name}
            description={`${policy.mode} · v${policy.version}`}
            actions={
              <StatusBadge label={policy.status} variant={agentStateVariant(policy.status)} />
            }
          >
            <ul className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              {policy.candidates.map((candidate, index) => (
                <li key={candidate.id} className="flex items-center gap-2">
                  {index > 0 ? (
                    <ArrowRight
                      className={cn('size-3.5', AI_ADMIN_ICON_ACCENT_CLASS)}
                      aria-hidden
                    />
                  ) : null}
                  <span className="bg-muted rounded-full px-2.5 py-1">
                    {candidate.role} #{candidate.priority} · {modelLabel(models, candidate.modelId)}
                    {candidate.enabled ? '' : ' (disabled)'}
                  </span>
                </li>
              ))}
            </ul>
            <PolicyCandidateEditor
              policy={policy}
              eligible={eligible}
              onChanged={() => void load()}
            />
            <div className={AI_ADMIN_FOOTER_BAR_CLASS}>
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
          </AiAdminSection>
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

function modelLabel(models: AiModelView[], id: string): string {
  const model = models.find((item) => item.id === id);
  return model ? `${model.provider} / ${model.displayName}` : shortId(id);
}
