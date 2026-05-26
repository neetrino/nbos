'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Loader2, Route } from 'lucide-react';
import { DeleteConfirmDialog, PageHero, StatusBadge, useDeleteConfirm } from '@/components/shared';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  checklistTemplatesApi,
  type ChecklistTemplateListItem,
  type DeliveryStageChecklistRuleRow,
} from '@/lib/api/checklist-templates';
import { cn } from '@/lib/utils';
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

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      <PageHero
        title="Delivery checklist stage rules"
        trailing={
          <Link
            href="/my-company/checklist-templates"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Checklist templates
          </Link>
        }
      />
      <p className="text-muted-foreground text-sm">
        When a product or extension enters a stage, matching rules create checklist instances from
        the published template snapshot.
      </p>

      <NewStageRuleFormCard templates={templates} onCreated={load} />

      <Card className="border-border/80 overflow-hidden shadow-sm shadow-black/[0.04]">
        <div className="border-border/60 bg-muted/30 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Route className="size-4 shrink-0 opacity-70" aria-hidden />
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading rules…
              </span>
            ) : (
              <span>
                {rules.length} rule{rules.length === 1 ? '' : 's'} ·{' '}
                <span className="text-foreground font-medium">{activeRuleCount} active</span>
              </span>
            )}
          </div>
          {!loading && rules.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              <StatusBadge label="Active" variant="green" dot dotColor="bg-emerald-500" />
              <StatusBadge label="Paused" variant="gray" dot dotColor="bg-zinc-400" />
            </div>
          ) : null}
        </div>
        <ul className="divide-border/60 divide-y">
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
