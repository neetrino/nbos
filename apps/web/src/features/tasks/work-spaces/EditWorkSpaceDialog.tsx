'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { CreateFormDialog, InlineField } from '@/components/shared';
import { tasksApi, type WorkSpace } from '@/lib/api/tasks';

interface EditWorkSpaceDialogProps {
  workspace: WorkSpace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (workspace: WorkSpace) => void;
}

export function EditWorkSpaceDialog(props: EditWorkSpaceDialogProps) {
  const sessionKey = props.open ? props.workspace.id : 'closed';
  return <EditWorkSpaceDialogSession key={sessionKey} {...props} />;
}

function EditWorkSpaceDialogSession({
  workspace,
  open,
  onOpenChange,
  onUpdated,
}: EditWorkSpaceDialogProps) {
  const t = useTranslations('workSpaces');
  const tCommon = useTranslations('common');
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('edit.title')}
      error={error}
      submitting={saving}
      canSubmit={Boolean(name.trim()) && !saving}
      submitLabel={t('edit.save')}
      submittingLabel={tCommon('saving')}
      cancelLabel={tCommon('cancel')}
      onSubmit={(event) =>
        void submitWorkSpaceEdit({
          event,
          workspaceId: workspace.id,
          name,
          description,
          setSaving,
          setError,
          onUpdated,
          onOpenChange,
          failed: t('edit.failed'),
        })
      }
    >
      <InlineField
        variant="controlled"
        label={t('edit.name')}
        type="text"
        value={name}
        onValueChange={setName}
      />
      <InlineField
        variant="controlled"
        label={t('edit.description')}
        type="textarea"
        value={description}
        onValueChange={setDescription}
      />
    </CreateFormDialog>
  );
}

async function submitWorkSpaceEdit(options: {
  event: FormEvent;
  workspaceId: string;
  name: string;
  description: string;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  onUpdated: (workspace: WorkSpace) => void;
  onOpenChange: (open: boolean) => void;
  failed: string;
}): Promise<void> {
  options.event.preventDefault();
  if (!options.name.trim()) return;
  options.setSaving(true);
  options.setError(null);
  try {
    const updated = await tasksApi.updateWorkSpace(options.workspaceId, {
      name: options.name.trim(),
      description: options.description.trim() || null,
    });
    options.onUpdated(updated);
    options.onOpenChange(false);
  } catch {
    options.setError(options.failed);
  } finally {
    options.setSaving(false);
  }
}
