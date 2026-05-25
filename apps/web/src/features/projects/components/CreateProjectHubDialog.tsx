'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
};

async function createProjectRecord(input: {
  name: string;
  contactId: string;
  description: string;
  companyId: string;
}): Promise<Project> {
  return projectsApi.create({
    name: input.name,
    contactId: input.contactId,
    description: input.description || undefined,
    ...(input.companyId ? { companyId: input.companyId } : {}),
  });
}

export function CreateProjectHubDialog({
  open,
  onOpenChange,
  onCreated,
  defaultName = '',
}: CreateProjectHubDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contactId, setContactId] = useState('');
  const [contactLabel, setContactLabel] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [companyLabel, setCompanyLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setName('');
    setDescription('');
    setContactId('');
    setContactLabel('');
    setCompanyId('');
    setCompanyLabel('');
    setSubmitError(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    setName(defaultName.trim());
  }, [open, defaultName]);

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

  const handleOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange(next);
      if (!next) reset();
    },
    [onOpenChange, reset],
  );

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || !contactId) return;
    setSaving(true);
    setSubmitError(null);
    try {
      const project = await createProjectRecord({
        name: trimmed,
        contactId,
        description: description.trim(),
        companyId,
      });
      onCreated(project);
      handleOpenChange(false);
    } catch {
      setSubmitError('Project could not be created. Check the fields and try again.');
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = name.trim().length > 0 && contactId.length > 0 && !saving;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>

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
          error={submitError}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={!canSubmit}>
            {saving ? 'Creating…' : 'Create project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
