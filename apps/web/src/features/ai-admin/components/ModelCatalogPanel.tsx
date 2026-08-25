'use client';

import { useCallback, useEffect, useState } from 'react';
import { Cpu } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { aiAdminApi, type AiModelView, type AiProviderConnectionView } from '@/lib/api/ai-admin';
import { AI_ADMIN_CARD_GRID_CLASS, AI_ADMIN_PAGE_STACK_CLASS } from '../ai-admin-ui.constants';
import { AI_ADMIN_MODEL_SORTS, type AiAdminModelSort } from '../constants';
import { groupModelsForAdmin } from '../model-catalog-groups';
import { applySelectValue } from '../select-value';
import { DisableImpactConfirm } from './DisableImpactConfirm';
import { AiAdminPageToolbar } from './AiAdminPageToolbar';
import { AiAdminProviderBrand } from './AiAdminProviderBrand';
import { ModelCatalogCard } from './ModelCatalogCard';

export function ModelCatalogPanel() {
  const [models, setModels] = useState<AiModelView[]>([]);
  const [connections, setConnections] = useState<AiProviderConnectionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [sort, setSort] = useState<AiAdminModelSort>('newest');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextModels, nextConnections] = await Promise.all([
        aiAdminApi.listModels(),
        aiAdminApi.listProviders(),
      ]);
      setModels(nextModels);
      setConnections(nextConnections);
      setError(null);
    } catch {
      setError('Model catalog could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sync = async (connectionId: string) => {
    setSyncing(connectionId);
    try {
      await aiAdminApi.syncProviderModels(connectionId);
      toast.success('Sync finished. New models stay DISCOVERED.');
      await load();
    } catch {
      toast.error('Model sync failed.');
    } finally {
      setSyncing(null);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;

  const groups = groupModelsForAdmin(models, sort);
  const activeConnections = connections.filter((item) => item.status === 'ACTIVE');
  return (
    <div className={AI_ADMIN_PAGE_STACK_CLASS}>
      <AiAdminPageToolbar
        icon={Cpu}
        description="Sync never auto-activates. Only ACTIVE models can be production routing candidates."
        actions={
          <Select
            value={sort}
            onValueChange={(value) =>
              applySelectValue(value, (next) => setSort(next as AiAdminModelSort))
            }
          >
            <SelectTrigger size="sm" className="w-40" aria-label="Sort models">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_ADMIN_MODEL_SORTS.map((value) => (
                <SelectItem key={value} value={value}>
                  {modelSortLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      {activeConnections.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {activeConnections.map((connection) => (
            <Button
              key={connection.id}
              type="button"
              size="sm"
              variant="outline"
              disabled={syncing === connection.id}
              onClick={() => void sync(connection.id)}
            >
              <AiAdminProviderBrand provider={connection.provider} className="size-3.5" />
              Sync {connection.name}
            </Button>
          ))}
        </div>
      ) : null}
      {models.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title="Catalog is empty"
          description="Connect a provider, then Sync. Newly listed models appear as DISCOVERED."
        />
      ) : (
        <>
          <ModelGroup
            title="DISCOVERED — review before production"
            models={groups.discovered}
            onChanged={load}
          />
          <ModelGroup
            title="ACTIVE — production eligible"
            models={groups.active}
            onChanged={load}
          />
          <ModelGroup title="Other statuses" models={groups.other} onChanged={load} />
        </>
      )}
    </div>
  );
}

function ModelGroup(props: {
  title: string;
  models: AiModelView[];
  onChanged: () => Promise<void>;
}) {
  const [pendingDisable, setPendingDisable] = useState<AiModelView | null>(null);
  const [busy, setBusy] = useState(false);
  if (props.models.length === 0) return null;
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold tracking-tight">
        {props.title}
        <span className="text-muted-foreground ml-2 font-normal">{props.models.length}</span>
      </h2>
      <div className={AI_ADMIN_CARD_GRID_CLASS}>
        {props.models.map((model) => (
          <ModelCatalogCard
            key={model.id}
            model={model}
            onChanged={props.onChanged}
            onDisable={() => setPendingDisable(model)}
          />
        ))}
      </div>
      <DisableImpactConfirm
        open={pendingDisable !== null}
        kind="model"
        targetId={pendingDisable?.id ?? null}
        title="Disable this model?"
        confirmLabel="Disable"
        isSubmitting={busy}
        onOpenChange={(open) => {
          if (!open) setPendingDisable(null);
        }}
        onConfirm={() => {
          if (!pendingDisable) return;
          setBusy(true);
          void aiAdminApi
            .disableModel(pendingDisable.id)
            .then(props.onChanged)
            .catch(() => toast.error('Disable failed.'))
            .finally(() => {
              setBusy(false);
              setPendingDisable(null);
            });
        }}
      />
    </section>
  );
}

function modelSortLabel(sort: AiAdminModelSort): string {
  if (sort === 'oldest') return 'Oldest first';
  if (sort === 'name') return 'Name A–Z';
  return 'Newest first';
}
