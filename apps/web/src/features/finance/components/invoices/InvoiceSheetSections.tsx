import type { ReactNode } from 'react';
import { FileText, Building2, Clock, User, FolderKanban, Repeat } from 'lucide-react';
import { DetailSheetSection } from '@/components/shared';
import { StatusBadge } from '@/components/shared';
import { DETAIL_SHEET_PAIRED_COLUMNS_CLASS } from '@/components/shared/detail-sheet-classes';
import { getInvoiceMoneyStage, formatAmount } from '@/features/finance/constants/finance';
import type { Invoice } from '@/lib/api/finance';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
import { InvoiceOfficialRequestPanel } from './InvoiceOfficialRequestPanel';
import { invoiceStageGateSectionClass } from '@/features/finance/constants/invoice-stage-gate-highlight';
import { INVOICE_GATE_FIELD_PAYMENTS } from '@/features/finance/constants/invoice-money-status-gate-client';
import { RecordPaymentForm } from './RecordPaymentForm';

export type InvoiceSheetInvoice = Invoice;

export function InvoiceSheetBadge({ invoice }: { invoice: InvoiceSheetInvoice }) {
  const money = getInvoiceMoneyStage(invoice.moneyStatus);
  return (
    <div className="flex flex-wrap gap-1.5">
      {money && <StatusBadge label={money.label} variant={money.variant} />}
      <StatusBadge
        label={invoice.taxStatus === 'TAX' ? 'Tax' : 'Tax-Free'}
        variant={invoice.taxStatus === 'TAX' ? 'green' : 'gray'}
      />
    </div>
  );
}

/** Compact money summary — amount lives in the sheet header; this row shows coverage hints only. */
export function InvoiceMoneySummaryRow({
  invoice,
  gateRequiredFields = new Set<string>(),
}: {
  invoice: InvoiceSheetInvoice;
  gateRequiredFields?: ReadonlySet<string>;
}) {
  const coverage = invoice.paymentCoverage;
  const outstanding = coverage?.outstandingAmount ?? parseFloat(invoice.amount);
  const isOverdue = isInvoiceOverdue(invoice);

  return (
    <div
      className={invoiceStageGateSectionClass(
        gateRequiredFields,
        INVOICE_GATE_FIELD_PAYMENTS,
        'grid gap-4 sm:grid-cols-3',
      )}
    >
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">Outstanding</p>
        <p
          className={`mt-1 text-sm font-semibold tabular-nums ${outstanding > 0 && isOverdue ? 'text-red-600' : ''}`}
        >
          {formatAmount(outstanding, invoice.currency)}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">Paid</p>
        <p className="mt-1 text-sm font-semibold tabular-nums">
          {formatAmount(coverage?.paidAmount ?? 0, invoice.currency)}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">Due</p>
        <p
          className={`mt-1 text-sm font-medium ${isOverdue && invoice.dueDate ? 'text-red-600' : ''}`}
        >
          {invoice.dueDate
            ? new Date(invoice.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : '—'}
        </p>
      </div>
    </div>
  );
}

export function InvoiceDetailsSection({
  invoice,
  onInvoiceUpdated,
}: {
  invoice: InvoiceSheetInvoice;
  onInvoiceUpdated?: (invoice: InvoiceSheetInvoice) => void;
}) {
  return (
    <DetailSheetSection title="Official & dates">
      <div className={DETAIL_SHEET_PAIRED_COLUMNS_CLASS}>
        <div className="space-y-3 text-sm">
          <FieldRow
            label="Official"
            value={
              onInvoiceUpdated ? (
                <InvoiceOfficialRequestPanel invoice={invoice} onUpdated={onInvoiceUpdated} />
              ) : (
                <OfficialInvoiceSummary invoice={invoice} />
              )
            }
          />
          <InvoicePaidDateRow paidDate={invoice.paidDate} />
        </div>
        <div className="space-y-3 text-sm">
          <DateRow label="Created" date={invoice.createdAt} />
        </div>
      </div>
    </DetailSheetSection>
  );
}

export function InvoiceLinkedEntitiesSection({ invoice }: { invoice: InvoiceSheetInvoice }) {
  const links = [
    invoice.company ? { icon: Building2, label: 'Company', value: invoice.company.name } : null,
    invoice.project ? { icon: FolderKanban, label: 'Project', value: invoice.project.name } : null,
    invoice.contact
      ? {
          icon: User,
          label: 'Contact',
          value: `${invoice.contact.firstName} ${invoice.contact.lastName}`,
        }
      : null,
    invoice.order ? { icon: FileText, label: 'Order', value: invoice.order.code } : null,
    invoice.subscriptionId
      ? { icon: Repeat, label: 'Subscription', value: invoice.subscriptionId }
      : null,
  ].filter((row): row is { icon: typeof FileText; label: string; value: string } => row != null);

  if (links.length === 0) return null;

  return (
    <DetailSheetSection title="Linked">
      <div className="space-y-2">
        {links.map((row) => (
          <LinkedEntity key={`${row.label}-${row.value}`} {...row} />
        ))}
      </div>
    </DetailSheetSection>
  );
}

export function InvoiceDescriptionSection({ description }: { description: string | null }) {
  if (!description) return null;
  return <p className="text-foreground text-sm leading-relaxed">{description}</p>;
}

export function InvoicePaymentsSection({
  invoice,
  onPaymentRecorded,
  gateRequiredFields = new Set<string>(),
}: {
  invoice: InvoiceSheetInvoice;
  onPaymentRecorded: (data: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMethod?: string;
    notes?: string;
  }) => Promise<void>;
  gateRequiredFields?: ReadonlySet<string>;
}) {
  return (
    <DetailSheetSection
      title="Payments"
      className={invoiceStageGateSectionClass(gateRequiredFields, INVOICE_GATE_FIELD_PAYMENTS)}
    >
      {invoice.paymentCoverage?.isFullyPaid ? (
        <p className="text-sm font-medium text-green-600">Fully paid</p>
      ) : null}
      {invoice.payments.length > 0 ? (
        <div className="space-y-4">
          {invoice.payments.map((payment) => (
            <FinanceProofAttachments
              key={payment.id}
              entityType="PAYMENT"
              entityId={payment.id}
              purpose="PAYMENT_PROOF"
              title={`Payment proof · ${new Date(payment.paymentDate).toLocaleDateString()}`}
            />
          ))}
        </div>
      ) : null}
      <RecordPaymentForm invoice={invoice} onRecordPayment={onPaymentRecorded} />
    </DetailSheetSection>
  );
}

function FieldRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-foreground min-w-0 font-medium">{value}</span>
    </div>
  );
}

function OfficialInvoiceSummary({ invoice }: { invoice: InvoiceSheetInvoice }) {
  if (invoice.taxStatus !== 'TAX') {
    return <div className="text-muted-foreground text-sm">Not required (tax-free)</div>;
  }
  const status = invoice.officialInvoiceRequestSent
    ? 'Request sent'
    : invoice.officialInvoiceCancelledAt
      ? 'Request cancelled'
      : 'Not sent';
  return (
    <div className="space-y-0.5">
      <div className="font-medium">{status}</div>
      {invoice.govInvoiceId ? (
        <div className="text-muted-foreground text-xs">Gov ID: {invoice.govInvoiceId}</div>
      ) : null}
    </div>
  );
}

function InvoicePaidDateRow({ paidDate }: { paidDate: string | null }) {
  if (!paidDate) return null;
  return <DateRow label="Paid Date" date={paidDate} className="text-green-600" />;
}

function DateRow({
  label,
  date,
  className = '',
}: {
  label: string;
  date: string;
  className?: string;
}) {
  return (
    <FieldRow
      label={label}
      value={
        <span className={`inline-flex items-center gap-1.5 ${className}`}>
          <Clock size={13} className="text-muted-foreground" aria-hidden />
          {new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      }
    />
  );
}

function LinkedEntity({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon size={14} className="text-muted-foreground shrink-0" aria-hidden />
      <span className="text-foreground min-w-0 flex-1 truncate font-medium">{value}</span>
      <span className="text-muted-foreground shrink-0 text-xs">{label}</span>
    </div>
  );
}

function isInvoiceOverdue(invoice: InvoiceSheetInvoice) {
  return (
    invoice.moneyStatus === 'OVERDUE' ||
    Boolean(
      invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.moneyStatus !== 'PAID',
    )
  );
}
