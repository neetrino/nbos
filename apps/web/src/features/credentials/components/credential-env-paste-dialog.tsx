'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface CredentialEnvPasteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomingCount: number;
  existingCount: number;
  onReplace: () => void;
  onMerge: () => void;
}

export function CredentialEnvPasteDialog({
  open,
  onOpenChange,
  incomingCount,
  existingCount,
  onReplace,
  onMerge,
}: CredentialEnvPasteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply pasted variables?</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          The table already has {existingCount} variable{existingCount === 1 ? '' : 's'}. Paste adds{' '}
          {incomingCount} parsed line{incomingCount === 1 ? '' : 's'}.
        </p>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={onMerge}>
            Merge
          </Button>
          <Button type="button" onClick={onReplace}>
            Replace all
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
