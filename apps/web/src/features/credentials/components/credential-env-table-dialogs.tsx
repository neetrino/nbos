'use client';

import { DeleteConfirmDialog, type DeleteConfirmDialogProps } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface EnvTablePasteChoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (next: boolean) => void;
  existingCount: number;
  incomingCount: number;
  onMerge: () => void;
  onReplace: () => void;
}

export function EnvTablePasteChoiceDialog({
  isOpen,
  onOpenChange,
  existingCount,
  incomingCount,
  onMerge,
  onReplace,
}: EnvTablePasteChoiceDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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

export function EnvTableConfirmDialog({
  dialogProps,
}: {
  dialogProps: DeleteConfirmDialogProps | null;
}) {
  if (!dialogProps) return null;
  return <DeleteConfirmDialog {...dialogProps} />;
}
