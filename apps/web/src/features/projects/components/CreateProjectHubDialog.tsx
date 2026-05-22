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

import { CreateProjectHubDialogFields } from './create-project-hub-dialog-fields';
import { useProjectHubCreateOptions } from './use-project-hub-create-options';

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
  const [companyId, setCompanyId] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { contacts, companies, optionsLoading, loadError, setLoadError } =
    useProjectHubCreateOptions(open);

  const reset = useCallback(() => {
    setName('');
    setDescription('');
    setContactId('');
    setCompanyId('');
    setSubmitError(null);
    setLoadError(null);
  }, [setLoadError]);

  useEffect(() => {
    if (!open) return;
    setName(defaultName.trim());
  }, [open, defaultName]);

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

  const displayError = loadError ?? submitError;
  const canSubmit = name.trim().length > 0 && contactId.length > 0 && !optionsLoading && !saving;

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
          onContactIdChange={setContactId}
          companyId={companyId}
          onCompanyIdChange={setCompanyId}
          contacts={contacts}
          companies={companies}
          optionsLoading={optionsLoading}
          saving={saving}
          error={displayError}
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
