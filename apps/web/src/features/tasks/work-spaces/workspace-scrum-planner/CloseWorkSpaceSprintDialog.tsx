'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  workSpaceSprintsApi,
  type UnfinishedSprintTaskAction,
  type WorkSpaceSprint,
} from '@/lib/api/work-space-sprints';

const ACTIONS: { value: UnfinishedSprintTaskAction; label: string }[] = [
  { value: 'BACKLOG', label: 'Move unfinished to backlog' },
  { value: 'NEXT_SPRINT', label: 'Move unfinished to next planning sprint' },
  { value: 'KEEP', label: 'Keep on closed sprint' },
];

export function CloseWorkSpaceSprintDialog({
  open,
  onOpenChange,
  workspaceId,
  sprint,
  planningSprints,
  onClosed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  sprint: WorkSpaceSprint;
  planningSprints: WorkSpaceSprint[];
  onClosed: (sprint: WorkSpaceSprint) => void;
}) {
  const [action, setAction] = useState<UnfinishedSprintTaskAction>('BACKLOG');
  const [nextSprintId, setNextSprintId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleClose = async () => {
    setSaving(true);
    try {
      const closed = await workSpaceSprintsApi.close(workspaceId, sprint.id, {
        unfinishedTaskAction: action,
        nextSprintId: action === 'NEXT_SPRINT' ? nextSprintId || undefined : undefined,
      });
      onClosed(closed);
      onOpenChange(false);
      toast.success('Sprint closed.');
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not close sprint.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Finish {sprint.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label>Unfinished tasks</Label>
            <Select
              value={action}
              onValueChange={(v) => {
                if (v) setAction(v as UnfinishedSprintTaskAction);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {action === 'NEXT_SPRINT' && planningSprints.length > 0 ? (
            <div className="grid gap-2">
              <Label>Target sprint</Label>
              <Select value={nextSprintId} onValueChange={(v) => setNextSprintId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sprint" />
                </SelectTrigger>
                <SelectContent>
                  {planningSprints.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleClose()} disabled={saving}>
            {saving ? 'Closing…' : 'Finish sprint'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
