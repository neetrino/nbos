'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Calendar, CreditCard, FileText, Loader2, Save, Wallet } from 'lucide-react';
import {
  AmdCurrencyIcon,
  DETAIL_SHEET_SECTION_SURFACE_CLASS,
  DetailSheetFieldSegmented,
  InlineField,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_INVOICE_PAYMENT_METHOD,
  formatAmount,
  INVOICE_PAYMENT_METHOD_OPTIONS,
  type InvoicePaymentMethod,
} from '@/features/finance/constants/finance';
import { invoiceStageGateSectionClass } from '@/features/finance/constants/invoice-stage-gate-highlight';
import { INVOICE_GATE_FIELD_PAYMENTS } from '@/features/finance/constants/invoice-money-status-gate-client';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { Invoice } from '@/lib/api/finance';

const FIELD_ICON_CLASS = 'text-emerald-600 dark:text-emerald-400';

function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

interface RecordPaymentFormProps {
  invoice: Invoice;
  onRecordPayment: (data: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMethod?: string;
    notes?: string;
  }) => Promise<void>;
  gateRequiredFields?: ReadonlySet<string>;
}

export function RecordPaymentForm({
  invoice,
  onRecordPayment,
  gateRequiredFields = new Set(),
}: RecordPaymentFormProps) {
  const outstanding = invoice.paymentCoverage?.outstandingAmount ?? parseFloat(invoice.amount);
  const [amount, setAmount] = useState(String(outstanding || ''));
  const [paymentDate, setPaymentDate] = useState(todayDateInputValue);
  const [paymentMethod, setPaymentMethod] = useState<InvoicePaymentMethod>(
    DEFAULT_INVOICE_PAYMENT_METHOD,
  );
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextOutstanding =
      invoice.paymentCoverage?.outstandingAmount ?? parseFloat(invoice.amount);
    setAmount(String(nextOutstanding > 0 ? nextOutstanding : ''));
  }, [invoice.id, invoice.amount, invoice.paymentCoverage?.outstandingAmount]);

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
        paymentMethod,
        notes: notes || undefined,
      });
      setPaymentMethod(DEFAULT_INVOICE_PAYMENT_METHOD);
      setNotes('');
      setPaymentDate(todayDateInputValue());
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Payment could not be recorded.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className={invoiceStageGateSectionClass(
        gateRequiredFields,
        INVOICE_GATE_FIELD_PAYMENTS,
        DETAIL_SHEET_SECTION_SURFACE_CLASS,
      )}
    >
      <div className="mb-1 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
          <Wallet size={18} aria-hidden />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight">Record Payment</h3>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Outstanding{' '}
            <span className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
              {formatAmount(outstanding, invoice.currency)}
            </span>
          </p>
        </div>
      </div>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InlineField
            variant="controlled"
            label="Amount"
            type="money"
            value={amount}
            icon={<AmdCurrencyIcon className={FIELD_ICON_CLASS} />}
            onValueChange={setAmount}
          />
          <InlineField
            variant="controlled"
            label="Payment date"
            type="date"
            value={paymentDate}
            icon={<Calendar size={14} className={FIELD_ICON_CLASS} />}
            datePickerVariant="extended"
            onValueChange={setPaymentDate}
          />
        </div>
        <DetailSheetFieldSegmented
          label="Method"
          icon={<CreditCard size={14} className={FIELD_ICON_CLASS} />}
          value={paymentMethod}
          options={INVOICE_PAYMENT_METHOD_OPTIONS}
          onValueChange={setPaymentMethod}
        />
        <InlineField
          variant="controlled"
          label="Notes"
          type="textarea"
          value={notes}
          placeholder="Optional"
          icon={<FileText size={14} className={FIELD_ICON_CLASS} />}
          onValueChange={setNotes}
        />
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={submitting || Number(amount) <= 0}>
          {submitting ? (
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
          ) : (
            <Save className="mr-2 size-4" aria-hidden />
          )}
          Record payment
        </Button>
      </form>
    </section>
  );
}
