'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CreateFormDialog, FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { getApiErrorMessage } from '@/lib/api-errors';
import { workSpaceSprintsApi, type WorkSpaceSprint } from '@/lib/api/work-space-sprints';

export function CreateWorkSpaceSprintDialog({
  open,
  onOpenChange,
  workspaceId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onCreated: (sprint: WorkSpaceSprint) => void;
}) {
  const t = useTranslations('workSpaces');
  const tCommon = useTranslations('common');
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('scrum.createTitle')}
      submitting={saving}
      canSubmit={Boolean(name.trim()) && !saving}
      submitLabel={tCommon('create')}
      submittingLabel={tCommon('creating')}
      cancelLabel={tCommon('cancel')}
      onSubmit={(event) =>
        void submitSprint({
          event,
          workspaceId,
          name,
          goal,
          startDate,
          endDate,
          setSaving,
          setName,
          setGoal,
          setStartDate,
          setEndDate,
          onCreated,
          onOpenChange,
          created: t('scrum.created'),
          failed: t('scrum.createFailed'),
        })
      }
    >
      <InlineField
        variant="controlled"
        label={t('scrum.name')}
        type="text"
        value={name}
        placeholder={t('scrum.namePlaceholder')}
        onValueChange={setName}
      />
      <InlineField
        variant="controlled"
        label={t('scrum.goal')}
        type="text"
        value={goal}
        placeholder={t('scrum.goalPlaceholder')}
        onValueChange={setGoal}
      />
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('scrum.startDate')}
          type="date"
          value={startDate}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={setStartDate}
        />
        <InlineField
          variant="controlled"
          label={t('scrum.endDate')}
          type="date"
          value={endDate}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={setEndDate}
        />
      </FormFieldRow>
    </CreateFormDialog>
  );
}

async function submitSprint(options: {
  event: FormEvent;
  workspaceId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  setSaving: (saving: boolean) => void;
  setName: (name: string) => void;
  setGoal: (goal: string) => void;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  onCreated: (sprint: WorkSpaceSprint) => void;
  onOpenChange: (open: boolean) => void;
  created: string;
  failed: string;
}): Promise<void> {
  options.event.preventDefault();
  if (!options.name.trim()) return;
  options.setSaving(true);
  try {
    const sprint = await workSpaceSprintsApi.create(options.workspaceId, {
      name: options.name.trim(),
      goal: options.goal.trim() || undefined,
      startDate: options.startDate || undefined,
      endDate: options.endDate || undefined,
    });
    options.onCreated(sprint);
    options.setName('');
    options.setGoal('');
    options.setStartDate('');
    options.setEndDate('');
    options.onOpenChange(false);
    toast.success(options.created);
  } catch (caught) {
    toast.error(getApiErrorMessage(caught, options.failed));
  } finally {
    options.setSaving(false);
  }
}
