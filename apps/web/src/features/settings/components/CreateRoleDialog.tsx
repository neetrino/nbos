'use client';

import { CreateFormDialog, InlineField } from '@/components/shared';

export function CreateRoleDialog(props: {
  open: boolean;
  name: string;
  slug: string;
  level: number;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onNameChange: (name: string) => void;
  onSlugChange: (slug: string) => void;
  onLevelChange: (level: number) => void;
  onCreate: () => void;
}) {
  return (
    <CreateFormDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title="Create Role"
      submitting={props.saving}
      canSubmit={Boolean(props.name.trim()) && !props.saving}
      submitLabel="Create"
      submittingLabel="Creating..."
      cancelLabel="Cancel"
      onSubmit={(event) => {
        event.preventDefault();
        props.onCreate();
      }}
    >
      <InlineField
        variant="controlled"
        label="Name"
        type="text"
        value={props.name}
        placeholder="e.g. Custom Manager"
        onValueChange={props.onNameChange}
      />
      <InlineField
        variant="controlled"
        label="Slug"
        type="text"
        value={props.slug}
        placeholder="e.g. custom-manager"
        onValueChange={props.onSlugChange}
      />
      <InlineField
        variant="controlled"
        label="Level"
        type="number"
        value={String(props.level)}
        onValueChange={(value) => props.onLevelChange(parseInt(value, 10) || 0)}
      />
    </CreateFormDialog>
  );
}
