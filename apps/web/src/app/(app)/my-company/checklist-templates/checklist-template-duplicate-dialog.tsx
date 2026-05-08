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

interface ChecklistTemplateDuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  busy: boolean;
  onConfirm: () => void;
}

export function ChecklistTemplateDuplicateDialog({
  open,
  onOpenChange,
  templateName,
  busy,
  onConfirm,
}: ChecklistTemplateDuplicateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Duplicate template</DialogTitle>
          <DialogDescription>
            Creates a new draft checklist from{' '}
            <span className="text-foreground">{templateName}</span> using the current draft items,
            or the active published snapshot if there is no draft payload.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={busy} onClick={onConfirm}>
            {busy ? 'Duplicating…' : 'Duplicate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
