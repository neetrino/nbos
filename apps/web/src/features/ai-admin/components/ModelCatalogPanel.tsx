'use client';

import { useCallback, useEffect, useState } from 'react';
import { Cpu } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { aiAdminApi, type AiModelView, type AiProviderConnectionView } from '@/lib/api/ai-admin';
import { groupModelsForAdmin } from '../model-catalog-groups';
import { formatTimestamp } from '../format';
import { agentStateVariant } from '../status-badge-map';
import { DisableImpactConfirm } from './DisableImpactConfirm';

export function ModelCatalogPanel() {
  const [models, setModels] = useState<AiModelView[]>([]);
  const [connections, setConnections] = useState<AiProviderConnectionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

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

  const groups = groupModelsForAdmin(models);
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Sync never auto-activates. Only ACTIVE models can be production routing candidates.
      </p>
      <div className="flex flex-wrap gap-2">
        {connections
          .filter((item) => item.status === 'ACTIVE')
          .map((connection) => (
            <Button
              key={connection.id}
              type="button"
              size="sm"
              variant="outline"
              disabled={syncing === connection.id}
              onClick={() => void sync(connection.id)}
            >
              Sync {connection.name}
            </Button>
          ))}
      </div>
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
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">{props.title}</h2>
      {props.models.map((model) => (
        <ModelCard
          key={model.id}
          model={model}
          onChanged={props.onChanged}
          onDisable={() => setPendingDisable(model)}
        />
      ))}
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

function ModelCard(props: {
  model: AiModelView;
  onChanged: () => Promise<void>;
  onDisable: () => void;
}) {
  const { model } = props;
  const metadataKeys = Object.keys(model.providerMetadata);
  return (
    <article className="border-border bg-card rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{model.displayName}</h3>
          <p className="text-muted-foreground font-mono text-xs">
            {model.provider} · {model.providerModelId}
          </p>
        </div>
        <StatusBadge label={model.status} variant={agentStateVariant(model.status)} />
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        Discovered {formatTimestamp(model.discoveredAt)} · Last seen{' '}
        {formatTimestamp(model.lastSeenAt)}
      </p>
      {metadataKeys.length > 0 ? (
        <p className="text-muted-foreground mt-2 text-xs">
          Provider metadata: {metadataKeys.join(', ')}
        </p>
      ) : null}
      {model.suitabilityTags.length > 0 ? (
        <p className="mt-2 text-xs">Tags: {model.suitabilityTags.join(', ')}</p>
      ) : null}
      <div className="mt-2 space-y-1.5">
        <Label htmlFor={`model-notes-${model.id}`}>Internal notes</Label>
        <Input
          id={`model-notes-${model.id}`}
          defaultValue={model.notes ?? ''}
          onBlur={(event) => {
            const notes = event.target.value.trim() || null;
            if (notes === (model.notes ?? null)) return;
            void aiAdminApi
              .updateModel(model.id, { notes })
              .then(props.onChanged)
              .catch(() => toast.error('Notes could not be saved.'));
          }}
        />
      </div>
      <div className="mt-3 flex gap-2">
        {model.status !== 'ACTIVE' && model.status !== 'UNAVAILABLE' ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              void aiAdminApi
                .activateModel(model.id)
                .then(props.onChanged)
                .catch(() => toast.error('Activate failed.'))
            }
          >
            Activate
          </Button>
        ) : null}
        {model.status === 'ACTIVE' ? (
          <Button type="button" size="sm" variant="outline" onClick={props.onDisable}>
            Disable
          </Button>
        ) : null}
      </div>
    </article>
  );
}
