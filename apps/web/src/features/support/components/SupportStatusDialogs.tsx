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
import {
  MIN_SUPPORT_RESOLUTION_SUMMARY_LENGTH,
  SUPPORT_TICKET_CLOSE_REASON_OPTIONS,
} from '@/features/support/constants/support';
import type { SupportStatusDialogState } from '@/features/support/types/support-status-dialog';

export interface SupportStatusDialogsProps {
  statusDialog: SupportStatusDialogState | null;
  resolutionDraft: string;
  closeReason: string;
  onResolutionDraftChange: (value: string) => void;
  onCloseReasonChange: (value: string) => void;
  onDismiss: () => void;
  onSubmitResolve: () => void;
  onSubmitClose: () => void;
  statusSubmitting: boolean;
}

export function SupportStatusDialogs({
  statusDialog,
  resolutionDraft,
  closeReason,
  onResolutionDraftChange,
  onCloseReasonChange,
  onDismiss,
  onSubmitResolve,
  onSubmitClose,
  statusSubmitting,
}: SupportStatusDialogsProps) {
  return (
    <>
      <Dialog
        open={Boolean(statusDialog?.mode === 'RESOLVED')}
        onOpenChange={(open) => {
          if (!open) {
            onDismiss();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark resolved</DialogTitle>
            <DialogDescription>
              Resolution summary is required ({MIN_SUPPORT_RESOLUTION_SUMMARY_LENGTH}+ characters).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="support-resolve-summary">Resolution summary</Label>
            <Textarea
              id="support-resolve-summary"
              value={resolutionDraft}
              onChange={(event) => onResolutionDraftChange(event.target.value)}
              rows={4}
              className="resize-y"
              placeholder="What was done, verification, client communication…"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onDismiss}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={statusSubmitting}
              onClick={() => void onSubmitResolve()}
            >
              Save resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(statusDialog?.mode === 'CLOSED')}
        onOpenChange={(open) => {
          if (!open) {
            onDismiss();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Close ticket</DialogTitle>
            <DialogDescription>
              Record why the case left the active queue (audit). Default is client confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="support-close-reason">Close reason</Label>
            <select
              id="support-close-reason"
              className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
              value={closeReason}
              onChange={(event) => onCloseReasonChange(event.target.value)}
            >
              {SUPPORT_TICKET_CLOSE_REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onDismiss}>
              Cancel
            </Button>
            <Button type="button" disabled={statusSubmitting} onClick={() => void onSubmitClose()}>
              Close ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
