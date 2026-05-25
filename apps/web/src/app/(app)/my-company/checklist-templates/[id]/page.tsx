'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PageHero, StatusBadge } from '@/components/shared';
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
      <div className="text-muted-foreground flex items-center gap-2 p-8 text-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading template…
      </div>
    );
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
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <PageHero
        title={detail.name}
        trailing={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={detail.status} variant={statusVariant(detail.status)} />
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
        }
      />
      <p className="text-muted-foreground line-clamp-2 text-sm">
        {detail.description ?? 'No description'}
      </p>

      <Card className="border-border/80 shadow-sm shadow-black/[0.04]">
        <CardContent className="grid gap-6 p-4 sm:p-5 lg:grid-cols-2 lg:gap-8">
          <div className="min-w-0 space-y-2">
            <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Template details
            </h2>
            <ChecklistTemplateMetadataSection
              templateId={id}
              detail={detail}
              readOnly={readOnly}
              onUpdated={setDetail}
              embedded
            />
          </div>
          <div className="border-border/60 min-w-0 space-y-2 lg:border-l lg:pl-8">
            <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Audit trail
            </h2>
            <ChecklistTemplateAuditPanel templateId={id} embedded />
          </div>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        Active{' '}
        <span className="text-foreground font-medium">
          {detail.activeVersion ? `v${detail.activeVersion.versionNumber}` : '—'}
        </span>
        {' · '}Draft{' '}
        <span className="text-foreground font-medium">
          {detail.draftVersion ? `v${detail.draftVersion.versionNumber}` : '—'}
        </span>
      </p>

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
