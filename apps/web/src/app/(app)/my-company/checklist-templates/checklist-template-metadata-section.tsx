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
};

export function ChecklistTemplateMetadataSection({
  templateId,
  detail,
  readOnly,
  onUpdated,
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

  return (
    <div className="border-border bg-card rounded-2xl border p-4">
      <p className="text-muted-foreground mb-3 text-sm font-medium">Template details</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="ctm-name">Name</Label>
          <Input
            id="ctm-name"
            value={name}
            disabled={readOnly}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="ctm-desc">Description</Label>
          <Textarea
            id="ctm-desc"
            value={description}
            disabled={readOnly}
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={category}
            disabled={readOnly}
            onValueChange={(v) => setCategory(v as ChecklistTemplateCategory)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Owner module</Label>
          <Select
            value={ownerModule}
            disabled={readOnly}
            onValueChange={(v) => setOwnerModule(v as ChecklistOwnerModule)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OWNER_MODULES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <PermissionGate module="CHECKLIST_TEMPLATES" action="EDIT">
        <Button
          type="button"
          className="mt-4"
          disabled={readOnly || saving}
          onClick={() => void saveMetadata()}
        >
          {saving ? 'Saving…' : 'Save details'}
        </Button>
      </PermissionGate>
    </div>
  );
}
