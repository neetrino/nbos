'use client';

import { SlidersHorizontal } from 'lucide-react';
import { InsightSheetSection } from '@/components/shared';
import {
  checklistTemplatesApi,
  parseChecklistTemplateItems,
  type ChecklistTemplateDetail,
  type ChecklistTemplateItem,
} from '@/lib/api/checklist-templates';
import { toast } from 'sonner';
import { ChecklistTemplateAuditPanel } from './checklist-template-audit-panel';
import { ChecklistTemplateDraftCard } from './checklist-template-draft-card';
import { ChecklistTemplateMetadataSection } from './checklist-template-metadata-section';
import { ChecklistTemplateVersionHistory } from './checklist-template-version-history';

export type ChecklistTemplateSheetTab = 'steps' | 'details' | 'versions' | 'changes';

export function ChecklistTemplateEditPanel({
  tab,
  templateId,
  detail,
  readOnly,
  items,
  saving,
  publishing,
  onItemsChange,
  onUpdated,
  onSaveDraft,
  onPublish,
  onArchive,
  onPreview,
}: {
  tab: ChecklistTemplateSheetTab;
  templateId: string;
  detail: ChecklistTemplateDetail;
  readOnly: boolean;
  items: ChecklistTemplateItem[];
  saving: boolean;
  publishing: boolean;
  onItemsChange: (next: ChecklistTemplateItem[]) => void;
  onUpdated: (next: ChecklistTemplateDetail) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onArchive: () => void;
  onPreview: (versionId: string, label: string) => void;
}) {
  if (tab === 'details') {
    return (
      <InsightSheetSection
        icon={<SlidersHorizontal size={15} />}
        title="Details"
        hint="Name, category, and where this checklist is used."
      >
        <ChecklistTemplateMetadataSection
          templateId={templateId}
          detail={detail}
          readOnly={readOnly}
          onUpdated={onUpdated}
          embedded
        />
      </InsightSheetSection>
    );
  }
  if (tab === 'versions') {
    return (
      <ChecklistTemplateVersionHistory versions={detail.versions} plain onPreview={onPreview} />
    );
  }
  if (tab === 'changes') {
    return <ChecklistTemplateAuditPanel templateId={templateId} embedded unbounded />;
  }
  return (
    <ChecklistTemplateDraftCard
      templateId={templateId}
      readOnly={readOnly}
      items={items}
      onItemsChange={onItemsChange}
      saving={saving}
      publishing={publishing}
      onSaveDraft={onSaveDraft}
      onPublish={onPublish}
      onArchive={onArchive}
      plain
    />
  );
}

export async function openVersionPreview({
  templateId,
  versionId,
  label,
  setPreview,
  setPreviewItems,
  setPreviewLoading,
}: {
  templateId: string;
  versionId: string;
  label: string;
  setPreview: (value: { versionId: string; label: string } | null) => void;
  setPreviewItems: (items: ChecklistTemplateItem[]) => void;
  setPreviewLoading: (value: boolean) => void;
}) {
  setPreview({ versionId, label });
  setPreviewLoading(true);
  setPreviewItems([]);
  try {
    const snap = await checklistTemplatesApi.getVersionSnapshot(templateId, versionId);
    setPreviewItems(parseChecklistTemplateItems(snap.items));
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to load version');
    setPreview(null);
  } finally {
    setPreviewLoading(false);
  }
}

export async function runDuplicate({
  templateId,
  setDupBusy,
  setDupOpen,
  onDuplicated,
}: {
  templateId: string;
  setDupBusy: (value: boolean) => void;
  setDupOpen: (value: boolean) => void;
  onDuplicated: (id: string) => void;
}) {
  setDupBusy(true);
  try {
    const next = await checklistTemplatesApi.duplicate(templateId);
    toast.success('Template duplicated');
    setDupOpen(false);
    onDuplicated(next.id);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to duplicate');
  } finally {
    setDupBusy(false);
  }
}
