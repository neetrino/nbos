'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCompanySectionTabs } from '@/features/hr/components/use-company-section-tabs';
import {
  checklistTemplatesApi,
  type ChecklistTemplateListItem,
} from '@/lib/api/checklist-templates';
import { PermissionGate } from '@/lib/permissions';
import { toast } from 'sonner';
import { ChecklistTemplateCard } from './checklist-template-card';

export default function ChecklistTemplatesListPage() {
  const [rows, setRows] = useState<ChecklistTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionTabs = useCompanySectionTabs('checklists', undefined, 'below');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await checklistTemplatesApi.list();
      setRows(data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load checklist templates');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      {sectionTabs}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-muted-foreground max-w-3xl text-sm">
          Reusable checklists. Open one to edit the steps, then publish it so delivery rules can
          start it.
        </p>
        <PermissionGate module="CHECKLIST_TEMPLATES" action="ADD">
          <Link
            href="/my-company/checklist-templates/new"
            className={cn(buttonVariants({ size: 'sm' }))}
          >
            <Plus className="size-4" aria-hidden />
            New template
          </Link>
        </PermissionGate>
      </div>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No templates yet.</p>
      ) : (
        <ul className="grid w-full grid-cols-2 items-stretch gap-3 xl:grid-cols-3 2xl:grid-cols-4">
          {rows.map((row) => (
            <ChecklistTemplateCard key={row.id} row={row} />
          ))}
        </ul>
      )}
    </div>
  );
}
