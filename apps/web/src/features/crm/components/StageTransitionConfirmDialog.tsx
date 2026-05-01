'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface StageTransitionConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  variant: 'success' | 'danger';
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function StageTransitionConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  variant,
  onOpenChange,
  onConfirm,
}: StageTransitionConfirmDialogProps) {
  const Icon = variant === 'success' ? CheckCircle2 : AlertTriangle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon
              size={18}
              className={cn(variant === 'success' ? 'text-emerald-500' : 'text-red-500')}
            />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
