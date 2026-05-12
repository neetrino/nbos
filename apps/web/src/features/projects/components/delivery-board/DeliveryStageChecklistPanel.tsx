'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, ClipboardCheck, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  checklistTemplatesApi,
  parseChecklistInstanceItems,
  type ChecklistInstance,
  type ChecklistInstanceItem,
  type ChecklistInstanceItemMark,
} from '@/lib/api/checklist-templates';
import type { DeliveryLifecycleProjection } from '@/lib/api/projects';

interface DeliveryStageChecklistPanelProps {
  ownerEntityType: 'PRODUCT' | 'EXTENSION';
  ownerEntityId: string;
  lifecycle: DeliveryLifecycleProjection | undefined;
  onChanged: () => void;
}

export function DeliveryStageChecklistPanel({
  ownerEntityType,
  ownerEntityId,
  lifecycle,
  onChanged,
}: DeliveryStageChecklistPanelProps) {
  const [instances, setInstances] = useState<ChecklistInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setInstances(await checklistTemplatesApi.listInstances(ownerEntityType, ownerEntityId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load stage checklists.');
    } finally {
      setLoading(false);
    }
  }, [ownerEntityType, ownerEntityId]);

  useEffect(() => {
    if (!lifecycle?.stage || lifecycle.isTerminal) {
      setInstances([]);
      return;
    }
    void load();
  }, [lifecycle?.stage, lifecycle?.isTerminal, load]);

  const stageInstances = useMemo(() => {
    if (!lifecycle?.stage) return [];
    return instances.filter((instance) => instance.deliveryStage === lifecycle.stage);
  }, [instances, lifecycle?.stage]);

  const handleMark = async (
    instance: ChecklistInstance,
    item: ChecklistInstanceItem,
    mark: ChecklistInstanceItemMark,
    comment?: string,
  ) => {
    setBusyKey(`${instance.id}:${item.id}`);
    setError(null);
    try {
      await checklistTemplatesApi.updateInstanceItem(instance.id, {
        itemId: item.id,
        mark,
        comment,
      });
      await load();
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update checklist item.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleComplete = async (instance: ChecklistInstance) => {
    setBusyKey(`${instance.id}:complete`);
    setError(null);
    try {
      await checklistTemplatesApi.completeInstance(instance.id);
      await load();
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not complete checklist.');
    } finally {
      setBusyKey(null);
    }
  };

  if (!lifecycle?.stage || lifecycle.isTerminal) return null;

  return (
    <section className="border-border bg-card/40 rounded-xl border p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-muted-foreground flex items-center gap-2 text-[10px] font-semibold tracking-wider uppercase">
            <ClipboardCheck className="size-3.5" aria-hidden />
            Stage checklists
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Complete each checklist to pass this stage gate.
          </p>
        </div>
        {loading ? <Loader2 className="text-muted-foreground size-4 animate-spin" /> : null}
      </div>

      {error ? <p className="text-destructive mb-3 text-xs">{error}</p> : null}

      {!loading && stageInstances.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No checklist template is bound to this stage.
        </p>
      ) : (
        <div className="space-y-3">
          {stageInstances.map((instance) => (
            <ChecklistInstanceBlock
              key={instance.id}
              instance={instance}
              busyKey={busyKey}
              onMark={handleMark}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ChecklistInstanceBlock({
  instance,
  busyKey,
  onMark,
  onComplete,
}: {
  instance: ChecklistInstance;
  busyKey: string | null;
  onMark: (
    instance: ChecklistInstance,
    item: ChecklistInstanceItem,
    mark: ChecklistInstanceItemMark,
    comment?: string,
  ) => Promise<void>;
  onComplete: (instance: ChecklistInstance) => Promise<void>;
}) {
  const items = parseChecklistInstanceItems(instance.snapshotItems);
  const complete = Boolean(instance.completedAt);
  const reviewedCount = items.filter(
    (item) => item.mark === 'DONE' || item.mark === 'NOT_DONE',
  ).length;

  return (
    <div className="border-border bg-background/50 rounded-lg border p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{instance.template.name}</p>
          <p className="text-muted-foreground text-xs">
            v{instance.templateVersion.versionNumber} · {reviewedCount}/{items.length} reviewed
          </p>
        </div>
        <span
          className={
            complete
              ? 'rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700'
              : 'bg-muted text-muted-foreground rounded-full px-2 py-1 text-[10px] font-semibold'
          }
        >
          {complete ? 'Complete' : 'Open'}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <ChecklistItemRow
            key={item.id}
            instance={instance}
            item={item}
            disabled={complete}
            busy={busyKey === `${instance.id}:${item.id}`}
            onMark={onMark}
          />
        ))}
      </div>
      <Button
        type="button"
        size="sm"
        className="mt-3"
        disabled={complete || busyKey === `${instance.id}:complete`}
        onClick={() => void onComplete(instance)}
      >
        {busyKey === `${instance.id}:complete` ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            Completing…
          </>
        ) : (
          'Complete checklist'
        )}
      </Button>
    </div>
  );
}

function ChecklistItemRow({
  instance,
  item,
  disabled,
  busy,
  onMark,
}: {
  instance: ChecklistInstance;
  item: ChecklistInstanceItem;
  disabled: boolean;
  busy: boolean;
  onMark: (
    instance: ChecklistInstance,
    item: ChecklistInstanceItem,
    mark: ChecklistInstanceItemMark,
    comment?: string,
  ) => Promise<void>;
}) {
  const [comment, setComment] = useState(item.comment ?? '');

  useEffect(() => {
    setComment(item.comment ?? '');
  }, [item.comment]);

  const Icon = item.mark === 'DONE' ? CheckCircle2 : item.mark === 'NOT_DONE' ? XCircle : Circle;

  return (
    <div className="border-border rounded-md border p-3">
      <div className="flex items-start gap-2">
        <Icon
          className={
            item.mark === 'DONE'
              ? 'mt-0.5 size-4 shrink-0 text-emerald-600'
              : item.mark === 'NOT_DONE'
                ? 'mt-0.5 size-4 shrink-0 text-red-600'
                : 'text-muted-foreground mt-0.5 size-4 shrink-0'
          }
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{item.title}</p>
          {item.instruction ? (
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{item.instruction}</p>
          ) : null}
          {item.decisionRequired ? (
            <p className="text-muted-foreground mt-1 text-[11px]">Required review</p>
          ) : null}
        </div>
      </div>
      <Textarea
        className="mt-2 min-h-16 text-xs"
        placeholder="Comment or Not Done reason"
        value={comment}
        disabled={disabled}
        onChange={(event) => setComment(event.target.value)}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled || busy}
          onClick={() => void onMark(instance, item, 'DONE', comment)}
        >
          Done
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || busy}
          onClick={() => void onMark(instance, item, 'NOT_DONE', comment)}
        >
          Not Done
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled || busy}
          onClick={() => void onMark(instance, item, 'PENDING')}
        >
          Pending
        </Button>
      </div>
    </div>
  );
}
