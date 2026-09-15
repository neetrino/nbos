'use client';

import { useState, type FormEvent } from 'react';
import { CreateFormDialog, InlineField } from '@/components/shared';

interface CredentialFolderNameDialogProps {
  open: boolean;
  title: string;
  initialName?: string;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void | Promise<void>;
}

export function CredentialFolderNameDialog(props: CredentialFolderNameDialogProps) {
  const sessionKey = props.open ? `open:${props.initialName}` : 'closed';
  return <CredentialFolderNameDialogSession key={sessionKey} {...props} />;
}

function CredentialFolderNameDialogSession({
  open,
  title,
  initialName = '',
  busy = false,
  onOpenChange,
  onSubmit,
}: CredentialFolderNameDialogProps) {
  const [name, setName] = useState(initialName);

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      submitting={busy}
      canSubmit={Boolean(name.trim()) && !busy}
      submitLabel="Save"
      submittingLabel="Saving..."
      cancelLabel="Cancel"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        void onSubmit(name.trim());
      }}
    >
      <InlineField
        variant="controlled"
        label="Name"
        type="text"
        value={name}
        placeholder="Folder name"
        disabled={busy}
        onValueChange={setName}
      />
    </CreateFormDialog>
  );
}
