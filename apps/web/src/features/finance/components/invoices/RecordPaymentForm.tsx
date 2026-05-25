'use client';

import { useState, type FormEvent } from 'react';
import { Banknote, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlineField } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { Invoice } from '@/lib/api/finance';

interface RecordPaymentFormProps {
  invoice: Invoice;
  onRecordPayment: (data: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMethod?: string;
    notes?: string;
  }) => Promise<void>;
}

export function RecordPaymentForm({ invoice, onRecordPayment }: RecordPaymentFormProps) {
  const outstanding = invoice.paymentCoverage?.outstandingAmount ?? parseFloat(invoice.amount);
  const [amount, setAmount] = useState(String(outstanding || ''));
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (outstanding <= 0 || invoice.moneyStatus === 'PAID') return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onRecordPayment({
        invoiceId: invoice.id,
        amount: Number(amount),
        paymentDate,
        paymentMethod: paymentMethod || undefined,
        notes: notes || undefined,
      });
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Payment could not be recorded.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <p className="text-muted-foreground text-xs">
        Outstanding {formatAmount(outstanding, invoice.currency)}
      </p>
      <InlineField
        variant="controlled"
        label="Amount"
        type="number"
        value={amount}
        icon={<Banknote size={12} />}
        onValueChange={setAmount}
      />
      <InlineField
        variant="controlled"
        label="Payment date"
        type="date"
        value={paymentDate}
        icon={<Calendar size={12} />}
        onValueChange={setPaymentDate}
      />
      <InlineField
        variant="controlled"
        label="Method"
        type="text"
        value={paymentMethod}
        placeholder="Optional"
        onValueChange={setPaymentMethod}
      />
      <InlineField
        variant="controlled"
        label="Notes"
        type="textarea"
        value={notes}
        placeholder="Optional"
        onValueChange={setNotes}
      />
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
      <Button type="submit" size="sm" disabled={submitting || Number(amount) <= 0}>
        {submitting ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : null}
        Record payment
      </Button>
    </form>
  );
}
