'use client';

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlineField, InsightSheetSection } from '@/components/shared';
import {
  CHECKLIST_OWNER_MODULE_LABELS,
  CHECKLIST_TEMPLATE_CATEGORY_LABELS,
} from '@/features/checklist/checklist-template-form-labels';
import { usePermission } from '@/lib/permissions';
import {
  checklistTemplatesApi,
  type ChecklistOwnerModule,
  type ChecklistTemplateCategory,
  type ChecklistTemplateDetail,
} from '@/lib/api/checklist-templates';
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

export function ChecklistTemplateCreateForm({
  onCreated,
}: {
  onCreated: (row: ChecklistTemplateDetail) => void;
}) {
  const { can, isLoading } = usePermission();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ChecklistTemplateCategory>('SOP');
  const [ownerModule, setOwnerModule] = useState<ChecklistOwnerModule>('MY_COMPANY');
  const [saving, setSaving] = useState(false);

  if (!isLoading && !can('ADD', 'CHECKLIST_TEMPLATES')) {
    return (
      <p className="text-muted-foreground text-sm">
        You don&apos;t have permission to create checklist templates.
      </p>
    );
  }

  return (
    <ChecklistTemplateCreateFields
      name={name}
      description={description}
      category={category}
      ownerModule={ownerModule}
      saving={saving}
      onName={setName}
      onDescription={setDescription}
      onCategory={setCategory}
      onOwner={setOwnerModule}
      onSubmit={() =>
        void submitCreate({ name, description, category, ownerModule, setSaving, onCreated })
      }
    />
  );
}

function ChecklistTemplateCreateFields({
  name,
  description,
  category,
  ownerModule,
  saving,
  onName,
  onDescription,
  onCategory,
  onOwner,
  onSubmit,
}: {
  name: string;
  description: string;
  category: ChecklistTemplateCategory;
  ownerModule: ChecklistOwnerModule;
  saving: boolean;
  onName: (value: string) => void;
  onDescription: (value: string) => void;
  onCategory: (value: ChecklistTemplateCategory) => void;
  onOwner: (value: ChecklistOwnerModule) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4">
      <InsightSheetSection
        icon={<FileText size={15} />}
        title="Template"
        hint="A draft is created with the name. Add steps after that, then publish."
      >
        <div className="grid gap-3">
          <InlineField
            variant="controlled"
            label="Name"
            value={name}
            placeholder="WordPress handoff checklist"
            disabled={saving}
            onValueChange={onName}
          />
          <InlineField
            variant="controlled"
            type="textarea"
            label="Description"
            value={description}
            placeholder="When should teams use this checklist?"
            disabled={saving}
            onValueChange={onDescription}
          />
          <InlineField
            variant="controlled"
            type="select"
            label="Category"
            value={category}
            disabled={saving}
            options={CATEGORIES.map((item) => ({
              value: item,
              label: CHECKLIST_TEMPLATE_CATEGORY_LABELS[item],
            }))}
            onValueChange={(value) => onCategory(value as ChecklistTemplateCategory)}
          />
          <InlineField
            variant="controlled"
            type="select"
            label="Used in"
            value={ownerModule}
            disabled={saving}
            options={OWNER_MODULES.map((item) => ({
              value: item,
              label: CHECKLIST_OWNER_MODULE_LABELS[item],
            }))}
            onValueChange={(value) => onOwner(value as ChecklistOwnerModule)}
          />
        </div>
      </InsightSheetSection>
      <div className="flex justify-end">
        <Button type="button" size="sm" disabled={saving} onClick={onSubmit}>
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {saving ? 'Creating…' : 'Create template'}
        </Button>
      </div>
    </div>
  );
}

async function submitCreate({
  name,
  description,
  category,
  ownerModule,
  setSaving,
  onCreated,
}: {
  name: string;
  description: string;
  category: ChecklistTemplateCategory;
  ownerModule: ChecklistOwnerModule;
  setSaving: (value: boolean) => void;
  onCreated: (row: ChecklistTemplateDetail) => void;
}) {
  const trimmed = name.trim();
  if (!trimmed) {
    toast.error('Name is required');
    return;
  }
  setSaving(true);
  try {
    const created = await checklistTemplatesApi.create({
      name: trimmed,
      description: description.trim() || undefined,
      category,
      ownerModule,
    });
    toast.success('Template created');
    onCreated(created);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to create template');
  } finally {
    setSaving(false);
  }
}
