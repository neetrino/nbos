'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');
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
            title={draft.title.trim() || template?.title || t('recurring.new')}
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
              <DetailSheetSection title={t('recurring.sectionTask')}>
                <RecurringTaskIdentityFields
                  draft={draft}
                  disabled={disabled}
                  onPatch={patchDraft}
                />
              </DetailSheetSection>
              <DetailSheetSection title={t('recurring.sectionSchedule')}>
                <RecurringTaskScheduleFields
                  draft={draft}
                  disabled={disabled}
                  onPatch={patchDraft}
                />
              </DetailSheetSection>
              <DetailSheetSection title={t('recurring.sectionDefaults')}>
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
            saveLabel={isCreate ? tCommon('create') : tCommon('save')}
            cancelLabel={tCommon('cancel')}
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
          title={t('recurring.deleteTitle')}
          description={t('recurring.deleteDescription')}
          confirmLabel={t('recurring.delete')}
          dismissLabel={tCommon('cancel')}
          forceNestedBackdrop
          onConfirm={() => void handleDelete(template.id)}
        />
      ) : null}
    </>
  );

  async function handleSave() {
    if (!draft.title.trim()) {
      setFormError(t('recurring.titleRequired'));
      return;
    }
    if (isCreate && !creatorId) {
      setFormError(t('recurring.employeeRequired'));
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
      toast.success(isCreate ? t('recurring.created') : t('recurring.updated'));
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, t('recurring.saveFailed')));
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
      toast.success(t('recurring.deleted'));
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, t('recurring.deleteFailed')));
    }
  }

  async function handleRunNow() {
    if (!template) return;
    setRunning(true);
    try {
      const result = await recurringTasksApi.runNow(template.id);
      onSaved(result.template);
      toast.success(t('recurring.runCreated', { code: result.task.code }), {
        action: {
          label: tCommon('sheet.open'),
          onClick: () => {
            window.location.href = `/tasks?${TASK_OPEN_QUERY}=${encodeURIComponent(result.task.id)}`;
          },
        },
      });
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, t('recurring.runFailed')));
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
  const t = useTranslations('tasks');
  return (
    <div className="border-border bg-card flex items-center justify-between rounded-2xl border px-4 py-3">
      <div>
        <Label htmlFor="recurring-active">{t('recurring.activeSchedule')}</Label>
        <p className="text-muted-foreground text-xs">{t('recurring.pausedHint')}</p>
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
