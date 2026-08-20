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
import type { PlatformSchedulerJobRow } from '@/lib/api/scheduler-jobs';

export type SchedulerConfirmAction = 'enable' | 'disable' | 'run';

export function SchedulerHighRiskConfirmDialog(props: {
  open: boolean;
  row: PlatformSchedulerJobRow | null;
  action: SchedulerConfirmAction | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}) {
  const { open, row, action, isSubmitting, onOpenChange, onConfirm } = props;
  if (!row || !action) return null;

  const { title, description, confirmLabel, confirmVariant } = resolveCopy(row, action);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-[18px] shrink-0 text-amber-500" aria-hidden />
            {title}
          </DialogTitle>
          <DialogDescription>
            High-risk job <span className="text-foreground font-medium">{row.title}</span> (
            {row.jobName}). {description}
          </DialogDescription>
        </DialogHeader>
        <p className="text-muted-foreground text-xs">{row.description}</p>
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
            variant={confirmVariant}
            disabled={isSubmitting}
            onClick={() => void onConfirm()}
          >
            {isSubmitting ? 'Working…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function resolveCopy(
  row: PlatformSchedulerJobRow,
  action: SchedulerConfirmAction,
): {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant: 'default' | 'destructive';
} {
  if (action === 'enable') {
    return {
      title: 'Enable high-risk job?',
      description: 'This job will start running on its schedule. The change is audited.',
      confirmLabel: 'Enable',
      confirmVariant: 'default',
    };
  }
  if (action === 'disable') {
    return {
      title: 'Disable high-risk job?',
      description: 'Scheduled ticks will stop until you enable it again. The change is audited.',
      confirmLabel: 'Disable',
      confirmVariant: 'destructive',
    };
  }
  return {
    title: 'Run high-risk job now?',
    description: `Start “${row.title}” immediately with a lease. This is audited.`,
    confirmLabel: 'Run now',
    confirmVariant: 'destructive',
  };
}
