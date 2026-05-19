'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SupportTicket } from '@/lib/api/support';

export interface SupportEscalateDialogProps {
  ticket: SupportTicket | null;
  reason: string;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
}

export function SupportEscalateDialog({
  ticket,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
  submitting,
}: SupportEscalateDialogProps) {
  return (
    <Dialog
      open={Boolean(ticket)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Managerial escalation</DialogTitle>
          <DialogDescription>
            Sends in-app notifications to the assignee and users with global Support ticket access.
            The ticket is marked Escalated and the SLA clock pauses until the overlay is cleared.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="support-escalate-reason">Reason</Label>
          <Textarea
            id="support-escalate-reason"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            rows={3}
            placeholder="Business risk, needs another specialist, client urgency…"
            className="resize-y"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={!ticket || submitting} onClick={() => void onConfirm()}>
            Confirm escalation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
