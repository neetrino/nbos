'use client';

import { useState, type FormEvent } from 'react';
import { CreateFormDialog, InlineField } from '@/components/shared';
import { documentsApi, type DocumentSection } from '@/lib/api/documents';
import { DRIVE_LIBRARIES } from '@/features/drive/drive-options';
import { getApiErrorMessage } from '@/lib/api-errors';

type LocationProp =
  | { kind: 'library-category'; key: string }
  | { kind: 'library-entity'; key: string; entityType: string; entityId: string; label: string }
  | { kind: 'library-folder'; key: string; folderId: string }
  | { kind: 'drive-folder'; folderId: string; space: 'COMPANY' | 'PERSONAL' };

interface CreateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: LocationProp;
  sections?: DocumentSection[];
  defaultSectionId?: string;
  onCreated?: (documentId: string) => void;
}

function locationLabel(loc: LocationProp): string {
  if (loc.kind === 'library-category') {
    return DRIVE_LIBRARIES.find((library) => library.key === loc.key)?.title ?? loc.key;
  }
  if (loc.kind === 'library-entity') return loc.label;
  if (loc.kind === 'library-folder') {
    const libTitle = DRIVE_LIBRARIES.find((library) => library.key === loc.key)?.title ?? loc.key;
    return `${libTitle} folder`;
  }
  return loc.space === 'COMPANY' ? 'Company Drive folder' : 'Personal Drive folder';
}

export function CreateDocumentDialog(props: CreateDocumentDialogProps) {
  const sessionKey = props.open
    ? `${props.location ? JSON.stringify(props.location) : 'legacy'}:${props.defaultSectionId ?? ''}`
    : 'closed';
  return <CreateDocumentDialogSession key={sessionKey} {...props} />;
}

function CreateDocumentDialogSession({
  open,
  onOpenChange,
  location,
  sections,
  defaultSectionId,
  onCreated,
}: CreateDocumentDialogProps) {
  const [title, setTitle] = useState('');
  const [sectionId, setSectionId] = useState(defaultSectionId ?? sections?.[0]?.id ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasValidContext = Boolean(location || (sections && sections.length > 0));
  const canSubmit =
    hasValidContext && Boolean(title.trim()) && (location ? true : Boolean(sectionId));
  const sectionOptions =
    sections?.map((section) => ({ value: section.id, label: section.name })) ?? [];
  const description = location
    ? `Creating in: ${locationLabel(location)}`
    : hasValidContext
      ? 'Add a title and pick a section. The native editor opens after creation.'
      : 'Select a folder or section first.';

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create document"
      description={description}
      error={error}
      submitting={saving}
      canSubmit={canSubmit}
      submitLabel="Create draft"
      submittingLabel="Creating…"
      cancelLabel="Cancel"
      onSubmit={(event) =>
        void submitDocument({
          event,
          canSubmit,
          title,
          location,
          sectionId,
          setSaving,
          setError,
          onCreated,
          onOpenChange,
        })
      }
    >
      {hasValidContext ? (
        <InlineField
          variant="controlled"
          label="Title"
          type="text"
          value={title}
          placeholder="e.g. Onboarding checklist"
          onValueChange={setTitle}
        />
      ) : null}
      {hasValidContext && !location && sectionOptions.length > 0 ? (
        <InlineField
          variant="controlled"
          label="Section"
          type="select"
          value={sectionId}
          options={sectionOptions}
          onValueChange={(value) => value && setSectionId(value)}
        />
      ) : null}
    </CreateFormDialog>
  );
}

async function submitDocument(options: {
  event: FormEvent;
  canSubmit: boolean;
  title: string;
  location?: LocationProp;
  sectionId: string;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  onCreated?: (documentId: string) => void;
  onOpenChange: (open: boolean) => void;
}): Promise<void> {
  options.event.preventDefault();
  if (!options.canSubmit || !options.title.trim()) return;
  let payload: Parameters<typeof documentsApi.createDocument>[0];
  if (options.location) {
    if (options.location.kind === 'library-entity') {
      payload = {
        title: options.title.trim(),
        libraryKey: options.location.key,
        entityType: options.location.entityType,
        entityId: options.location.entityId,
      };
    } else if (options.location.kind === 'library-category') {
      payload = { title: options.title.trim(), libraryKey: options.location.key };
    } else {
      payload = { title: options.title.trim(), driveFolderId: options.location.folderId };
    }
  } else {
    if (!options.sectionId) return;
    payload = { title: options.title.trim(), sectionId: options.sectionId };
  }
  options.setSaving(true);
  options.setError(null);
  try {
    const created = await documentsApi.createDocument(payload);
    options.onCreated?.(created.id);
    options.onOpenChange(false);
  } catch (caught) {
    options.setError(getApiErrorMessage(caught, 'Could not create document.'));
  } finally {
    options.setSaving(false);
  }
}
