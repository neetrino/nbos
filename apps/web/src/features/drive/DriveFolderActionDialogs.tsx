'use client';

import { useState, type FormEvent } from 'react';
import { CreateFormDialog, DeleteConfirmDialog, InlineField } from '@/components/shared';
import type { DriveFolder } from '@/lib/api/drive';
import { DRIVE_FOLDER_NAME_MAX_LENGTH } from './drive-folder-tree';

export function DriveCreateFolderDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
}) {
  return (
    <DriveFolderNameDialog
      key={open ? 'create' : 'closed'}
      open={open}
      title="New folder"
      description="Choose a name for the folder in the current location."
      submitLabel="Create"
      submittingLabel="Creating..."
      canSubmit={(name) => Boolean(name.trim())}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
    />
  );
}

export function DriveRenameFolderDialog({
  folder,
  open,
  onOpenChange,
  onSubmit,
}: {
  folder: DriveFolder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (folderId: string, name: string) => Promise<void>;
}) {
  return (
    <DriveFolderNameDialog
      key={open && folder ? folder.id : 'closed'}
      open={open}
      title="Rename folder"
      description="Update how this folder appears in Drive."
      submitLabel="Save"
      submittingLabel="Saving..."
      initialName={folder?.name ?? ''}
      canSubmit={(name) => Boolean(folder && name.trim() && name.trim() !== folder.name)}
      onOpenChange={onOpenChange}
      onSubmit={async (name) => {
        if (!folder) return;
        await onSubmit(folder.id, name);
      }}
    />
  );
}

function DriveFolderNameDialog({
  open,
  title,
  description,
  submitLabel,
  submittingLabel,
  initialName = '',
  canSubmit,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description: string;
  submitLabel: string;
  submittingLabel: string;
  initialName?: string;
  canSubmit: (name: string) => boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      submitting={busy}
      canSubmit={canSubmit(name) && !busy}
      submitLabel={submitLabel}
      submittingLabel={submittingLabel}
      cancelLabel="Cancel"
      onSubmit={(event) => void submitFolderName({ event, name, setBusy, onOpenChange, onSubmit })}
    >
      <InlineField
        variant="controlled"
        label="Name"
        type="text"
        value={name}
        placeholder="Folder name"
        onValueChange={(value) => setName(value.slice(0, DRIVE_FOLDER_NAME_MAX_LENGTH))}
      />
    </CreateFormDialog>
  );
}

async function submitFolderName(options: {
  event: FormEvent;
  name: string;
  setBusy: (busy: boolean) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
}): Promise<void> {
  options.event.preventDefault();
  const trimmed = options.name.trim();
  if (!trimmed) return;
  options.setBusy(true);
  try {
    await options.onSubmit(trimmed);
    options.onOpenChange(false);
  } catch {
    // Caller shows toast.
  } finally {
    options.setBusy(false);
  }
}

export function DriveDeleteFolderDialog({
  folder,
  open,
  onOpenChange,
  onConfirm,
}: {
  folder: DriveFolder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (folderId: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <DeleteConfirmDialog
      level="simple"
      open={open}
      onOpenChange={onOpenChange}
      itemName={folder?.name ?? ''}
      title="Delete folder?"
      description="The folder must be empty — no files and no subfolders."
      isSubmitting={busy}
      onConfirm={async () => {
        if (!folder) return;
        setBusy(true);
        try {
          await onConfirm(folder.id);
          onOpenChange(false);
        } catch {
          // Caller shows toast.
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}
