'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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

const SELECT_TRIGGER_FORM = 'w-full min-w-0';

export default function NewChecklistTemplatePage() {
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
      <PageHeader
        title="New checklist template"
        description="Start with a name and classification. You’ll add checklist items next, then publish to lock the version used for new instances."
      >
        <Link
          href="/my-company/checklist-templates"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Back to list
        </Link>
      </PageHeader>

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
          <div className="space-y-2">
            <Label htmlFor="ct-name">Name</Label>
            <Input
              id="ct-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. WordPress handoff checklist"
              className="text-base"
              autoComplete="off"
            />
            <p className="text-muted-foreground text-xs">Shown wherever this template is picked.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-desc">Description</Label>
            <Textarea
              id="ct-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="When should teams use this checklist? What outcome does it protect?"
              className="min-h-[7.5rem] resize-y"
            />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ChecklistTemplateCategory)}
              >
                <SelectTrigger className={SELECT_TRIGGER_FORM}>
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
              <p className="text-muted-foreground text-xs">
                Groups templates for browsing and reporting.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Owner context</Label>
              <Select
                value={ownerModule}
                onValueChange={(v) => setOwnerModule(v as ChecklistOwnerModule)}
              >
                <SelectTrigger className={SELECT_TRIGGER_FORM}>
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
              <p className="text-muted-foreground text-xs">
                Which area of NBOS this SOP is mainly associated with (organizational tag).
              </p>
            </div>
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
