'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  /** Drive-sourced location from DocumentsSidebar. Mutually exclusive with `sections`. */
  location?: LocationProp;
  /** Legacy section list (documents home / section pages). */
  sections?: DocumentSection[];
  defaultSectionId?: string;
  onCreated?: (documentId: string) => void;
}

function locationLabel(loc: LocationProp): string {
  if (loc.kind === 'library-category') {
    return DRIVE_LIBRARIES.find((l) => l.key === loc.key)?.title ?? loc.key;
  }
  if (loc.kind === 'library-entity') {
    return loc.label;
  }
  if (loc.kind === 'library-folder') {
    const libTitle = DRIVE_LIBRARIES.find((l) => l.key === loc.key)?.title ?? loc.key;
    return `${libTitle} folder`;
  }
  return loc.space === 'COMPANY' ? 'Company Drive folder' : 'Personal Drive folder';
}

export function CreateDocumentDialog({
  open,
  onOpenChange,
  location,
  sections,
  defaultSectionId,
  onCreated,
}: CreateDocumentDialogProps) {
  const [title, setTitle] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTitle('');
    if (!location && sections) {
      const first = defaultSectionId ?? sections[0]?.id ?? '';
      setSectionId(first);
    }
  }, [open, location, sections, defaultSectionId]);

  const handleCreate = async () => {
    if (!title.trim()) return;

    let payload: Parameters<typeof documentsApi.createDocument>[0];
    if (location) {
      if (location.kind === 'library-entity') {
        payload = {
          title: title.trim(),
          libraryKey: location.key,
          entityType: location.entityType,
          entityId: location.entityId,
        };
      } else if (location.kind === 'library-category') {
        payload = { title: title.trim(), libraryKey: location.key };
      } else {
        // library-folder and drive-folder both resolve to driveFolderId
        payload = { title: title.trim(), driveFolderId: location.folderId };
      }
    } else {
      if (!sectionId) return;
      payload = { title: title.trim(), sectionId };
    }

    setSaving(true);
    setError(null);
    try {
      const created = await documentsApi.createDocument(payload);
      onCreated?.(created.id);
      onOpenChange(false);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not create document.'));
    } finally {
      setSaving(false);
    }
  };

  const hasValidContext = !!location || (!!sections && sections.length > 0);
  const canSubmit = hasValidContext && !!title.trim() && (location ? true : !!sectionId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create document</DialogTitle>
          {hasValidContext ? (
            <p className="text-muted-foreground text-sm">
              {location
                ? `Creating in: ${locationLabel(location)}`
                : 'Add a title and pick a section. The native editor opens after creation.'}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">Select a folder or section first.</p>
          )}
        </DialogHeader>

        {hasValidContext ? (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Onboarding checklist"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSubmit) void handleCreate();
                }}
              />
            </div>
            {!location && sections && sections.length > 0 ? (
              <div className="grid gap-2">
                <Label>Section</Label>
                <Select value={sectionId} onValueChange={(v) => setSectionId(v ?? '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {hasValidContext ? (
            <Button type="button" onClick={handleCreate} disabled={saving || !canSubmit}>
              {saving ? 'Creating…' : 'Create draft'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
