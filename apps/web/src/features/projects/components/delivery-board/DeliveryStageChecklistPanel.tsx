'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  checklistTemplatesApi,
  parseChecklistInstanceItems,
  type ChecklistInstance,
  type ChecklistInstanceItem,
  type ChecklistInstanceItemMark,
} from '@/lib/api/checklist-templates';
import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import {
  ChecklistInstanceWorkbenchSheet,
  ChecklistWorkbenchStatusIcon,
  computeChecklistWorkbenchTriggerVariant,
} from '@/features/checklist/checklist-instance-workbench-sheet';
import { cn } from '@/lib/utils';

interface DeliveryStageChecklistPanelProps {
  ownerEntityType: 'PRODUCT' | 'EXTENSION';
  ownerEntityId: string;
  lifecycle: DeliveryLifecycleProjection | undefined;
  onChanged: () => void;
}

function aggregateReviewed(instances: ChecklistInstance[]): { reviewed: number; total: number } {
  let reviewed = 0;
  let total = 0;
  for (const instance of instances) {
    const items = parseChecklistInstanceItems(instance.snapshotItems);
    for (const item of items) {
      total += 1;
      if (item.mark === 'DONE' || item.mark === 'NOT_DONE') reviewed += 1;
    }
  }
  return { reviewed, total };
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
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const { reviewed, total } = useMemo(() => aggregateReviewed(stageInstances), [stageInstances]);

  const statusVariant = useMemo(
    () => computeChecklistWorkbenchTriggerVariant(stageInstances, loading),
    [stageInstances, loading],
  );

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
    <>
      <section className="border-border bg-card/40 rounded-xl border p-4">
        <div className="mb-3">
          <h3 className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
            Stage checklists
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Open the drawer to review all items — up to many steps stay scrollable there.
          </p>
        </div>

        {!loading && stageInstances.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No checklist template is bound to this stage.
          </p>
        ) : (
          <Button
            type="button"
            variant="outline"
            className={cn(
              'h-auto w-full justify-between gap-3 rounded-lg border px-3 py-3 text-left',
              statusVariant === 'complete' &&
                'border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20',
              statusVariant === 'attention' &&
                'border-amber-200/80 bg-amber-50/35 dark:border-amber-900/50 dark:bg-amber-950/20',
            )}
            onClick={() => setSheetOpen(true)}
            disabled={loading || stageInstances.length === 0}
          >
            <span className="flex min-w-0 flex-1 items-center gap-3">
              {loading ? (
                <Loader2
                  className="text-muted-foreground size-5 shrink-0 animate-spin"
                  aria-hidden
                />
              ) : (
                <ChecklistWorkbenchStatusIcon variant={statusVariant} className="shrink-0" />
              )}
              <span className="min-w-0 flex-1">
                <span className="text-foreground block text-sm font-semibold">
                  {stageInstances.length === 1
                    ? (stageInstances[0]?.template.name ?? 'Checklist')
                    : `${stageInstances.length} checklists`}
                </span>
                <span className="text-muted-foreground mt-0.5 block text-xs">
                  {loading
                    ? 'Loading…'
                    : total > 0
                      ? `${reviewed}/${total} reviewed`
                      : 'View checklist'}
                </span>
              </span>
            </span>
            <ChevronRight
              className="text-muted-foreground size-4 shrink-0 opacity-70"
              aria-hidden
            />
          </Button>
        )}
      </section>

      <ChecklistInstanceWorkbenchSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Stage checklists"
        description="Complete each checklist to pass this stage gate. Items are listed in order with full context."
        instances={stageInstances}
        loading={loading}
        error={error}
        busyKey={busyKey}
        onMark={handleMark}
        onComplete={handleComplete}
      />
    </>
  );
}
