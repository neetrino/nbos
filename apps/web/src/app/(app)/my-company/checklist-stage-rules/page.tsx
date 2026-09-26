'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog, useDeleteConfirm } from '@/components/shared';
import { useCompanySectionTabs } from '@/features/hr/components/use-company-section-tabs';
import {
  checklistTemplatesApi,
  type ChecklistTemplateListItem,
  type DeliveryStageChecklistRuleRow,
} from '@/lib/api/checklist-templates';
import { PermissionGate } from '@/lib/permissions';
import { toast } from 'sonner';
import { StageRuleCard } from './stage-rule-card';
import { StageRuleCreateSheet } from './stage-rule-create-sheet';
import { StageRuleDetailSheet } from './stage-rule-detail-sheet';

export default function ChecklistStageRulesPage() {
  const [rules, setRules] = useState<DeliveryStageChecklistRuleRow[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [openRule, setOpenRule] = useState<DeliveryStageChecklistRuleRow | null>(null);
  const deleteConfirm = useDeleteConfirm();
  const sectionTabs = useCompanySectionTabs('checklists', undefined, 'below');

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
      const updated = await checklistTemplatesApi.updateStageRule(row.id, {
        isActive: !row.isActive,
      });
      setOpenRule(updated);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const performDelete = async (id: string) => {
    try {
      await checklistTemplatesApi.deleteStageRule(id);
      toast.success('Rule removed');
      setOpenRule(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {sectionTabs}
      <StageRulesHeader onCreate={() => setCreating(true)} />
      <StageRulesGrid loading={loading} rules={rules} onOpen={setOpenRule} />
      <StageRuleCreateSheet
        open={creating}
        templates={templates}
        onOpenChange={setCreating}
        onCreated={load}
      />
      <StageRuleDetailSheet
        rule={openRule}
        open={openRule != null}
        onOpenChange={(open) => {
          if (!open) setOpenRule(null);
        }}
        onToggleActive={(row) => void onToggleActive(row)}
        onDelete={(row) => deleteConfirm.request({ id: row.id, name: row.checklistTemplate.name })}
      />
      <DeleteConfirmDialog
        level="simple"
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        itemName={deleteConfirm.target?.name ?? ''}
        title="Delete stage rule?"
        description="This checklist will no longer start when items enter this stage."
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

function StageRulesHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <p className="text-muted-foreground max-w-3xl text-sm">
        When a delivery item enters a stage, the matching checklist starts on its own.
      </p>
      <PermissionGate module="CHECKLIST_TEMPLATES" action="EDIT">
        <Button type="button" size="sm" onClick={onCreate}>
          <Plus className="size-4" aria-hidden />
          New rule
        </Button>
      </PermissionGate>
    </div>
  );
}

function StageRulesGrid({
  loading,
  rules,
  onOpen,
}: {
  loading: boolean;
  rules: DeliveryStageChecklistRuleRow[];
  onOpen: (row: DeliveryStageChecklistRuleRow) => void;
}) {
  if (loading) return <p className="text-muted-foreground text-sm">Loading…</p>;
  if (rules.length === 0) return <p className="text-muted-foreground text-sm">No rules yet.</p>;
  return (
    <ul className="grid w-full grid-cols-2 items-stretch gap-3 xl:grid-cols-3 2xl:grid-cols-4">
      {rules.map((row) => (
        <StageRuleCard key={row.id} row={row} onOpen={onOpen} />
      ))}
    </ul>
  );
}
