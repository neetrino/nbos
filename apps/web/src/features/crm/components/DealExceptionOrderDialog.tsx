'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { NbosDatePicker } from '@/components/shared/date-picker';
import type { DealExceptionType } from '@/features/crm/constants/deal-commercial-ui.constants';
import { dealsApi } from '@/lib/api/deals';
import { getApiErrorMessage } from '@/lib/api-errors';

interface DealExceptionOrderDialogProps {
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DealExceptionOrderDialog({
  dealId,
  open,
  onOpenChange,
  onSuccess,
}: DealExceptionOrderDialogProps) {
  const t = useTranslations('crm');
  const tCommon = useTranslations('common');
  const [exceptionType, setExceptionType] = useState<DealExceptionType>('POSTPAID');
  const [reason, setReason] = useState('');
  const [paymentExpectedAt, setPaymentExpectedAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setExceptionType('POSTPAID');
    setReason('');
    setPaymentExpectedAt('');
    setError(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await dealsApi.createExceptionOrder(dealId, {
        exceptionType,
        reason: reason.trim(),
        ...(exceptionType === 'POSTPAID' && paymentExpectedAt ? { paymentExpectedAt } : {}),
      });
      onOpenChange(false);
      reset();
      onSuccess?.();
    } catch (caught) {
      setError(getApiErrorMessage(caught, t('dealSheet.exception.createError')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="sm:max-w-md" forceNestedBackdrop>
        <DialogHeader>
          <DialogTitle>{t('dealSheet.exception.title')}</DialogTitle>
          <DialogDescription>{t('dealSheet.exception.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exception-type">{t('dealSheet.exception.type')}</Label>
            <Select
              value={exceptionType}
              onValueChange={(value) => setExceptionType(value as DealExceptionType)}
            >
              <SelectTrigger id="exception-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FREE">{t('dealSheet.exception.free')}</SelectItem>
                <SelectItem value="POSTPAID">{t('dealSheet.exception.postpaid')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exception-reason">{t('dealSheet.exception.reason')}</Label>
            <Textarea
              id="exception-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t('dealSheet.exception.reasonPlaceholder')}
              rows={4}
            />
          </div>

          {exceptionType === 'POSTPAID' ? (
            <label className="block space-y-2 text-sm font-medium" htmlFor="payment-expected-at">
              {t('dealSheet.exception.expectedPaymentDate')}
              <NbosDatePicker
                id="payment-expected-at"
                value={paymentExpectedAt}
                onChange={setPaymentExpectedAt}
                disabled={submitting}
                variant="extended"
                clearable
                placeholder={t('dealSheet.exception.expectedPaymentPlaceholder')}
                aria-label={t('dealSheet.exception.expectedPaymentDate')}
              />
            </label>
          ) : null}

          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || reason.trim().length < 10}>
            {t('dealSheet.exception.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
