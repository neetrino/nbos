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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  checklistTemplatesApi,
  type ChecklistTemplateListItem,
  type CreateDeliveryStageChecklistRuleBody,
  type DeliveryChecklistTarget,
  type DeliveryStageCanon,
} from '@/lib/api/checklist-templates';
import { PermissionGate } from '@/lib/permissions';
import { toast } from 'sonner';
import {
  DELIVERY_STAGES,
  FILTER_ANY,
  SELECT_TRIGGER_FORM,
  TARGETS,
} from './delivery-stage-rule-options';
import { selectOptionLabel } from './stage-rules-select-helpers';
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
  const [filterSize, setFilterSize] = useState<string>(FILTER_ANY);

  const publishedTemplates = useMemo(
    () => templates.filter((t) => t.status === 'ACTIVE' && t.activeVersionId),
    [templates],
  );

  const templateNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of templates) {
      map.set(t.id, t.name);
    }
    return map;
  }, [templates]);

  const resetForm = () => {
    setTemplateId('');
    setPriority('0');
    setFilterCategory(FILTER_ANY);
    setFilterType(FILTER_ANY);
    setFilterSize(FILTER_ANY);
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
        : {
            ...(filterSize !== FILTER_ANY ? { filterExtensionSize: filterSize } : {}),
          }),
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Target</Label>
              <Select
                value={target}
                onValueChange={(v) => {
                  if (v) setTarget(v as DeliveryChecklistTarget);
                }}
              >
                <SelectTrigger className={SELECT_TRIGGER_FORM}>
                  <SelectValue placeholder="Target">
                    {(value: string | null) =>
                      selectOptionLabel(value, TARGETS, FILTER_ANY) ?? null
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TARGETS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Delivery stage</Label>
              <Select
                value={deliveryStage}
                onValueChange={(v) => {
                  if (v) setDeliveryStage(v as DeliveryStageCanon);
                }}
              >
                <SelectTrigger className={SELECT_TRIGGER_FORM}>
                  <SelectValue placeholder="Stage">
                    {(value: string | null) =>
                      selectOptionLabel(value, DELIVERY_STAGES, FILTER_ANY) ?? null
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DELIVERY_STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-2">
              <Label>Checklist template</Label>
              <Select
                value={templateId}
                onValueChange={(v) => {
                  if (v) setTemplateId(v);
                }}
              >
                <SelectTrigger className={SELECT_TRIGGER_FORM}>
                  <SelectValue placeholder="Select a published template">
                    {(value: string | null) =>
                      value ? (templateNameById.get(value) ?? value) : null
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {publishedTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                {publishedTemplates.length} published template(s) available.
              </p>
            </div>
          </div>
          <div className="max-w-xs space-y-2">
            <Label htmlFor="rule-priority">Priority</Label>
            <Input
              id="rule-priority"
              inputMode="numeric"
              className="font-mono text-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Lower numbers run first when multiple rules match.
            </p>
          </div>
        </div>

        <StageRuleOptionalFiltersSection
          target={target}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          filterType={filterType}
          setFilterType={setFilterType}
          filterSize={filterSize}
          setFilterSize={setFilterSize}
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
