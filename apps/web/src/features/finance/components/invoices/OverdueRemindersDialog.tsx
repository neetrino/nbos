'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getApiErrorMessage } from '@/lib/api-errors';
import { invoicesApi, type OverdueReminderPreview } from '@/lib/api/finance';
import { toast } from 'sonner';
import {
  countSkippedByReason,
  overdueReminderSkipLabel,
} from './overdue-reminder-skip-labels';

interface OverdueRemindersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OverdueRemindersDialog({ open, onOpenChange }: OverdueRemindersDialogProps) {
  const [preview, setPreview] = useState<OverdueReminderPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void invoicesApi
      .previewOverdueReminders()
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(getApiErrorMessage(caught, 'Could not load overdue reminder preview.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const sendableCount = (preview?.wave1Count ?? 0) + (preview?.wave2Count ?? 0);
  const skippedGroups = preview ? countSkippedByReason(preview.skipped) : [];

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await invoicesApi.runOverdueReminders();
      toast.success(
        `Sent ${result.sent.length} overdue reminder${result.sent.length === 1 ? '' : 's'} (${result.sent.filter((row) => row.wave === 1).length} wave 1, ${result.sent.filter((row) => row.wave === 2).length} wave 2).`,
      );
      onOpenChange(false);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Overdue reminders could not be sent.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!submitting}>
        <DialogHeader>
          <DialogTitle>Send overdue reminders?</DialogTitle>
          <DialogDescription>
            Mark paid invoices as Paid first. This run sends one WhatsApp letter per remaining
            Overdue card: wave 1 if none was sent, wave 2 if wave 1 was sent on a previous day.
          </DialogDescription>
        </DialogHeader>
        <OverdueRemindersPreviewBody
          loading={loading}
          error={error}
          preview={preview}
          sendableCount={sendableCount}
          skippedGroups={skippedGroups}
        />
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading || submitting || sendableCount === 0}
            onClick={() => void handleConfirm()}
          >
            {submitting ? 'Sending…' : 'Send reminders'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OverdueRemindersPreviewBody({
  loading,
  error,
  preview,
  sendableCount,
  skippedGroups,
}: {
  loading: boolean;
  error: string | null;
  preview: OverdueReminderPreview | null;
  sendableCount: number;
  skippedGroups: ReturnType<typeof countSkippedByReason>;
}) {
  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading preview…</p>;
  }
  if (!preview && error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }
  if (!preview) return null;
  return (
    <div className="space-y-3 text-sm">
      {error ? <p className="text-destructive">{error}</p> : null}
      {sendableCount === 0 ? (
        <p className="text-muted-foreground">No overdue client reminders to send right now.</p>
      ) : (
        <ul className="text-foreground list-inside list-disc space-y-1">
          <li>
            {preview.wave1Count} invoice{preview.wave1Count === 1 ? '' : 's'} → wave 1
          </li>
          <li>
            {preview.wave2Count} invoice{preview.wave2Count === 1 ? '' : 's'} → wave 2
          </li>
        </ul>
      )}
      {skippedGroups.length > 0 ? (
        <div>
          <p className="text-muted-foreground mb-1">Skipped</p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1">
            {skippedGroups.map((row) => (
              <li key={row.reason}>
                {overdueReminderSkipLabel(row.reason)}: {row.count}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
