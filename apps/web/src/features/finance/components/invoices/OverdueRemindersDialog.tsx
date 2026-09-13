'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BellRing } from 'lucide-react';
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
import { INVOICE_REMINDER_SKIP_MESSAGE_KEYS } from './invoice-message-keys';
import { countSkippedByReason } from './overdue-reminder-skip-labels';

interface OverdueRemindersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OverdueRemindersDialog({ open, onOpenChange }: OverdueRemindersDialogProps) {
  const t = useTranslations('invoices');
  const tCommon = useTranslations('common');
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
          setError(getApiErrorMessage(caught, t('reminders.loadFailed')));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, t]);

  const sendableCount = (preview?.wave1Count ?? 0) + (preview?.wave2Count ?? 0);
  const skippedGroups = preview ? countSkippedByReason(preview.skipped) : [];

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await invoicesApi.runOverdueReminders();
      const wave1 = result.sent.filter((row) => row.wave === 1).length;
      const wave2 = result.sent.filter((row) => row.wave === 2).length;
      toast.success(t('reminders.sent', { count: result.sent.length, wave1, wave2 }));
      onOpenChange(false);
    } catch (caught) {
      setError(getApiErrorMessage(caught, t('reminders.sendFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!submitting}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="size-5 shrink-0 text-amber-500" aria-hidden />
            {t('reminders.title')}
          </DialogTitle>
          <DialogDescription>{t('reminders.description')}</DialogDescription>
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
            {tCommon('cancel')}
          </Button>
          <Button
            type="button"
            disabled={loading || submitting || sendableCount === 0}
            onClick={() => void handleConfirm()}
          >
            {submitting ? t('reminders.sending') : t('reminders.send')}
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
  const t = useTranslations('invoices');
  if (loading) {
    return <p className="text-muted-foreground text-sm">{t('reminders.loading')}</p>;
  }
  if (!preview && error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }
  if (!preview) return null;
  return (
    <div className="space-y-3 text-sm">
      {error ? <p className="text-destructive">{error}</p> : null}
      {sendableCount === 0 ? (
        <p className="text-muted-foreground">{t('reminders.empty')}</p>
      ) : (
        <ul className="text-foreground list-inside list-disc space-y-1">
          <li>{t('reminders.wave1', { count: preview.wave1Count })}</li>
          <li>{t('reminders.wave2', { count: preview.wave2Count })}</li>
        </ul>
      )}
      {skippedGroups.length > 0 ? (
        <div>
          <p className="text-muted-foreground mb-1">{t('reminders.skipped')}</p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1">
            {skippedGroups.map((row) => (
              <li key={row.reason}>
                {t(INVOICE_REMINDER_SKIP_MESSAGE_KEYS[row.reason])}: {row.count}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
