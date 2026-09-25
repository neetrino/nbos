'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { FileText, Loader2, Sparkles } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { InlineField } from '@/components/shared';
import { useCompanySectionTabs } from '@/features/hr/components/use-company-section-tabs';
import { usePermission } from '@/lib/permissions';
import {
  CHECKLIST_OWNER_MODULE_LABELS,
  CHECKLIST_TEMPLATE_CATEGORY_LABELS,
} from '@/features/checklist/checklist-template-form-labels';
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
  const backLink = useMemo(
    () => (
      <Link
        href="/my-company/checklist-templates"
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
      >
        Back to list
      </Link>
    ),
    [],
  );
  useCompanySectionTabs('checklists', backLink);
  const router = useRouter();
  const { can, isLoading } = usePermission();
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

  if (!isLoading && !can('ADD', 'CHECKLIST_TEMPLATES')) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-6">
        <Card className="border-border/80 shadow-sm shadow-black/[0.04]">
          <CardHeader>
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You don&apos;t have permission to create checklist templates. Ask an administrator if
              you need access.
            </CardDescription>
          </CardHeader>
          <CardFooter className="border-border/60 border-t">
            <Link
              href="/my-company/checklist-templates"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              Back to templates
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-10">
      <p className="text-muted-foreground text-sm">
        Start with a name and classification. You’ll add checklist items next, then publish to lock
        the version used for new instances.
      </p>

      <Card className="border-border/80 shadow-sm shadow-black/[0.04]">
        <CardHeader className="border-border/60 border-b pb-4">
          <div className="flex items-start gap-3">
            <span className="bg-primary/10 text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl">
              <FileText className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <CardTitle>Template details</CardTitle>
              <CardDescription>
                Draft version <strong className="text-foreground font-medium">1</strong> is created
                automatically. Publishing defines the snapshot for Delivery rules and instances.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <InlineField
            variant="controlled"
            label="Name"
            value={name}
            placeholder="WordPress handoff checklist"
            onValueChange={setName}
          />
          <InlineField
            variant="controlled"
            type="textarea"
            label="Description"
            value={description}
            placeholder="When should teams use this checklist?"
            onValueChange={setDescription}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <InlineField
              variant="controlled"
              type="select"
              label="Category"
              value={category}
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
              options={OWNER_MODULES.map((item) => ({
                value: item,
                label: CHECKLIST_OWNER_MODULE_LABELS[item],
              }))}
              onValueChange={(value) => setOwnerModule(value as ChecklistOwnerModule)}
            />
          </div>
        </CardContent>
        <CardFooter className="bg-muted/40 border-border/60 flex flex-col gap-3 border-t sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-xs sm:max-w-md">
            After creation you can reorder items, set evidence requirements, and publish when ready.
          </p>
          <Button
            type="button"
            disabled={saving}
            onClick={() => void submit()}
            className="shrink-0 gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Creating…
              </>
            ) : (
              <>
                <Sparkles className="size-4" aria-hidden />
                Create template
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
