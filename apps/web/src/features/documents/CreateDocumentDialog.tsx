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
import { getApiErrorMessage } from '@/lib/api-errors';

interface CreateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: DocumentSection[];
  defaultSectionId?: string;
  onCreated?: (documentId: string) => void;
}

export function CreateDocumentDialog({
  open,
  onOpenChange,
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
    const first = defaultSectionId ?? sections[0]?.id ?? '';
    setSectionId(first);
  }, [open, defaultSectionId, sections]);

  const handleCreate = async () => {
    if (!title.trim() || !sectionId) return;
    setSaving(true);
    setError(null);
    try {
      const created = (await documentsApi.createDocument({
        title: title.trim(),
        sectionId,
      })) as { id: string };
      onCreated?.(created.id);
      onOpenChange(false);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not create document.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create document</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Add a title and pick a section. The native editor opens immediately after creation.
          </p>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Onboarding checklist"
              autoFocus
            />
          </div>
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
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={saving || !title.trim() || !sectionId}
          >
            {saving ? 'Creating…' : 'Create draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
