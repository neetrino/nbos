'use client';

import { Separator } from '@/components/ui/separator';
import { EntitySheet } from '@/components/shared';
import {
  InvoiceAmountPanel,
  InvoiceDescriptionSection,
  InvoiceDetailsSection,
  InvoiceLinkedEntitiesSection,
  InvoicePaymentsSection,
  InvoiceSheetBadge,
  type InvoiceSheetInvoice,
} from './invoices/InvoiceSheetSections';

interface InvoiceSheetProps {
  invoice: InvoiceSheetInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentRecorded: (data: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMethod?: string;
    notes?: string;
  }) => Promise<void>;
}

export function InvoiceSheet({
  invoice,
  open,
  onOpenChange,
  onPaymentRecorded,
}: InvoiceSheetProps) {
  if (!invoice) return null;

  return (
    <EntitySheet
      open={open}
      onOpenChange={onOpenChange}
      title={invoice.code}
      description={invoice.type}
      badge={<InvoiceSheetBadge invoice={invoice} />}
    >
      <div className="space-y-6">
        <InvoiceAmountPanel invoice={invoice} />
        <InvoiceDetailsSection invoice={invoice} />
        <Separator />
        <InvoiceLinkedEntitiesSection invoice={invoice} />
        <InvoiceDescriptionSection description={invoice.description} />
        <Separator />
        <InvoicePaymentsSection invoice={invoice} onPaymentRecorded={onPaymentRecorded} />
      </div>
    </EntitySheet>
  );
}
