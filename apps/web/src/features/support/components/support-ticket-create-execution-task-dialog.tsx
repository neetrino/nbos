'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NbosDatePicker } from '@/components/shared/date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface SupportTicketCreateExecutionTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meId: string | null;
  busy: boolean;
  title: string;
  description: string;
  dueDate: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onDueDateChange: (v: string) => void;
  onSubmit: () => void;
}

export function SupportTicketCreateExecutionTaskDialog({
  open,
  onOpenChange,
  meId,
  busy,
  title,
  description,
  dueDate,
  onTitleChange,
  onDescriptionChange,
  onDueDateChange,
  onSubmit,
}: SupportTicketCreateExecutionTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Linked execution task</DialogTitle>
          <DialogDescription>
            Creates a task in the product workspace (when set) with links back to this ticket.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="st-task-title">Title (optional)</Label>
            <Input
              id="st-task-title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Defaults to ticket title"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="st-task-desc">Description (optional)</Label>
            <Textarea
              id="st-task-desc"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
              className="resize-y"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="st-task-due">Due date (optional)</Label>
            <NbosDatePicker
              id="st-task-due"
              mode="datetime"
              variant="extended"
              value={dueDate}
              onChange={onDueDateChange}
              clearable
              aria-label="Due date"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={busy || !meId} onClick={onSubmit}>
            Create task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
