'use client';

import { useEffect, useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
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
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description ?? '');
  const [scrumEnabled, setScrumEnabled] = useState(workspace.scrumEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(workspace.name);
    setDescription(workspace.description ?? '');
    setScrumEnabled(workspace.scrumEnabled);
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
        scrumEnabled,
      });
      onUpdated(updated);
      onOpenChange(false);
    } catch {
      setError('Work Space metadata could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Work Space</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-workspace-name">Name *</Label>
            <Input
              id="edit-workspace-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-workspace-description">Description</Label>
            <Textarea
              id="edit-workspace-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </div>
          <div className="border-border flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Scrum planning</p>
              <p className="text-muted-foreground text-xs">
                Show backlog and sprint planning areas.
              </p>
            </div>
            <Switch checked={scrumEnabled} onCheckedChange={setScrumEnabled} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={saving || !name.trim()}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
