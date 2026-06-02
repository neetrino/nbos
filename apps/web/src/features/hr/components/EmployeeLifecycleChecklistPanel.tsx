'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DetailSheetSection } from '@/components/shared';
import {
  TEAM_SHEET_BODY_CLASS,
  TEAM_SHEET_SECTION_CLASS,
} from '@/features/hr/constants/team-sheet-layout';
import {
  ChecklistWorkbenchItemRow,
  type ChecklistWorkbenchMarkHandler,
} from '@/features/checklist/checklist-instance-workbench-item-row';
import {
  checklistTemplatesApi,
  parseChecklistInstanceItems,
  type ChecklistInstance,
} from '@/lib/api/checklist-templates';
import { toast } from 'sonner';

interface EmployeeLifecycleChecklistPanelProps {
  employeeId: string;
  ownerEntityType: string;
  title: string;
  loadingLabel: string;
  emptyLabel: string;
  completeToast: string;
  canEdit: boolean;
}

export function EmployeeLifecycleChecklistPanel({
  employeeId,
  ownerEntityType,
  title,
  loadingLabel,
  emptyLabel,
  completeToast,
  canEdit,
}: EmployeeLifecycleChecklistPanelProps) {
  const [instances, setInstances] = useState<ChecklistInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await checklistTemplatesApi.listInstances(ownerEntityType, employeeId);
      setInstances(rows);
    } catch {
      setInstances([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId, ownerEntityType]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleMark: ChecklistWorkbenchMarkHandler = async (instance, item, mark, comment) => {
    if (!canEdit) return;
    const key = `${instance.id}:${item.id}:${mark}`;
    setBusyKey(key);
    try {
      const updated = await checklistTemplatesApi.updateInstanceItem(instance.id, {
        itemId: item.id,
        mark,
        comment,
      });
      setInstances((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update checklist item');
    } finally {
      setBusyKey(null);
    }
  };

  const handleComplete = async (instance: ChecklistInstance) => {
    if (!canEdit) return;
    setBusyKey(`${instance.id}:complete`);
    try {
      const updated = await checklistTemplatesApi.completeInstance(instance.id);
      setInstances((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      toast.success(completeToast);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not complete checklist');
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {loadingLabel}
      </div>
    );
  }

  if (instances.length === 0) {
    return <p className="text-muted-foreground px-5 py-10 text-center text-sm">{emptyLabel}</p>;
  }

  return (
    <div className={TEAM_SHEET_BODY_CLASS}>
      {instances.map((instance) => {
        const items = parseChecklistInstanceItems(instance.snapshotItems);
        const reviewed = items.filter(
          (item) => item.mark === 'DONE' || item.mark === 'NOT_DONE',
        ).length;
        return (
          <DetailSheetSection key={instance.id} title={title} className={TEAM_SHEET_SECTION_CLASS}>
            <p className="text-muted-foreground mb-3 text-xs tabular-nums">
              {reviewed}/{items.length} items reviewed
              {instance.completedAt ? ' · Completed' : ''}
            </p>
            <ul className="space-y-2">
              {items.map((item, index) => (
                <ChecklistWorkbenchItemRow
                  key={item.id}
                  index={index}
                  instance={instance}
                  item={item}
                  disabled={!canEdit || Boolean(instance.completedAt)}
                  busy={busyKey?.startsWith(`${instance.id}:${item.id}:`) ?? false}
                  onMark={handleMark}
                />
              ))}
            </ul>
            {canEdit && !instance.completedAt ? (
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  disabled={busyKey === `${instance.id}:complete`}
                  onClick={() => void handleComplete(instance)}
                >
                  Complete checklist
                </Button>
              </div>
            ) : null}
          </DetailSheetSection>
        );
      })}
    </div>
  );
}
