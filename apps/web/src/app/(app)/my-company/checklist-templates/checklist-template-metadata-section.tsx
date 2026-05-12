'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PermissionGate } from '@/lib/permissions';
import {
  checklistTemplatesApi,
  type ChecklistOwnerModule,
  type ChecklistTemplateCategory,
  type ChecklistTemplateDetail,
} from '@/lib/api/checklist-templates';
import {
  CHECKLIST_OWNER_MODULE_LABELS,
  CHECKLIST_TEMPLATE_CATEGORY_LABELS,
} from '@/features/checklist/checklist-template-form-labels';
import { toast } from 'sonner';

const CATEGORIES: ChecklistTemplateCategory[] = [
  'DELIVERY',
  'MAINTENANCE',
  'QA',
  'TECHNICAL',
  'SOP',
  'OTHER',
];

const OWNER_MODULES: ChecklistOwnerModule[] = ['MY_COMPANY', 'PROJECTS', 'TASKS', 'TECHNICAL'];

const SELECT_TRIGGER = 'w-full min-w-0';

type Props = {
  templateId: string;
  detail: ChecklistTemplateDetail;
  readOnly: boolean;
  onUpdated: (next: ChecklistTemplateDetail) => void;
  /** When true, omit outer card chrome (parent provides layout). */
  embedded?: boolean;
};

export function ChecklistTemplateMetadataSection({
  templateId,
  detail,
  readOnly,
  onUpdated,
  embedded = false,
}: Props) {
  const [name, setName] = useState(detail.name);
  const [description, setDescription] = useState(detail.description ?? '');
  const [category, setCategory] = useState<ChecklistTemplateCategory>(detail.category);
  const [ownerModule, setOwnerModule] = useState<ChecklistOwnerModule>(detail.ownerModule);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(detail.name);
    setDescription(detail.description ?? '');
    setCategory(detail.category);
    setOwnerModule(detail.ownerModule);
  }, [detail.name, detail.description, detail.category, detail.ownerModule]);

  async function saveMetadata() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const next = await checklistTemplatesApi.updateMetadata(templateId, {
        name: trimmed,
        description: description.trim() || null,
        category,
        ownerModule,
      });
      onUpdated(next);
      toast.success('Template details saved');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const inner = (
    <>
      {!embedded ? (
        <p className="text-muted-foreground mb-3 text-sm font-medium">Template details</p>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ctm-name" className={embedded ? 'text-xs' : undefined}>
            Name
          </Label>
          <Input
            id="ctm-name"
            value={name}
            disabled={readOnly}
            onChange={(e) => setName(e.target.value)}
            className={embedded ? 'h-9 text-sm' : undefined}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ctm-desc" className={embedded ? 'text-xs' : undefined}>
            Description
          </Label>
          <Textarea
            id="ctm-desc"
            value={description}
            disabled={readOnly}
            rows={embedded ? 2 : 3}
            onChange={(e) => setDescription(e.target.value)}
            className={embedded ? 'min-h-[3.25rem] resize-y text-sm' : undefined}
          />
        </div>
        <div className="space-y-1.5">
          <Label className={embedded ? 'text-xs' : undefined}>Category</Label>
          <Select
            value={category}
            disabled={readOnly}
            onValueChange={(v) => setCategory(v as ChecklistTemplateCategory)}
          >
            <SelectTrigger className={SELECT_TRIGGER}>
              <SelectValue>
                {(value: string | null) =>
                  value
                    ? (CHECKLIST_TEMPLATE_CATEGORY_LABELS[value as ChecklistTemplateCategory] ??
                      value)
                    : null
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CHECKLIST_TEMPLATE_CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className={embedded ? 'text-xs' : undefined}>Owner context</Label>
          <Select
            value={ownerModule}
            disabled={readOnly}
            onValueChange={(v) => setOwnerModule(v as ChecklistOwnerModule)}
          >
            <SelectTrigger className={SELECT_TRIGGER}>
              <SelectValue>
                {(value: string | null) =>
                  value
                    ? (CHECKLIST_OWNER_MODULE_LABELS[value as ChecklistOwnerModule] ?? value)
                    : null
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {OWNER_MODULES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CHECKLIST_OWNER_MODULE_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <PermissionGate module="CHECKLIST_TEMPLATES" action="EDIT">
        <Button
          type="button"
          className={embedded ? 'mt-3 h-8 text-xs' : 'mt-4'}
          size={embedded ? 'sm' : 'default'}
          disabled={readOnly || saving}
          onClick={() => void saveMetadata()}
        >
          {saving ? 'Saving…' : 'Save details'}
        </Button>
      </PermissionGate>
    </>
  );

  if (embedded) {
    return <div className="min-w-0">{inner}</div>;
  }

  return <div className="border-border bg-card rounded-2xl border p-4">{inner}</div>;
}
