'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageHeader, StatusBadge } from '@/components/shared';
import {
  checklistTemplatesApi,
  parseChecklistTemplateItems,
  type ChecklistTemplateDetail,
  type ChecklistTemplateItem,
} from '@/lib/api/checklist-templates';
import { PermissionGate } from '@/lib/permissions';
import { toast } from 'sonner';
import { ChecklistDraftItemsEditor } from '../checklist-draft-items-editor';

function statusVariant(status: string): 'default' | 'green' | 'gray' | 'blue' | 'amber' | 'red' {
  if (status === 'ACTIVE') {
    return 'green';
  }
  if (status === 'ARCHIVED') {
    return 'gray';
  }
  return 'blue';
}

export default function ChecklistTemplateDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [detail, setDetail] = useState<ChecklistTemplateDetail | null>(null);
  const [items, setItems] = useState<ChecklistTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      return;
    }
    setLoading(true);
    try {
      const row = await checklistTemplatesApi.getById(id);
      setDetail(row);
      setItems(parseChecklistTemplateItems(row.draftVersion?.items));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load template';
      toast.error(msg);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveDraft() {
    if (!id || !detail || detail.status === 'ARCHIVED') {
      return;
    }
    const payload = items.map((row, index) => ({ ...row, sortOrder: index }));
    setSaving(true);
    try {
      const next = await checklistTemplatesApi.updateDraftItems(id, payload);
      setDetail(next);
      setItems(parseChecklistTemplateItems(next.draftVersion?.items));
      toast.success('Draft saved');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save draft';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!id || !detail || detail.status === 'ARCHIVED') {
      return;
    }
    setPublishing(true);
    try {
      const next = await checklistTemplatesApi.publish(id);
      setDetail(next);
      setItems(parseChecklistTemplateItems(next.draftVersion?.items));
      toast.success('Version published');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to publish';
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  }

  async function archive() {
    if (!id || !detail || detail.status === 'ARCHIVED') {
      return;
    }
    setSaving(true);
    try {
      const next = await checklistTemplatesApi.updateMetadata(id, { status: 'ARCHIVED' });
      setDetail(next);
      toast.success('Template archived');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to archive';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (!id) {
    return null;
  }

  if (loading && !detail) {
    return <div className="text-muted-foreground p-6 text-sm">Loading template…</div>;
  }

  if (!detail) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-muted-foreground text-sm">Template not found.</p>
        <Link
          href="/my-company/checklist-templates"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Back
        </Link>
      </div>
    );
  }

  const readOnly = detail.status === 'ARCHIVED';

  return (
    <div className="space-y-6">
      <PageHeader title={detail.name} description={detail.description ?? '—'}>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={detail.status} variant={statusVariant(detail.status)} />
          <Link
            href="/my-company/checklist-templates"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            All templates
          </Link>
        </div>
      </PageHeader>

      <div className="text-muted-foreground grid gap-2 text-sm md:grid-cols-2">
        <p>
          Category: <span className="text-foreground">{detail.category}</span>
        </p>
        <p>
          Owner module: <span className="text-foreground">{detail.ownerModule}</span>
        </p>
        <p>
          Active version:{' '}
          <span className="text-foreground">
            {detail.activeVersion ? `v${detail.activeVersion.versionNumber}` : 'none'}
          </span>
        </p>
        <p>
          Draft version:{' '}
          <span className="text-foreground">
            {detail.draftVersion ? `v${detail.draftVersion.versionNumber}` : 'none'}
          </span>
        </p>
      </div>

      <div className="border-border bg-card rounded-2xl border p-4">
        <p className="text-muted-foreground mb-3 text-sm font-medium">Version history</p>
        <ul className="text-muted-foreground max-h-40 space-y-1 overflow-auto text-xs">
          {detail.versions.map((v) => (
            <li key={v.id}>
              v{v.versionNumber} · {v.status} · {new Date(v.createdAt).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-border bg-card rounded-2xl border p-4">
        <ChecklistDraftItemsEditor items={items} disabled={readOnly} onChange={setItems} />
        <PermissionGate module="COMPANY" action="EDIT">
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" disabled={readOnly || saving} onClick={() => void saveDraft()}>
              {saving ? 'Saving…' : 'Save draft'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={readOnly || publishing}
              onClick={() => void publish()}
            >
              {publishing ? 'Publishing…' : 'Publish draft'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={readOnly || saving}
              onClick={() => void archive()}
            >
              Archive
            </Button>
          </div>
        </PermissionGate>
        {readOnly ? (
          <p className="text-muted-foreground mt-3 text-sm">This template is archived.</p>
        ) : null}
      </div>
    </div>
  );
}
