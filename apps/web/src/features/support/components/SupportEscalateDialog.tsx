'use client';

import { useTranslations } from 'next-intl';
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
  const t = useTranslations('support');
  const tCommon = useTranslations('common');

  return (
    <Dialog
      open={Boolean(ticket)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md" forceNestedBackdrop>
        <DialogHeader>
          <DialogTitle>{t('escalate.title')}</DialogTitle>
          <DialogDescription>{t('escalate.description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="support-escalate-reason">{t('escalate.reason')}</Label>
          <Textarea
            id="support-escalate-reason"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            rows={3}
            placeholder={t('escalate.reasonPlaceholder')}
            className="resize-y"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            {tCommon('cancel')}
          </Button>
          <Button type="button" disabled={!ticket || submitting} onClick={() => void onConfirm()}>
            {t('escalate.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
