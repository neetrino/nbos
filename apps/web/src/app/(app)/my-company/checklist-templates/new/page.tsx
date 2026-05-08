'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
import { PageHeader } from '@/components/shared';
import {
  checklistTemplatesApi,
  type ChecklistOwnerModule,
  type ChecklistTemplateCategory,
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

export default function NewChecklistTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ChecklistTemplateCategory>('SOP');
  const [ownerModule, setOwnerModule] = useState<ChecklistOwnerModule>('MY_COMPANY');
  const [saving, setSaving] = useState(false);

  async function submit() {
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
      router.push(`/my-company/checklist-templates/${created.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create template';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New checklist template"
        description="Creates a draft template with version 1. Add items, then publish to set the active snapshot."
      >
        <Link
          href="/my-company/checklist-templates"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Back to list
        </Link>
      </PageHeader>

      <div className="border-border bg-card max-w-xl space-y-4 rounded-2xl border p-6">
        <div className="space-y-2">
          <Label htmlFor="ct-name">Name</Label>
          <Input
            id="ct-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. WordPress delivery checklist"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ct-desc">Description</Label>
          <Textarea
            id="ct-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="When to use this checklist"
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={category}
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
        <Button type="button" disabled={saving} onClick={() => void submit()}>
          {saving ? 'Creating…' : 'Create template'}
        </Button>
      </div>
    </div>
  );
}
