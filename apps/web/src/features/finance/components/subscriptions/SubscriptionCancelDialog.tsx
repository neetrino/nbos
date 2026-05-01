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
import type { Subscription } from '@/lib/api/finance';

interface SubscriptionCancelDialogProps {
  subscription: Subscription | null;
  open: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

export function SubscriptionCancelDialog({
  subscription,
  open,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: SubscriptionCancelDialogProps) {
  const code = subscription?.code ?? '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Cancel subscription?
          </DialogTitle>
          <DialogDescription>
            This stops future billing runs for{' '}
            <span className="text-foreground font-medium">{code}</span>. Existing invoices are
            unchanged.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Keep subscription
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting || !subscription}
            onClick={() => void onConfirm()}
          >
            {isSubmitting ? 'Cancelling…' : 'Cancel subscription'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
