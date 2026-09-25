'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ListChecks, Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/shared';
import { useCompanySectionTabs } from '@/features/hr/components/use-company-section-tabs';
import {
  CHECKLIST_OWNER_MODULE_LABELS,
  CHECKLIST_TEMPLATE_CATEGORY_LABELS,
} from '@/features/checklist/checklist-template-form-labels';
import {
  checklistTemplatesApi,
  type ChecklistTemplateListItem,
} from '@/lib/api/checklist-templates';
import { PermissionGate } from '@/lib/permissions';
import { toast } from 'sonner';

function statusVariant(status: string): 'default' | 'green' | 'gray' | 'blue' | 'amber' | 'red' {
  if (status === 'ACTIVE') {
    return 'green';
  }
  if (status === 'ARCHIVED') {
    return 'gray';
  }
  return 'blue';
}

export default function ChecklistTemplatesListPage() {
  const [rows, setRows] = useState<ChecklistTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await checklistTemplatesApi.list();
      setRows(data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load checklist templates';
      toast.error(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const trailing = useMemo(
    () => (
      <PermissionGate module="CHECKLIST_TEMPLATES" action="ADD">
        <Link
          href="/my-company/checklist-templates/new"
          className={cn(buttonVariants({ size: 'sm' }))}
        >
          <Plus className="mr-1 size-4" aria-hidden />
          New template
        </Link>
      </PermissionGate>
    ),
    [],
  );
  useCompanySectionTabs('checklists', trailing);

  return (
    <section className="border-border bg-card relative overflow-hidden rounded-2xl border p-4">
      <div className="bg-primary/15 pointer-events-none absolute -top-12 -right-8 size-28 rounded-full blur-2xl" />
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
            <ListChecks size={15} />
          </div>
          <h2 className="text-foreground text-sm font-semibold">Templates</h2>
        </div>
        <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
          {loading ? '…' : rows.length}
        </span>
      </div>
      {loading ? (
        <p className="text-muted-foreground relative mt-3 text-xs">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground relative mt-3 text-xs">
          No templates yet. Create one to attach when a delivery stage starts.
        </p>
      ) : (
        <ul className="relative mt-3 flex flex-col gap-1">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/my-company/checklist-templates/${row.id}`}
                className="hover:bg-muted/60 flex items-center gap-2.5 rounded-xl px-1.5 py-1.5"
              >
                <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {row.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">{row.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {CHECKLIST_TEMPLATE_CATEGORY_LABELS[row.category]} ·{' '}
                    {CHECKLIST_OWNER_MODULE_LABELS[row.ownerModule]}
                    {row.activeVersion
                      ? ` · v${row.activeVersion.versionNumber}`
                      : ' · not published'}
                  </p>
                </div>
                <StatusBadge label={row.status} variant={statusVariant(row.status)} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
