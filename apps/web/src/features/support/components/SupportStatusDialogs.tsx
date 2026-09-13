'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  translateSupportCloseReason,
  type SupportTranslator,
} from '@/features/support/support-message-keys';

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
  const t = useTranslations('support') as SupportTranslator;
  const tCommon = useTranslations('common');

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
        <DialogContent className="sm:max-w-md" forceNestedBackdrop>
          <DialogHeader>
            <DialogTitle>{t('resolve.title')}</DialogTitle>
            <DialogDescription>
              {t('resolve.description', { min: MIN_SUPPORT_RESOLUTION_SUMMARY_LENGTH })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="support-resolve-summary">{t('resolve.summary')}</Label>
            <Textarea
              id="support-resolve-summary"
              value={resolutionDraft}
              onChange={(event) => onResolutionDraftChange(event.target.value)}
              rows={4}
              className="resize-y"
              placeholder={t('resolve.placeholder')}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onDismiss}>
              {tCommon('cancel')}
            </Button>
            <Button
              type="button"
              disabled={statusSubmitting}
              onClick={() => void onSubmitResolve()}
            >
              {t('resolve.save')}
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
        <DialogContent className="sm:max-w-md" forceNestedBackdrop>
          <DialogHeader>
            <DialogTitle>{t('closeTicket.title')}</DialogTitle>
            <DialogDescription>{t('closeTicket.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="support-close-reason">{t('closeTicket.reason')}</Label>
            <Select
              value={closeReason}
              onValueChange={(v) => {
                if (v) onCloseReasonChange(v);
              }}
            >
              <SelectTrigger id="support-close-reason" className="w-full">
                <SelectValue placeholder={t('closeTicket.reason')} />
              </SelectTrigger>
              <SelectContent>
                {SUPPORT_TICKET_CLOSE_REASON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {translateSupportCloseReason(t, option.value, option.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onDismiss}>
              {tCommon('cancel')}
            </Button>
            <Button type="button" disabled={statusSubmitting} onClick={() => void onSubmitClose()}>
              {t('closeTicket.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
