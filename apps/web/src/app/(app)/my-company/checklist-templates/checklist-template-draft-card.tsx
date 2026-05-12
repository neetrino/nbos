'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PermissionGate } from '@/lib/permissions';
import type { ChecklistTemplateItem } from '@/lib/api/checklist-templates';
import { ChecklistDraftItemsEditor } from './checklist-draft-items-editor';

type Props = {
  templateId: string;
  readOnly: boolean;
  items: ChecklistTemplateItem[];
  onItemsChange: (next: ChecklistTemplateItem[]) => void;
  saving: boolean;
  publishing: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onArchive: () => void;
};

export function ChecklistTemplateDraftCard({
  templateId,
  readOnly,
  items,
  onItemsChange,
  saving,
  publishing,
  onSaveDraft,
  onPublish,
  onArchive,
}: Props) {
  return (
    <Card className="border-border/80 shadow-sm shadow-black/[0.04]">
      <CardContent className="space-y-5 p-4 sm:p-5">
        <ChecklistDraftItemsEditor
          templateId={templateId}
          items={items}
          disabled={readOnly}
          onChange={onItemsChange}
        />
        <div className="border-border/60 flex flex-wrap gap-2 border-t pt-4">
          <PermissionGate module="CHECKLIST_TEMPLATES" action="EDIT">
            <Button type="button" disabled={readOnly || saving} onClick={onSaveDraft}>
              {saving ? 'Saving…' : 'Save draft'}
            </Button>
          </PermissionGate>
          <PermissionGate module="CHECKLIST_TEMPLATES" action="PUBLISH">
            <Button
              type="button"
              variant="secondary"
              disabled={readOnly || publishing}
              onClick={onPublish}
            >
              {publishing ? 'Publishing…' : 'Publish draft'}
            </Button>
          </PermissionGate>
          <PermissionGate module="CHECKLIST_TEMPLATES" action="ARCHIVE">
            <Button
              type="button"
              variant="outline"
              disabled={readOnly || saving}
              onClick={onArchive}
            >
              Archive
            </Button>
          </PermissionGate>
        </div>
        {readOnly ? (
          <p className="text-muted-foreground text-sm">This template is archived.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
