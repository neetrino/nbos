'use client';

import { useState } from 'react';
import { Clock, History, ListChecks, Loader2, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DetailSheetTabBar, StatusBadge } from '@/components/shared';
import { PermissionGate } from '@/lib/permissions';
import type { ChecklistTemplateItem } from '@/lib/api/checklist-templates';
import { ChecklistTemplateDuplicateDialog } from './checklist-template-duplicate-dialog';
import {
  ChecklistTemplateEditPanel,
  openVersionPreview,
  runDuplicate,
  type ChecklistTemplateSheetTab,
} from './checklist-template-edit-panel';
import { ChecklistTemplatePreviewDialog } from './checklist-template-preview-dialog';
import { useChecklistTemplateEditor } from './use-checklist-template-editor';

const TABS = [
  { value: 'steps', label: 'Steps', icon: ListChecks },
  { value: 'details', label: 'Details', icon: SlidersHorizontal },
  { value: 'versions', label: 'Versions', icon: History },
  { value: 'changes', label: 'Recent changes', icon: Clock },
] as const satisfies ReadonlyArray<{
  value: ChecklistTemplateSheetTab;
  label: string;
  icon: typeof ListChecks;
}>;

function statusVariant(status: string): 'green' | 'gray' | 'blue' {
  if (status === 'ACTIVE') return 'green';
  if (status === 'ARCHIVED') return 'gray';
  return 'blue';
}

export function ChecklistTemplateEditSheet({
  templateId,
  onChanged,
  onDuplicated,
}: {
  templateId: string;
  onChanged: () => void;
  onDuplicated: (id: string) => void;
}) {
  const editor = useChecklistTemplateEditor(templateId);
  const [tab, setTab] = useState<ChecklistTemplateSheetTab>('steps');
  const [dupOpen, setDupOpen] = useState(false);
  const [dupBusy, setDupBusy] = useState(false);
  const [preview, setPreview] = useState<{ versionId: string; label: string } | null>(null);
  const [previewItems, setPreviewItems] = useState<ChecklistTemplateItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  if (editor.loading && !editor.detail) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading template…
      </p>
    );
  }

  if (!editor.detail) {
    return <p className="text-muted-foreground text-sm">Template not found.</p>;
  }

  return (
    <ChecklistTemplateEditLoaded
      templateId={templateId}
      editor={editor}
      tab={tab}
      onTab={setTab}
      dupOpen={dupOpen}
      dupBusy={dupBusy}
      preview={preview}
      previewItems={previewItems}
      previewLoading={previewLoading}
      onChanged={onChanged}
      onDuplicated={onDuplicated}
      setDupOpen={setDupOpen}
      setDupBusy={setDupBusy}
      setPreview={setPreview}
      setPreviewItems={setPreviewItems}
      setPreviewLoading={setPreviewLoading}
    />
  );
}

function ChecklistTemplateEditLoaded({
  templateId,
  editor,
  tab,
  onTab,
  dupOpen,
  dupBusy,
  preview,
  previewItems,
  previewLoading,
  onChanged,
  onDuplicated,
  setDupOpen,
  setDupBusy,
  setPreview,
  setPreviewItems,
  setPreviewLoading,
}: {
  templateId: string;
  editor: ReturnType<typeof useChecklistTemplateEditor>;
  tab: ChecklistTemplateSheetTab;
  onTab: (tab: ChecklistTemplateSheetTab) => void;
  dupOpen: boolean;
  dupBusy: boolean;
  preview: { versionId: string; label: string } | null;
  previewItems: ChecklistTemplateItem[];
  previewLoading: boolean;
  onChanged: () => void;
  onDuplicated: (id: string) => void;
  setDupOpen: (open: boolean) => void;
  setDupBusy: (busy: boolean) => void;
  setPreview: (value: { versionId: string; label: string } | null) => void;
  setPreviewItems: (items: ChecklistTemplateItem[]) => void;
  setPreviewLoading: (loading: boolean) => void;
}) {
  const detail = editor.detail;
  if (!detail) return null;
  const readOnly = detail.status === 'ARCHIVED';
  const published = detail.activeVersion
    ? `Published v${detail.activeVersion.versionNumber}`
    : 'Not published';
  const draft = detail.draftVersion ? `Draft v${detail.draftVersion.versionNumber}` : 'No draft';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChecklistTemplateEditHeader
        name={detail.name}
        status={detail.status}
        hint={`${published} · ${draft}`}
        readOnly={readOnly}
        onDuplicate={() => setDupOpen(true)}
      />
      <DetailSheetTabBar
        tabs={TABS}
        activeTab={tab}
        onTabChange={(value) => onTab(value as ChecklistTemplateSheetTab)}
        className="border-border shrink-0 border-b px-5"
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <ChecklistTemplateEditPanel
          tab={tab}
          templateId={templateId}
          detail={detail}
          readOnly={readOnly}
          items={editor.items}
          saving={editor.saving}
          publishing={editor.publishing}
          onItemsChange={editor.setItems}
          onUpdated={(next) => {
            editor.setDetail(next);
            onChanged();
          }}
          onSaveDraft={() => void editor.saveDraft().then(onChanged)}
          onPublish={() => void editor.publish().then(onChanged)}
          onArchive={() => void editor.archive().then(onChanged)}
          onPreview={(versionId, label) =>
            void openVersionPreview({
              templateId,
              versionId,
              label,
              setPreview,
              setPreviewItems,
              setPreviewLoading,
            })
          }
        />
      </div>
      <ChecklistTemplatePreviewDialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
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
        onConfirm={() => void runDuplicate({ templateId, setDupBusy, setDupOpen, onDuplicated })}
      />
    </div>
  );
}

function ChecklistTemplateEditHeader({
  name,
  status,
  hint,
  readOnly,
  onDuplicate,
}: {
  name: string;
  status: string;
  hint: string;
  readOnly: boolean;
  onDuplicate: () => void;
}) {
  return (
    <div className="border-border shrink-0 border-b px-5 py-3">
      <div className="flex items-start justify-between gap-2">
        <h2 className="truncate text-base font-semibold">{name}</h2>
        <StatusBadge label={status} variant={statusVariant(status)} />
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">{hint}</p>
        <PermissionGate module="CHECKLIST_TEMPLATES" action="ADD">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7"
            disabled={readOnly}
            onClick={onDuplicate}
          >
            Duplicate
          </Button>
        </PermissionGate>
      </div>
    </div>
  );
}
