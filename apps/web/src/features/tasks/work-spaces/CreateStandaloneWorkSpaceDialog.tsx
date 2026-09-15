'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { CreateFormDialog, CreateFormSwitchField, InlineField } from '@/components/shared';
import { tasksApi, type WorkSpace } from '@/lib/api/tasks';

interface CreateStandaloneWorkSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (workspace: WorkSpace) => void;
}

export function CreateStandaloneWorkSpaceDialog(props: CreateStandaloneWorkSpaceDialogProps) {
  return <CreateStandaloneWorkSpaceSession key={props.open ? 'open' : 'closed'} {...props} />;
}

function CreateStandaloneWorkSpaceSession({
  open,
  onOpenChange,
  onCreated,
}: CreateStandaloneWorkSpaceDialogProps) {
  const t = useTranslations('workSpaces');
  const tCommon = useTranslations('common');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scrumEnabled, setScrumEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('create.title')}
      error={error}
      submitting={saving}
      canSubmit={Boolean(name.trim()) && !saving}
      submitLabel={t('create.submit')}
      submittingLabel={tCommon('creating')}
      cancelLabel={tCommon('cancel')}
      onSubmit={(event) =>
        void submitWorkSpace({
          event,
          name,
          description,
          scrumEnabled,
          setSaving,
          setError,
          onCreated,
          onOpenChange,
          failed: t('create.failed'),
        })
      }
    >
      <InlineField
        variant="controlled"
        label={t('create.name')}
        type="text"
        value={name}
        placeholder={t('create.namePlaceholder')}
        onValueChange={setName}
      />
      <InlineField
        variant="controlled"
        label={t('create.description')}
        type="textarea"
        value={description}
        placeholder={t('create.descriptionPlaceholder')}
        onValueChange={setDescription}
      />
      <CreateFormSwitchField
        label={t('create.scrum')}
        checked={scrumEnabled}
        onCheckedChange={setScrumEnabled}
      />
      <p className="text-muted-foreground text-xs">{t('create.scrumHint')}</p>
    </CreateFormDialog>
  );
}

async function submitWorkSpace(options: {
  event: FormEvent;
  name: string;
  description: string;
  scrumEnabled: boolean;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  onCreated: (workspace: WorkSpace) => void;
  onOpenChange: (open: boolean) => void;
  failed: string;
}): Promise<void> {
  options.event.preventDefault();
  if (!options.name.trim()) return;
  options.setSaving(true);
  options.setError(null);
  try {
    const workspace = await tasksApi.createWorkSpace({
      name: options.name.trim(),
      description: options.description.trim() || undefined,
      type: 'STANDALONE_OPERATIONAL',
      scrumEnabled: options.scrumEnabled,
    });
    options.onCreated(workspace);
    options.onOpenChange(false);
  } catch {
    options.setError(options.failed);
  } finally {
    options.setSaving(false);
  }
}
