'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  EntitySheetFloatingRail,
  DETAIL_SHEET_CONTENT_WIDTH_75VW_CLASS,
  DETAIL_SHEET_FLOATING_RAIL_ANCHOR_75VW_CLASS,
  DETAIL_SHEET_SECTION_SURFACE_CLASS,
} from '@/components/shared';
import { cn } from '@/lib/utils';
import { OPEN_INVOICE_QUERY } from '@/features/finance/constants/invoice-deep-link';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
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
  onInvoiceUpdated?: (invoice: InvoiceSheetInvoice) => void;
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
  onInvoiceUpdated,
  onPaymentRecorded,
}: InvoiceSheetProps) {
  if (!invoice) return null;

  const sourcePageHref = `/finance/invoices?${OPEN_INVOICE_QUERY}=${encodeURIComponent(invoice.id)}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        floatingClose
        floatingRailVisible={open}
        floatingRailAnchorClassName={DETAIL_SHEET_FLOATING_RAIL_ANCHOR_75VW_CLASS}
        floatingRail={<EntitySheetFloatingRail sourcePageHref={sourcePageHref} />}
        className={DETAIL_SHEET_CONTENT_WIDTH_75VW_CLASS}
      >
        <div className="bg-background border-border shrink-0 border-b px-7 pt-5 pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
                {invoice.code}
              </h2>
              <p className="text-muted-foreground mt-0.5 font-mono text-xs tracking-wider">
                Invoice · {invoice.type}
              </p>
            </div>
            <InvoiceSheetBadge invoice={invoice} />
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 px-7 py-5">
            <div className={cn(DETAIL_SHEET_SECTION_SURFACE_CLASS)}>
              <InvoiceAmountPanel invoice={invoice} />
            </div>

            <div className={cn(DETAIL_SHEET_SECTION_SURFACE_CLASS)}>
              <InvoiceDetailsSection invoice={invoice} onInvoiceUpdated={onInvoiceUpdated} />
            </div>

            <div className={cn(DETAIL_SHEET_SECTION_SURFACE_CLASS)}>
              <InvoiceLinkedEntitiesSection invoice={invoice} />
            </div>

            <InvoiceDescriptionSection description={invoice.description} />

            <div className={cn(DETAIL_SHEET_SECTION_SURFACE_CLASS)}>
              <FinanceProofAttachments
                entityType="INVOICE"
                entityId={invoice.id}
                purpose="INVOICE_REQUEST_PROOF"
                title="Invoice proofs"
              />
            </div>

            <Separator />

            <div className={cn(DETAIL_SHEET_SECTION_SURFACE_CLASS)}>
              <InvoicePaymentsSection invoice={invoice} onPaymentRecorded={onPaymentRecorded} />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
