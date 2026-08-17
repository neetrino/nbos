'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  DeleteConfirmDialog,
  DetailSheetFormFooter,
  DetailSheetSection,
  EntityDetailSheetContent,
} from '@/components/shared';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/lib/api-errors';
import { recurringTasksApi, type RecurringTaskTemplate } from '@/lib/api/recurring-tasks';
import { TASK_OPEN_QUERY } from '@/features/tasks/constants/task-open-query';
import { RecurringTaskChecklistFields } from './RecurringTaskChecklistFields';
import { RecurringTaskIdentityFields } from './RecurringTaskIdentityFields';
import { RecurringTaskScheduleFields } from './RecurringTaskScheduleFields';
import { RecurringTaskSheetHeader } from './RecurringTaskSheetHeader';
import {
  createEmptyRecurringDraft,
  createRecurringDraftFromTemplate,
  isRecurringDraftDirty,
  recurringDraftToPayload,
  type RecurringTaskFormDraft,
} from './recurring-task-form-state';

interface RecurringTaskSheetProps {
  open: boolean;
  template: RecurringTaskTemplate | null;
  creatorId: string | null;
  canEdit: boolean;
  canDelete: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (template: RecurringTaskTemplate) => void;
  onDeleted: (id: string) => void;
}

export function RecurringTaskSheet({
  open,
  template,
  creatorId,
  canEdit,
  canDelete,
  onOpenChange,
  onSaved,
  onDeleted,
}: RecurringTaskSheetProps) {
  const isCreate = template === null;
  const [draft, setDraft] = useState<RecurringTaskFormDraft>(createEmptyRecurringDraft);
  const [snap, setSnap] = useState<RecurringTaskFormDraft>(createEmptyRecurringDraft);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const next = template
      ? createRecurringDraftFromTemplate(template)
      : createEmptyRecurringDraft();
    setDraft(next);
    setSnap(next);
    setFormError(null);
  }, [open, template]);

  const dirty = isRecurringDraftDirty(draft, snap);
  const disabled = saving || !canEdit;
  const patchDraft = (patch: Partial<RecurringTaskFormDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <EntityDetailSheetContent
          open={open}
          layout="full"
          width="medium"
          sourcePageHref="/tasks/recurring"
        >
          <RecurringTaskSheetHeader
            title={draft.title.trim() || template?.title || 'New recurring task'}
            isCreate={isCreate}
            isActive={draft.isActive}
            canEdit={canEdit}
            canDelete={canDelete}
            running={running}
            onRunNow={() => void handleRunNow()}
            onToggleActive={() => patchDraft({ isActive: !draft.isActive })}
            onDelete={() => setDeleteOpen(true)}
          />
          <ScrollArea className="min-h-0 flex-1">
            <div className="grid gap-4 px-5 py-5">
              {canEdit && !isCreate ? (
                <ActiveSwitch
                  checked={draft.isActive}
                  disabled={disabled}
                  onCheckedChange={(isActive) => patchDraft({ isActive })}
                />
              ) : null}
              <DetailSheetSection title="Task">
                <RecurringTaskIdentityFields
                  draft={draft}
                  disabled={disabled}
                  onPatch={patchDraft}
                />
              </DetailSheetSection>
              <DetailSheetSection title="Schedule">
                <RecurringTaskScheduleFields
                  draft={draft}
                  disabled={disabled}
                  onPatch={patchDraft}
                />
              </DetailSheetSection>
              <DetailSheetSection title="Defaults">
                <RecurringTaskChecklistFields
                  draft={draft}
                  disabled={disabled}
                  onPatch={patchDraft}
                />
              </DetailSheetSection>
            </div>
          </ScrollArea>
          <DetailSheetFormFooter
            visible={canEdit}
            dirty={isCreate || dirty}
            saving={saving}
            errorMessage={formError}
            saveLabel={isCreate ? 'Create' : 'Save'}
            onSave={() => void handleSave()}
            onCancel={() => (isCreate ? onOpenChange(false) : setDraft(snap))}
          />
        </EntityDetailSheetContent>
      </Sheet>
      {template ? (
        <DeleteConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          level="simple"
          itemName={template.title}
          title="Delete this recurring template?"
          description="Existing spawned tasks stay. The schedule will stop creating new ones."
          forceNestedBackdrop
          onConfirm={() => void handleDelete(template.id)}
        />
      ) : null}
    </>
  );

  async function handleSave() {
    if (!draft.title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (isCreate && !creatorId) {
      setFormError('Your account is not linked to an employee record.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = recurringDraftToPayload(draft);
      const saved =
        isCreate && creatorId
          ? await recurringTasksApi.create({ ...payload, creatorId })
          : await recurringTasksApi.update(template?.id ?? '', payload);
      onSaved(saved);
      onOpenChange(false);
      toast.success(isCreate ? 'Recurring task created.' : 'Recurring task updated.');
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, 'Recurring task could not be saved.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await recurringTasksApi.remove(id);
      onDeleted(id);
      setDeleteOpen(false);
      onOpenChange(false);
      toast.success('Recurring template deleted.');
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Template could not be deleted.'));
    }
  }

  async function handleRunNow() {
    if (!template) return;
    setRunning(true);
    try {
      const result = await recurringTasksApi.runNow(template.id);
      onSaved(result.template);
      toast.success(`Created ${result.task.code}`, {
        action: {
          label: 'Open',
          onClick: () => {
            window.location.href = `/tasks?${TASK_OPEN_QUERY}=${encodeURIComponent(result.task.id)}`;
          },
        },
      });
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Task could not be created.'));
    } finally {
      setRunning(false);
    }
  }
}

function ActiveSwitch({
  checked,
  disabled,
  onCheckedChange,
}: {
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="border-border bg-card flex items-center justify-between rounded-2xl border px-4 py-3">
      <div>
        <Label htmlFor="recurring-active">Active schedule</Label>
        <p className="text-muted-foreground text-xs">Paused templates do not create new tasks.</p>
      </div>
      <Switch
        id="recurring-active"
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
