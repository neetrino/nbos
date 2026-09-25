'use client';

import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Route } from 'lucide-react';
import { DeleteConfirmDialog, useDeleteConfirm } from '@/components/shared';
import { useCompanySectionTabs } from '@/features/hr/components/use-company-section-tabs';
import { Card } from '@/components/ui/card';
import {
  checklistTemplatesApi,
  type ChecklistTemplateListItem,
  type DeliveryStageChecklistRuleRow,
} from '@/lib/api/checklist-templates';
import { toast } from 'sonner';
import { NewStageRuleFormCard } from './new-stage-rule-form-card';
import { StageRuleListItem } from './stage-rule-list-item';

export default function ChecklistStageRulesPage() {
  const [rules, setRules] = useState<DeliveryStageChecklistRuleRow[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const deleteConfirm = useDeleteConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ruleRows, tpl] = await Promise.all([
        checklistTemplatesApi.listStageRules(),
        checklistTemplatesApi.list(),
      ]);
      setRules(ruleRows ?? []);
      setTemplates(tpl ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load stage rules');
      setRules([]);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onToggleActive = async (row: DeliveryStageChecklistRuleRow) => {
    try {
      await checklistTemplatesApi.updateStageRule(row.id, { isActive: !row.isActive });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const performDelete = async (id: string) => {
    try {
      await checklistTemplatesApi.deleteStageRule(id);
      toast.success('Rule removed');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const activeRuleCount = rules.filter((r) => r.isActive).length;

  useCompanySectionTabs('checklists');

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 pb-10">
      <NewStageRuleFormCard templates={templates} onCreated={load} />

      <Card className="border-border bg-card relative overflow-hidden rounded-2xl border p-4 shadow-none">
        <div className="bg-primary/15 pointer-events-none absolute -top-12 -right-8 size-28 rounded-full blur-2xl" />
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
              <Route size={15} />
            </div>
            <h2 className="text-foreground text-sm font-semibold">Stage rules</h2>
          </div>
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
            {loading ? '…' : `${activeRuleCount}/${rules.length}`}
          </span>
        </div>
        <ul className="relative mt-3 flex flex-col gap-1">
          {rules.map((row) => (
            <StageRuleListItem
              key={row.id}
              row={row}
              onToggleActive={onToggleActive}
              onDelete={(id) => {
                const row = rules.find((rule) => rule.id === id);
                if (!row) return;
                deleteConfirm.request({
                  id,
                  name: row.checklistTemplate.name,
                });
              }}
            />
          ))}
          {!loading && rules.length === 0 ? (
            <li className="text-muted-foreground flex flex-col items-center gap-3 px-6 py-14 text-center text-sm">
              <span className="bg-muted/80 text-muted-foreground flex size-12 items-center justify-center rounded-2xl">
                <ClipboardList className="size-6 opacity-60" aria-hidden />
              </span>
              <div className="max-w-sm space-y-1">
                <p className="text-foreground font-medium">No stage rules yet</p>
                <p>
                  Add a rule above to automatically spawn checklists when delivery items enter the
                  selected stage.
                </p>
              </div>
            </li>
          ) : null}
        </ul>
      </Card>

      <DeleteConfirmDialog
        level="simple"
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        itemName={deleteConfirm.target?.name ?? ''}
        title="Delete stage rule?"
        description="Checklists will no longer auto-spawn when items enter this stage."
        onConfirm={() => {
          const id = deleteConfirm.target?.id;
          if (!id) return;
          deleteConfirm.clear();
          void performDelete(id);
        }}
      />
    </div>
  );
}
