'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompanySectionTabs } from '@/features/hr/components/use-company-section-tabs';
import {
  checklistTemplatesApi,
  type ChecklistTemplateListItem,
} from '@/lib/api/checklist-templates';
import { PermissionGate } from '@/lib/permissions';
import { toast } from 'sonner';
import { ChecklistTemplateCard } from './checklist-template-card';
import { ChecklistTemplateSheet } from './checklist-template-sheet';

const LIST_HREF = '/my-company/checklist-templates';

export default function ChecklistTemplatesListPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
      <ChecklistTemplatesList />
    </Suspense>
  );
}

function ChecklistTemplatesList() {
  const router = useRouter();
  const search = useSearchParams();
  const templateId = search.get('template');
  const creating = search.get('create') === '1' && templateId == null;
  const [rows, setRows] = useState<ChecklistTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionTabs = useCompanySectionTabs('checklists', undefined, 'below');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows((await checklistTemplatesApi.list()) ?? []);
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

  const openTemplate = (id: string) => {
    router.replace(`${LIST_HREF}?template=${id}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-4">
      {sectionTabs}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Open a template to edit the steps, then publish it for delivery rules.
        </p>
        <PermissionGate module="CHECKLIST_TEMPLATES" action="ADD">
          <Button
            type="button"
            size="sm"
            onClick={() => router.replace(`${LIST_HREF}?create=1`, { scroll: false })}
          >
            <Plus className="size-4" aria-hidden />
            New template
          </Button>
        </PermissionGate>
      </div>
      <ChecklistTemplateList loading={loading} rows={rows} onOpen={openTemplate} />
      <ChecklistTemplateSheet
        open={creating || templateId != null}
        creating={creating}
        templateId={templateId}
        onOpenChange={(open) => {
          if (!open) router.replace(LIST_HREF, { scroll: false });
        }}
        onCreated={(row) => {
          void load();
          openTemplate(row.id);
        }}
        onChanged={() => void load()}
        onDuplicated={(id) => {
          void load();
          openTemplate(id);
        }}
      />
    </div>
  );
}

function ChecklistTemplateList({
  loading,
  rows,
  onOpen,
}: {
  loading: boolean;
  rows: ChecklistTemplateListItem[];
  onOpen: (id: string) => void;
}) {
  if (loading) return <p className="text-muted-foreground text-sm">Loading…</p>;
  if (rows.length === 0) return <p className="text-muted-foreground text-sm">No templates yet.</p>;
  return (
    <ul className="grid w-full grid-cols-2 items-stretch gap-3 xl:grid-cols-3 2xl:grid-cols-4">
      {rows.map((row) => (
        <ChecklistTemplateCard key={row.id} row={row} onOpen={onOpen} />
      ))}
    </ul>
  );
}
