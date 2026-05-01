'use client';

import { useState } from 'react';
import { AlertTriangle, PauseCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const TOMORROW_OFFSET_DAYS = 1;
const DATE_INPUT_LENGTH = 10;

export type DeliveryLifecycleAction = 'pause' | 'cancel';

export interface DeliveryLifecycleActionPayload {
  reason: string;
  onHoldUntil?: string;
}

interface DeliveryLifecycleActionDialogProps {
  action: DeliveryLifecycleAction | null;
  entityLabel: string;
  isSubmitting: boolean;
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: DeliveryLifecycleActionPayload) => void | Promise<void>;
}

export function DeliveryLifecycleActionDialog({
  action,
  entityLabel,
  isSubmitting,
  error,
  onOpenChange,
  onConfirm,
}: DeliveryLifecycleActionDialogProps) {
  const [reason, setReason] = useState('');
  const [onHoldUntil, setOnHoldUntil] = useState(getTomorrowDateInput());
  const isPause = action === 'pause';
  const canSubmit = reason.trim().length > 0 && (!isPause || onHoldUntil.length > 0);

  return (
    <Dialog
      open={Boolean(action)}
      onOpenChange={(open) => {
        if (!open) resetForm(setReason, setOnHoldUntil);
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPause ? (
              <PauseCircle size={18} className="text-muted-foreground" />
            ) : (
              <AlertTriangle size={18} className="text-amber-500" />
            )}
            {isPause ? 'Pause delivery?' : 'Cancel delivery?'}
          </DialogTitle>
          <DialogDescription>
            {isPause
              ? `Pause ${entityLabel} and set the expected resume date.`
              : `Cancel ${entityLabel} with a required reason.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {isPause && (
            <label className="space-y-1.5 text-xs font-medium">
              Resume target date
              <Input
                type="date"
                value={onHoldUntil}
                disabled={isSubmitting}
                onChange={(event) => setOnHoldUntil(event.target.value)}
              />
            </label>
          )}
          <label className="space-y-1.5 text-xs font-medium">
            Reason
            <Textarea
              value={reason}
              disabled={isSubmitting}
              placeholder={isPause ? 'Waiting for client feedback...' : 'Client cancelled scope...'}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          {error && <p className="text-destructive text-xs">{error}</p>}
        </div>

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
            variant={isPause ? 'secondary' : 'destructive'}
            disabled={!canSubmit || isSubmitting}
            onClick={() => {
              void onConfirm({ reason: reason.trim(), onHoldUntil });
              resetForm(setReason, setOnHoldUntil);
            }}
          >
            {getSubmitLabel(action, isSubmitting)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function resetForm(setReason: (value: string) => void, setOnHoldUntil: (value: string) => void) {
  setReason('');
  setOnHoldUntil(getTomorrowDateInput());
}

function getSubmitLabel(action: DeliveryLifecycleAction | null, isSubmitting: boolean) {
  if (action === 'pause') return isSubmitting ? 'Pausing...' : 'Pause delivery';
  return isSubmitting ? 'Cancelling...' : 'Cancel delivery';
}

function getTomorrowDateInput() {
  const date = new Date();
  date.setDate(date.getDate() + TOMORROW_OFFSET_DAYS);
  return date.toISOString().slice(0, DATE_INPUT_LENGTH);
}
