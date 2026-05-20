'use client';

import { useMemo } from 'react';
import { FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  EntitySheetFloatingRail,
  DETAIL_SHEET_CONTENT_WIDTH_75VW_CLASS,
  DETAIL_SHEET_FLOATING_RAIL_ANCHOR_75VW_CLASS,
} from '@/components/shared';
import { OPEN_INVOICE_QUERY } from '@/features/finance/constants/invoice-deep-link';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
import { InvoiceMoneyStagesBar } from '@/features/finance/components/invoices/InvoiceMoneyStagesBar';
import { InvoiceSheetStageGateBlockers } from '@/features/finance/components/invoices/InvoiceSheetStageGateBlockers';
import {
  InvoiceDescriptionSection,
  InvoiceDetailsSection,
  InvoiceLinkedEntitiesSection,
  InvoiceMoneySummaryRow,
  InvoicePaymentsSection,
  InvoiceSheetBadge,
  type InvoiceSheetInvoice,
} from './invoices/InvoiceSheetSections';
import { formatAmount } from '@/features/finance/constants/finance';
import { buildInvoiceGateRequiredFields } from '@/features/finance/constants/invoice-stage-gate-highlight';
import type { InvoiceSheetStageGateHighlight } from '@/features/finance/constants/invoice-stage-gate-highlight';

interface InvoiceSheetProps {
  invoice: InvoiceSheetInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceUpdated?: (invoice: InvoiceSheetInvoice) => void;
  onMoneyStatusChange?: (invoiceId: string, moneyStatus: string) => void | Promise<void>;
  onPaymentRecorded: (data: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMethod?: string;
    notes?: string;
  }) => Promise<void>;
  stageGateHighlight?: InvoiceSheetStageGateHighlight | null;
}

export function InvoiceSheet({
  invoice,
  open,
  onOpenChange,
  onInvoiceUpdated,
  onMoneyStatusChange,
  onPaymentRecorded,
  stageGateHighlight = null,
}: InvoiceSheetProps) {
  if (!invoice) return null;

  const gateRequiredFields = useMemo(
    () => buildInvoiceGateRequiredFields(stageGateHighlight),
    [stageGateHighlight],
  );

  const sourcePageHref = `/finance/invoices?${OPEN_INVOICE_QUERY}=${encodeURIComponent(invoice.id)}`;
  const headerContext = [
    formatAmount(parseFloat(invoice.amount), invoice.currency),
    invoice.type,
    invoice.company?.name,
    invoice.project?.name,
  ]
    .filter(Boolean)
    .join(' · ');

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
            <div className="min-w-0 flex-1">
              <div className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
                <FileText className="text-muted-foreground size-5 shrink-0" aria-hidden />
                <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
                  {invoice.code}
                </h2>
              </div>
              <p className="text-muted-foreground mt-0.5 text-sm">{headerContext}</p>
            </div>
            <InvoiceSheetBadge invoice={invoice} />
          </div>
        </div>

        {onMoneyStatusChange ? (
          <div className="border-border shrink-0 border-b px-7 py-2.5">
            <InvoiceMoneyStagesBar
              currentStatus={invoice.moneyStatus}
              onStageClick={(status) => void onMoneyStatusChange(invoice.id, status)}
            />
          </div>
        ) : null}

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-5 px-7 py-5">
            <InvoiceSheetStageGateBlockers highlight={stageGateHighlight} />

            <InvoiceMoneySummaryRow invoice={invoice} gateRequiredFields={gateRequiredFields} />

            <InvoiceDetailsSection invoice={invoice} onInvoiceUpdated={onInvoiceUpdated} />

            <InvoiceLinkedEntitiesSection invoice={invoice} />

            <InvoiceDescriptionSection description={invoice.description} />

            <FinanceProofAttachments
              entityType="INVOICE"
              entityId={invoice.id}
              purpose="INVOICE_REQUEST_PROOF"
              title="Proofs"
            />

            <Separator />

            <InvoicePaymentsSection
              invoice={invoice}
              onPaymentRecorded={onPaymentRecorded}
              gateRequiredFields={gateRequiredFields}
            />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
