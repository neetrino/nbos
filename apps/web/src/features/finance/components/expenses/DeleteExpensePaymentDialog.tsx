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

interface DeleteExpensePaymentDialogProps {
  paymentSummary: string;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

export function DeleteExpensePaymentDialog({
  paymentSummary,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: DeleteExpensePaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Remove payment?
          </DialogTitle>
          <DialogDescription>
            This removes the recorded payment{' '}
            <span className="text-foreground font-medium">{paymentSummary}</span> from this expense.
            You can add it again later if needed.
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
            {isSubmitting ? 'Removing…' : 'Remove payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
