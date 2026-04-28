import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatAmount } from '@/features/finance/constants/finance';
import { ApiError } from '@/lib/api-errors';
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

  if (outstanding <= 0 || invoice.status === 'PAID') return null;

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
      setError(caught instanceof ApiError ? caught.message : 'Payment could not be recorded.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between">
        <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Record Payment
        </h4>
        <span className="text-muted-foreground text-xs">
          Outstanding {formatAmount(outstanding, invoice.currency)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <PaymentInput label="Amount" value={amount} onChange={setAmount} type="number" />
        <PaymentInput
          label="Payment Date"
          value={paymentDate}
          onChange={setPaymentDate}
          type="date"
        />
      </div>
      <PaymentInput label="Method" value={paymentMethod} onChange={setPaymentMethod} />
      <div className="space-y-1">
        <Label htmlFor="payment-notes">Notes</Label>
        <Textarea
          id="payment-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <Button type="submit" size="sm" disabled={submitting || Number(amount) <= 0}>
        {submitting ? 'Recording...' : 'Record Payment'}
      </Button>
    </form>
  );
}

function PaymentInput({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const id = `payment-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
