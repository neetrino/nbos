'use client';

import { useMemo, useState } from 'react';
import { Layers, ListChecks, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { InlineField } from '@/components/shared';
import {
  checklistTemplatesApi,
  type ChecklistTemplateListItem,
  type CreateDeliveryStageChecklistRuleBody,
  type DeliveryChecklistTarget,
  type DeliveryStageCanon,
} from '@/lib/api/checklist-templates';
import { PermissionGate } from '@/lib/permissions';
import { toast } from 'sonner';
import { DELIVERY_STAGES, FILTER_ANY, TARGETS } from './delivery-stage-rule-options';
import { StageRuleOptionalFiltersSection } from './stage-rule-optional-filters-section';

type Props = {
  templates: ChecklistTemplateListItem[];
  onCreated: () => Promise<void>;
};

export function NewStageRuleFormCard({ templates, onCreated }: Props) {
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState<DeliveryChecklistTarget>('PRODUCT');
  const [deliveryStage, setDeliveryStage] = useState<DeliveryStageCanon>('DEVELOPMENT');
  const [templateId, setTemplateId] = useState('');
  const [priority, setPriority] = useState('0');
  const [filterCategory, setFilterCategory] = useState<string>(FILTER_ANY);
  const [filterType, setFilterType] = useState<string>(FILTER_ANY);

  const publishedTemplates = useMemo(
    () => templates.filter((t) => t.status === 'ACTIVE' && t.activeVersionId),
    [templates],
  );

  const resetForm = () => {
    setTemplateId('');
    setPriority('0');
    setFilterCategory(FILTER_ANY);
    setFilterType(FILTER_ANY);
  };

  const onCreate = async () => {
    if (!templateId) {
      toast.error('Choose a published checklist template.');
      return;
    }
    const p = Number.parseInt(priority, 10);
    const body: CreateDeliveryStageChecklistRuleBody = {
      target,
      deliveryStage,
      checklistTemplateId: templateId,
      priority: Number.isFinite(p) ? p : 0,
      ...(target === 'PRODUCT'
        ? {
            ...(filterCategory !== FILTER_ANY ? { filterProductCategory: filterCategory } : {}),
            ...(filterType !== FILTER_ANY ? { filterProductType: filterType } : {}),
          }
        : {}),
    };
    setSaving(true);
    try {
      await checklistTemplatesApi.createStageRule(body);
      toast.success('Rule created');
      resetForm();
      await onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create rule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border/80 shadow-sm shadow-black/[0.04]">
      <CardHeader className="border-border/60 border-b pb-4">
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl">
            <ListChecks className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 space-y-1">
            <CardTitle>New rule</CardTitle>
            <CardDescription>
              Template must be <strong className="text-foreground font-medium">Active</strong> with
              a published version. Optional filters narrow which items receive this checklist.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8 pt-6">
        <div className="space-y-3">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
            <Layers className="size-3.5" aria-hidden />
            Scope
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InlineField
              variant="controlled"
              type="select"
              label="Target"
              value={target}
              options={TARGETS.map((item) => ({ value: item.value, label: item.label }))}
              onValueChange={(value) => setTarget(value as DeliveryChecklistTarget)}
            />
            <InlineField
              variant="controlled"
              type="select"
              label="Delivery stage"
              value={deliveryStage}
              options={DELIVERY_STAGES.map((item) => ({ value: item.value, label: item.label }))}
              onValueChange={(value) => setDeliveryStage(value as DeliveryStageCanon)}
            />
            <InlineField
              variant="controlled"
              type="select"
              label="Checklist template"
              value={templateId}
              placeholder="Published template"
              options={publishedTemplates.map((item) => ({ value: item.id, label: item.name }))}
              onValueChange={setTemplateId}
              className="sm:col-span-2"
            />
            <InlineField
              variant="controlled"
              label="Priority"
              value={priority}
              onValueChange={setPriority}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            {publishedTemplates.length} published templates. Lower priority runs first.
          </p>
        </div>

        <StageRuleOptionalFiltersSection
          target={target}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          filterType={filterType}
          setFilterType={setFilterType}
        />
      </CardContent>
      <CardFooter className="bg-muted/40 border-border/60 flex flex-col gap-3 border-t sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs sm:max-w-md">
          Rules only affect items after they are saved. Existing checklist instances are not
          retroactively removed.
        </p>
        <PermissionGate module="CHECKLIST_TEMPLATES" action="EDIT">
          <Button
            disabled={saving || !templateId}
            onClick={() => void onCreate()}
            className="shrink-0"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              'Add rule'
            )}
          </Button>
        </PermissionGate>
      </CardFooter>
    </Card>
  );
}
