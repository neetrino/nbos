'use client';

import { PauseCircle } from 'lucide-react';
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

interface SubscriptionHoldDialogProps {
  subscription: Subscription | null;
  open: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

export function SubscriptionHoldDialog({
  subscription,
  open,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: SubscriptionHoldDialogProps) {
  const code = subscription?.code ?? '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PauseCircle size={18} className="text-muted-foreground" />
            Put subscription on hold?
          </DialogTitle>
          <DialogDescription>
            Billing pauses for <span className="text-foreground font-medium">{code}</span> until you
            resume. Existing invoices are unchanged.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Keep active
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting || !subscription}
            onClick={() => void onConfirm()}
          >
            {isSubmitting ? 'Pausing…' : 'Pause billing'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
