'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageHeader, StatusBadge } from '@/components/shared';
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Checklist templates"
        description="Reusable SOP checklists with versioning. Publish creates the active snapshot for new instances; drafts continue on a separate version."
      >
        <PermissionGate module="COMPANY" action="EDIT">
          <Link
            href="/my-company/checklist-templates/new"
            className={cn(buttonVariants({ size: 'sm' }))}
          >
            <Plus className="mr-1 size-4" />
            New template
          </Link>
        </PermissionGate>
      </PageHeader>

      <div className="border-border bg-card rounded-2xl border">
        <div className="border-border flex items-center justify-between gap-2 border-b px-4 py-3">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <ClipboardList className="size-4" />
            {loading ? 'Loading…' : `${rows.length} template(s)`}
          </div>
        </div>
        <ul className="divide-border divide-y">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/my-company/checklist-templates/${row.id}`}
                className="hover:bg-muted/40 flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {row.category} · {row.ownerModule}
                    {row.activeVersion
                      ? ` · active v${row.activeVersion.versionNumber}`
                      : ' · no published version'}
                  </p>
                </div>
                <StatusBadge label={row.status} variant={statusVariant(row.status)} />
              </Link>
            </li>
          ))}
          {!loading && rows.length === 0 ? (
            <li className="text-muted-foreground px-4 py-6 text-sm">
              No templates yet. Create one to attach to Delivery requirements later.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
