'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/shared';
import { useCompanySectionTabs } from '@/features/hr/components/use-company-section-tabs';
import {
  checklistTemplatesApi,
  parseChecklistTemplateItems,
  type ChecklistTemplateDetail,
  type ChecklistTemplateItem,
} from '@/lib/api/checklist-templates';
import { PermissionGate } from '@/lib/permissions';
import { toast } from 'sonner';
import { ChecklistTemplateDuplicateDialog } from '../checklist-template-duplicate-dialog';
import { ChecklistTemplatePreviewDialog } from '../checklist-template-preview-dialog';
import { ChecklistTemplateVersionHistory } from '../checklist-template-version-history';
import { ChecklistTemplateMetadataSection } from '../checklist-template-metadata-section';
import { ChecklistTemplateAuditPanel } from '../checklist-template-audit-panel';
import { ChecklistTemplateDraftCard } from '../checklist-template-draft-card';

function statusVariant(status: string): 'default' | 'green' | 'gray' | 'blue' | 'amber' | 'red' {
  if (status === 'ACTIVE') return 'green';
  if (status === 'ARCHIVED') return 'gray';
  return 'blue';
}

export default function ChecklistTemplateDetailPage() {
  const sectionTabs = useCompanySectionTabs('checklists', undefined, 'below');
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [detail, setDetail] = useState<ChecklistTemplateDetail | null>(null);
  const [items, setItems] = useState<ChecklistTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [preview, setPreview] = useState<{ versionId: string; label: string } | null>(null);
  const [previewItems, setPreviewItems] = useState<ChecklistTemplateItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dupOpen, setDupOpen] = useState(false);
  const [dupBusy, setDupBusy] = useState(false);

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

  const openPreview = useCallback(
    async (versionId: string, label: string) => {
      if (!id) {
        return;
      }
      setPreview({ versionId, label });
      setPreviewLoading(true);
      setPreviewItems([]);
      try {
        const snap = await checklistTemplatesApi.getVersionSnapshot(id, versionId);
        setPreviewItems(parseChecklistTemplateItems(snap.items));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load version';
        toast.error(msg);
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    },
    [id],
  );

  async function runDuplicate() {
    if (!id) {
      return;
    }
    setDupBusy(true);
    try {
      const next = await checklistTemplatesApi.duplicate(id);
      toast.success('Template duplicated');
      setDupOpen(false);
      router.push(`/my-company/checklist-templates/${next.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to duplicate';
      toast.error(msg);
    } finally {
      setDupBusy(false);
    }
  }

  async function archive() {
    if (!id || !detail || detail.status === 'ARCHIVED') {
      return;
    }
    setSaving(true);
    try {
      const next = await checklistTemplatesApi.archive(id);
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
    return (
      <div className="flex flex-col gap-4">
        {sectionTabs}
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading template…
        </p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col gap-4">
        {sectionTabs}
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

  const published = detail.activeVersion
    ? `Published v${detail.activeVersion.versionNumber}`
    : 'Not published';
  const draft = detail.draftVersion ? `Draft v${detail.draftVersion.versionNumber}` : 'No draft';

  return (
    <div className="flex flex-col gap-4 pb-10">
      {sectionTabs}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold">{detail.name}</h1>
            <StatusBadge label={detail.status} variant={statusVariant(detail.status)} />
          </div>
          <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
            {detail.description?.trim() || 'No description yet.'} {published} · {draft}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PermissionGate module="CHECKLIST_TEMPLATES" action="ADD">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={readOnly}
              onClick={() => setDupOpen(true)}
            >
              Duplicate
            </Button>
          </PermissionGate>
          <Link
            href="/my-company/checklist-templates"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            All templates
          </Link>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]">
        <section className="border-border bg-card rounded-2xl border p-4">
          <h2 className="text-foreground mb-3 text-sm font-semibold">Template details</h2>
          <ChecklistTemplateMetadataSection
            templateId={id}
            detail={detail}
            readOnly={readOnly}
            onUpdated={setDetail}
            embedded
          />
        </section>
        <section className="border-border bg-card rounded-2xl border p-4">
          <h2 className="text-foreground mb-3 text-sm font-semibold">Recent changes</h2>
          <ChecklistTemplateAuditPanel templateId={id} embedded />
        </section>
      </div>

      <ChecklistTemplateVersionHistory
        versions={detail.versions}
        onPreview={(versionId, label) => void openPreview(versionId, label)}
      />

      <ChecklistTemplateDraftCard
        templateId={id}
        readOnly={readOnly}
        items={items}
        onItemsChange={setItems}
        saving={saving}
        publishing={publishing}
        onSaveDraft={() => void saveDraft()}
        onPublish={() => void publish()}
        onArchive={() => void archive()}
      />
      <ChecklistTemplatePreviewDialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreview(null);
          }
        }}
        title={preview ? `Preview · ${preview.label}` : 'Preview'}
        loading={previewLoading}
        items={previewItems}
      />

      <ChecklistTemplateDuplicateDialog
        open={dupOpen}
        onOpenChange={setDupOpen}
        templateName={detail.name}
        busy={dupBusy}
        onConfirm={() => void runDuplicate()}
      />
    </div>
  );
}
