'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
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
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Reusable SOP checklists with versioning. Publish creates the active snapshot for new
        instances; drafts continue on a separate version.
      </p>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No templates yet. Create one to attach to Delivery requirements later.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/my-company/checklist-templates/${row.id}`}
                className="border-border hover:border-primary/40 bg-card flex items-start justify-between gap-3 rounded-2xl border px-3.5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.name}</p>
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
    </div>
  );
}
