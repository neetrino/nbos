'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { CreateFormDialog } from '@/components/shared';
import { projectsApi, type Project } from '@/lib/api/projects';
import type { RelationCreatedEvent } from '@/components/shared/relation-picker';
import { useRegisterRelationCreated } from '@/components/shared/relation-picker/use-register-relation-created';
import { CreateProjectHubDialogFields } from './create-project-hub-dialog-fields';
import { applyProjectHubRelationCreated } from './apply-project-hub-relation-created';

export type CreateProjectHubDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (project: Project) => void;
  defaultName?: string;
  forceNestedBackdrop?: boolean;
};

export function CreateProjectHubDialog(props: CreateProjectHubDialogProps) {
  const sessionKey = props.open ? `open:${props.defaultName ?? ''}` : 'closed';
  return <CreateProjectHubDialogSession key={sessionKey} {...props} />;
}

function CreateProjectHubDialogSession({
  open,
  onOpenChange,
  onCreated,
  defaultName = '',
  forceNestedBackdrop = false,
}: CreateProjectHubDialogProps) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');
  const [name, setName] = useState(defaultName.trim());
  const [description, setDescription] = useState('');
  const [contactId, setContactId] = useState('');
  const [contactLabel, setContactLabel] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [companyLabel, setCompanyLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const canSubmit = name.trim().length > 0 && contactId.length > 0 && !saving;

  const handleRelationCreated = useCallback(
    (event: RelationCreatedEvent) => {
      const next = applyProjectHubRelationCreated(
        { contactId, contactLabel, companyId, companyLabel },
        event,
      );
      setContactId(next.contactId);
      setContactLabel(next.contactLabel);
      setCompanyId(next.companyId);
      setCompanyLabel(next.companyLabel);
    },
    [contactId, contactLabel, companyId, companyLabel],
  );
  useRegisterRelationCreated(open ? handleRelationCreated : null);

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('project.title')}
      error={submitError}
      submitting={saving}
      canSubmit={canSubmit}
      submitLabel={tCommon('create')}
      submittingLabel={tCommon('creating')}
      cancelLabel={tCommon('cancel')}
      forceNestedBackdrop={forceNestedBackdrop}
      onSubmit={(event) =>
        void submitProjectHub({
          event,
          name,
          contactId,
          description,
          companyId,
          setSaving,
          setSubmitError,
          onCreated,
          onOpenChange,
          fallbackError: t('project.createError'),
        })
      }
    >
      <CreateProjectHubDialogFields
        name={name}
        onNameChange={setName}
        description={description}
        onDescriptionChange={setDescription}
        contactId={contactId}
        contactLabel={contactLabel}
        onContactChange={(id, label) => {
          setContactId(id);
          setContactLabel(label);
        }}
        companyId={companyId}
        companyLabel={companyLabel}
        onCompanyChange={(id, label) => {
          setCompanyId(id);
          setCompanyLabel(label);
        }}
        onCompanyClear={() => {
          setCompanyId('');
          setCompanyLabel('');
        }}
        saving={saving}
      />
    </CreateFormDialog>
  );
}

async function submitProjectHub(options: {
  event: FormEvent;
  name: string;
  contactId: string;
  description: string;
  companyId: string;
  setSaving: (saving: boolean) => void;
  setSubmitError: (error: string | null) => void;
  onCreated: (project: Project) => void;
  onOpenChange: (open: boolean) => void;
  fallbackError: string;
}): Promise<void> {
  options.event.preventDefault();
  const trimmed = options.name.trim();
  if (!trimmed || !options.contactId) return;
  options.setSaving(true);
  options.setSubmitError(null);
  try {
    const project = await projectsApi.create({
      name: trimmed,
      contactId: options.contactId,
      description: options.description.trim() || undefined,
      ...(options.companyId ? { companyId: options.companyId } : {}),
    });
    options.onCreated(project);
    options.onOpenChange(false);
  } catch {
    options.setSubmitError(options.fallbackError);
  } finally {
    options.setSaving(false);
  }
}
