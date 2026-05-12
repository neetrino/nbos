'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared';
import { Button, buttonVariants } from '@/components/ui/button';
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
  EXTENSION_SIZES,
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
} from '@/features/projects/constants/projects';
import {
  checklistTemplatesApi,
  type ChecklistTemplateListItem,
  type CreateDeliveryStageChecklistRuleBody,
  type DeliveryChecklistTarget,
  type DeliveryStageCanon,
  type DeliveryStageChecklistRuleRow,
} from '@/lib/api/checklist-templates';
import { PermissionGate } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DELIVERY_STAGES: { value: DeliveryStageCanon; label: string }[] = [
  { value: 'STARTING', label: 'Starting' },
  { value: 'DEVELOPMENT', label: 'Development' },
  { value: 'QA', label: 'QA' },
  { value: 'TRANSFER', label: 'Transfer' },
];

const TARGETS: { value: DeliveryChecklistTarget; label: string }[] = [
  { value: 'PRODUCT', label: 'Product' },
  { value: 'EXTENSION', label: 'Extension' },
];

const FILTER_ANY = '__any__';

export default function ChecklistStageRulesPage() {
  const [rules, setRules] = useState<DeliveryStageChecklistRuleRow[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [target, setTarget] = useState<DeliveryChecklistTarget>('PRODUCT');
  const [deliveryStage, setDeliveryStage] = useState<DeliveryStageCanon>('DEVELOPMENT');
  const [templateId, setTemplateId] = useState('');
  const [priority, setPriority] = useState('0');
  const [filterCategory, setFilterCategory] = useState(FILTER_ANY);
  const [filterType, setFilterType] = useState(FILTER_ANY);
  const [filterSize, setFilterSize] = useState(FILTER_ANY);

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
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create rule');
    } finally {
      setSaving(false);
    }
  };

  const onToggleActive = async (row: DeliveryStageChecklistRuleRow) => {
    try {
      await checklistTemplatesApi.updateStageRule(row.id, { isActive: !row.isActive });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this stage binding?')) return;
    try {
      await checklistTemplatesApi.deleteStageRule(id);
      toast.success('Rule removed');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Delivery checklist stage rules"
        description="Bind published checklist templates to Product / Extension delivery stages. Matching lines create checklist instances when an item enters the stage (snapshot version)."
      >
        <Link
          href="/my-company/checklist-templates"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Templates
        </Link>
      </PageHeader>

      <section className="border-border bg-card rounded-2xl border p-5 sm:p-6">
        <h2 className="text-sm font-semibold tracking-wide uppercase">New rule</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Template must be Active with a published version. Filters are optional (empty = all).
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Target</Label>
            <Select
              value={target}
              onValueChange={(v) => {
                if (v) setTarget(v as DeliveryChecklistTarget);
              }}
            >
              <SelectTrigger>
                <SelectValue />
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
              <SelectTrigger>
                <SelectValue />
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
          <div className="space-y-2">
            <Label>Checklist template</Label>
            <Select
              value={templateId || undefined}
              onValueChange={(v) => {
                if (v) setTemplateId(v);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template">
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="rule-priority">Priority</Label>
            <Input
              id="rule-priority"
              inputMode="numeric"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
          </div>
          {target === 'PRODUCT' ? (
            <>
              <div className="space-y-2">
                <Label>Filter category</Label>
                <Select
                  value={filterCategory}
                  onValueChange={(v) => {
                    if (v) setFilterCategory(v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ANY}>Any</SelectItem>
                    {PRODUCT_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Filter product type</Label>
                <Select
                  value={filterType}
                  onValueChange={(v) => {
                    if (v) setFilterType(v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ANY}>Any</SelectItem>
                    {PRODUCT_TYPES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label>Filter extension size</Label>
              <Select
                value={filterSize}
                onValueChange={(v) => {
                  if (v) setFilterSize(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ANY}>Any</SelectItem>
                  {EXTENSION_SIZES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <PermissionGate module="CHECKLIST_TEMPLATES" action="EDIT">
          <Button
            className="mt-5"
            size="sm"
            disabled={saving || !templateId}
            onClick={() => void onCreate()}
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
      </section>

      <section className="border-border bg-card rounded-2xl border">
        <div className="border-border text-muted-foreground border-b px-4 py-3 text-sm">
          {loading ? 'Loading rules…' : `${rules.length} rule(s)`}
        </div>
        <ul className="divide-border divide-y">
          {rules.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-medium">
                  {row.target} · {row.deliveryStage} · {row.checklistTemplate.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  Priority {row.priority}
                  {row.target === 'PRODUCT' ? (
                    <>
                      {' '}
                      · filters: {row.filterProductCategory ?? 'any'} /{' '}
                      {row.filterProductType ?? 'any'}
                    </>
                  ) : (
                    <> · size: {row.filterExtensionSize ?? 'any'}</>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <PermissionGate module="CHECKLIST_TEMPLATES" action="EDIT">
                  <Button variant="outline" size="sm" onClick={() => void onToggleActive(row)}>
                    {row.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    aria-label="Delete rule"
                    onClick={() => void onDelete(row.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </PermissionGate>
              </div>
            </li>
          ))}
          {!loading && rules.length === 0 ? (
            <li className="text-muted-foreground px-4 py-8 text-center text-sm">
              No rules yet. Add one above to auto-create checklist instances on stage entry.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
