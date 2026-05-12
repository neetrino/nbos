'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Maximize2 } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/api-errors';
import { tasksApi, type Task } from '@/lib/api/tasks';
import { TASK_PRIORITIES } from '../constants/tasks';

interface QuickCreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  /**
   * When true and the user is loaded but `creatorId` is empty, creation is blocked (invalid employee FK).
   */
  creatorReady?: boolean;
  defaultLink?: { entityType: string; entityId: string };
  /** Prefill due date when opening from a column (e.g. Deadline view) */
  defaultDueDate?: string | null;
  defaultWorkspaceId?: string;
  defaultPlanningStatus?: string;
  onCreated?: (task: Task) => void;
  onOpenFull?: () => void;
}

export function QuickCreateTaskDialog({
  open,
  onOpenChange,
  creatorId,
  creatorReady = true,
  defaultLink,
  defaultDueDate,
  defaultWorkspaceId,
  defaultPlanningStatus,
  onCreated,
  onOpenFull,
}: QuickCreateTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setDueDate(defaultDueDate ?? '');
  }, [open, defaultDueDate]);

  const reset = () => {
    setTitle('');
    setDescription('');
    setAssigneeId('');
    setPriority('NORMAL');
    setDueDate('');
  };

  const handleCreate = async () => {
    if (!title.trim() || !creatorId) return;
    setSaving(true);
    try {
      const task = await tasksApi.create({
        title: title.trim(),
        creatorId,
        description: description.trim() || undefined,
        assigneeId: assigneeId || undefined,
        priority,
        dueDate: dueDate || undefined,
        workspaceId: defaultWorkspaceId,
        planningStatus: defaultPlanningStatus,
        links: defaultLink ? [defaultLink] : undefined,
      });
      onCreated?.(task);
      reset();
      onOpenChange(false);
    } catch (caught: unknown) {
      toast.error(getApiErrorMessage(caught, 'Could not create task. Try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Quick Create Task</DialogTitle>
            {onOpenFull && (
              <Button variant="ghost" size="sm" onClick={onOpenFull} className="gap-1 text-xs">
                <Maximize2 size={14} /> Full Form
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {creatorReady && !creatorId && (
            <p className="text-destructive text-sm">
              Your account is not linked to an employee record, so tasks cannot be created. Try
              signing in again or contact an administrator.
            </p>
          )}
          <div>
            <Label htmlFor="task-title">Title *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>

          <div>
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v ?? 'NORMAL')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="task-due">Due Date</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={saving || !title.trim() || (creatorReady && !creatorId)}
          >
            {saving ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
