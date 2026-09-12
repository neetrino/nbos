'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { tasksApi, type WorkSpace } from '@/lib/api/tasks';

interface EditWorkSpaceDialogProps {
  workspace: WorkSpace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (workspace: WorkSpace) => void;
}

export function EditWorkSpaceDialog({
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

  useEffect(() => {
    if (!open) return;
    setName(workspace.name);
    setDescription(workspace.description ?? '');
    setError(null);
  }, [open, workspace]);

  const handleUpdate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await tasksApi.updateWorkSpace(workspace.id, {
        name: name.trim(),
        description: description.trim() || null,
      });
      onUpdated(updated);
      onOpenChange(false);
    } catch {
      setError(t('edit.failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('edit.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-workspace-name">{t('edit.name')}</Label>
            <Input
              id="edit-workspace-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-workspace-description">{t('edit.description')}</Label>
            <Textarea
              id="edit-workspace-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={handleUpdate} disabled={saving || !name.trim()}>
            {saving ? tCommon('saving') : t('edit.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
