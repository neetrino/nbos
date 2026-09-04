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
import type { ExpensePlan } from '@/lib/api/expense-plans';

interface ExpensePlanCancelDialogProps {
  plan: ExpensePlan | null;
  open: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  forceNestedBackdrop?: boolean;
}

export function ExpensePlanCancelDialog({
  plan,
  open,
  isSubmitting,
  onOpenChange,
  onConfirm,
  forceNestedBackdrop = false,
}: ExpensePlanCancelDialogProps) {
  const title = plan?.name ?? '';

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
            Stop this plan?
          </DialogTitle>
          <DialogDescription>
            Future cards and calendar forecast stop for{' '}
            <span className="text-foreground font-medium">{title}</span>. Existing expense cards
            stay as they are. You can resume the plan later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Keep plan
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting || !plan}
            onClick={() => void onConfirm()}
          >
            {isSubmitting ? 'Stopping…' : 'Stop plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
