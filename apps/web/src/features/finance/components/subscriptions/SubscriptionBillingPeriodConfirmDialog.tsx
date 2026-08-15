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

interface SubscriptionBillingPeriodConfirmDialogProps {
  open: boolean;
  subscriptionTitle: string;
  description: string;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  forceNestedBackdrop?: boolean;
}

export function SubscriptionBillingPeriodConfirmDialog({
  open,
  subscriptionTitle,
  description,
  isSubmitting,
  onOpenChange,
  onConfirm,
  forceNestedBackdrop = false,
}: SubscriptionBillingPeriodConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        forceNestedBackdrop={forceNestedBackdrop}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Confirm billing period change?
          </DialogTitle>
          <DialogDescription>
            For subscription{' '}
            <span className="text-foreground font-medium">{subscriptionTitle}</span>: {description}
          </DialogDescription>
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
          <Button type="button" disabled={isSubmitting} onClick={() => void onConfirm()}>
            {isSubmitting ? 'Saving…' : 'Confirm and save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
