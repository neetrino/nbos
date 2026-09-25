'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { InlineField } from '@/components/shared';
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InlineField
          variant="controlled"
          label="Name"
          value={name}
          disabled={readOnly}
          onValueChange={setName}
          className="sm:col-span-2"
        />
        <InlineField
          variant="controlled"
          type="textarea"
          label="Description"
          value={description}
          disabled={readOnly}
          onValueChange={setDescription}
          className="sm:col-span-2"
        />
        <InlineField
          variant="controlled"
          type="select"
          label="Category"
          value={category}
          disabled={readOnly}
          options={CATEGORIES.map((item) => ({
            value: item,
            label: CHECKLIST_TEMPLATE_CATEGORY_LABELS[item],
          }))}
          onValueChange={(value) => setCategory(value as ChecklistTemplateCategory)}
        />
        <InlineField
          variant="controlled"
          type="select"
          label="Owner context"
          value={ownerModule}
          disabled={readOnly}
          options={OWNER_MODULES.map((item) => ({
            value: item,
            label: CHECKLIST_OWNER_MODULE_LABELS[item],
          }))}
          onValueChange={(value) => setOwnerModule(value as ChecklistOwnerModule)}
        />
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
