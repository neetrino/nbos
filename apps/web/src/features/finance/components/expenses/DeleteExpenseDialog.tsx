'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteExpenseDialogProps {
  expenseName: string;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

export function DeleteExpenseDialog({
  expenseName,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: DeleteExpenseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Delete expense?
          </DialogTitle>
          <DialogDescription>
            This permanently removes{' '}
            <span className="text-foreground font-medium">{expenseName}</span> from Finance
            expenses. This cannot be undone.
          </DialogDescription>
          {errorMessage ? (
            <p className="text-destructive pt-2 text-sm" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting}
            onClick={() => void onConfirm()}
          >
            {isSubmitting ? 'Deleting…' : 'Delete expense'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
