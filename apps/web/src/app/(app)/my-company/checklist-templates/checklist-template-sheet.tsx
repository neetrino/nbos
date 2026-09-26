'use client';

import { Sheet } from '@/components/ui/sheet';
import { EntityDetailSheetContent } from '@/components/shared';
import type { ChecklistTemplateDetail } from '@/lib/api/checklist-templates';
import { ChecklistTemplateCreateForm } from './checklist-template-create-form';
import { ChecklistTemplateEditSheet } from './checklist-template-edit-sheet';

export function ChecklistTemplateSheet({
  open,
  creating,
  templateId,
  onOpenChange,
  onCreated,
  onChanged,
  onDuplicated,
}: {
  open: boolean;
  creating: boolean;
  templateId: string | null;
  onOpenChange: (open: boolean) => void;
  onCreated: (row: ChecklistTemplateDetail) => void;
  onChanged: () => void;
  onDuplicated: (id: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout="full"
        width="medium"
        showRailActions={false}
        sourcePageHref="/my-company/checklist-templates"
      >
        {creating || templateId == null ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-border shrink-0 border-b px-5 py-3">
              <h2 className="text-base font-semibold">New template</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Start with a name. Steps are added on the next screen, still in this panel.
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <ChecklistTemplateCreateForm onCreated={onCreated} />
            </div>
          </div>
        ) : (
          <ChecklistTemplateEditSheet
            templateId={templateId}
            onChanged={onChanged}
            onDuplicated={onDuplicated}
          />
        )}
      </EntityDetailSheetContent>
    </Sheet>
  );
}
