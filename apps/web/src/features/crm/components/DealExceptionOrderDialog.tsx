'use client';

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
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
      setError(getApiErrorMessage(caught, 'Could not create exception order.'));
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exception order</DialogTitle>
          <DialogDescription>
            Close the deal without a deposit invoice. FREE skips payment; POSTPAID expects payment
            later. Sales bonuses are not created automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exception-type">Type</Label>
            <Select
              value={exceptionType}
              onValueChange={(value) => setExceptionType(value as DealExceptionType)}
            >
              <SelectTrigger id="exception-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="POSTPAID">Postpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exception-reason">Reason</Label>
            <Textarea
              id="exception-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why is this an exception and what are the terms?"
              rows={4}
            />
          </div>

          {exceptionType === 'POSTPAID' ? (
            <div className="space-y-2">
              <Label htmlFor="payment-expected-at">Expected payment date (optional)</Label>
              <Input
                id="payment-expected-at"
                type="date"
                value={paymentExpectedAt}
                onChange={(event) => setPaymentExpectedAt(event.target.value)}
              />
            </div>
          ) : null}

          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || reason.trim().length < 10}>
            Create exception order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
