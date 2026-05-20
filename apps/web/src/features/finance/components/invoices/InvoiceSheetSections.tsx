import { FileText, Building2, Clock, User, FolderKanban, Shield, Repeat } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/shared';
import { getInvoiceMoneyStage, formatAmount } from '@/features/finance/constants/finance';
import type { Invoice } from '@/lib/api/finance';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
import { InvoiceOfficialRequestPanel } from './InvoiceOfficialRequestPanel';
import { InvoicePaymentCoverageCard } from './InvoicePaymentCoverageCard';
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

export function InvoiceAmountPanel({ invoice }: { invoice: InvoiceSheetInvoice }) {
  const isOverdue = isInvoiceOverdue(invoice);
  return (
    <section className="bg-secondary/50 rounded-xl p-4">
      <div className="text-center">
        <p className="text-muted-foreground text-xs font-medium">Amount</p>
        <p className="text-foreground mt-1 text-3xl font-bold">
          {formatAmount(parseFloat(invoice.amount), invoice.currency)}
        </p>
        {isOverdue && <p className="mt-1 text-xs font-medium text-red-500">Overdue</p>}
      </div>
    </section>
  );
}

export function InvoiceDetailsSection({
  invoice,
  onInvoiceUpdated,
}: {
  invoice: InvoiceSheetInvoice;
  onInvoiceUpdated?: (invoice: InvoiceSheetInvoice) => void;
}) {
  const money = getInvoiceMoneyStage(invoice.moneyStatus);
  return (
    <section className="space-y-3">
      <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        Invoice Details
      </h4>
      <div className="grid grid-cols-2 gap-y-3 text-sm">
        <div className="text-muted-foreground">Type</div>
        <div className="font-medium">{invoice.type}</div>
        <div className="text-muted-foreground">Status</div>
        <div>{money && <StatusBadge label={money.label} variant={money.variant} />}</div>
        <InvoiceTaxStatusRow taxStatus={invoice.taxStatus} />
        <div className="text-muted-foreground">Official invoice</div>
        {onInvoiceUpdated ? (
          <InvoiceOfficialRequestPanel invoice={invoice} onUpdated={onInvoiceUpdated} />
        ) : (
          <OfficialInvoiceSummary invoice={invoice} />
        )}
        <InvoiceDueDateRow invoice={invoice} />
        <InvoicePaidDateRow paidDate={invoice.paidDate} />
        <DateRow label="Created" date={invoice.createdAt} />
      </div>
    </section>
  );
}

export function InvoiceLinkedEntitiesSection({ invoice }: { invoice: InvoiceSheetInvoice }) {
  return (
    <section className="space-y-3">
      <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        Linked Entities
      </h4>
      <div className="space-y-2">
        {invoice.company && (
          <LinkedEntity icon={Building2} label="Company" value={invoice.company.name} />
        )}
        {invoice.project && (
          <LinkedEntity icon={FolderKanban} label="Project" value={invoice.project.name} />
        )}
        {invoice.contact && (
          <LinkedEntity
            icon={User}
            label="Contact"
            value={`${invoice.contact.firstName} ${invoice.contact.lastName}`}
          />
        )}
        {invoice.order && <LinkedEntity icon={FileText} label="Order" value={invoice.order.code} />}
        {invoice.subscriptionId && (
          <LinkedEntity icon={Repeat} label="Subscription" value={invoice.subscriptionId} />
        )}
      </div>
    </section>
  );
}

export function InvoiceDescriptionSection({ description }: { description: string | null }) {
  if (!description) return null;
  return (
    <>
      <Separator />
      <section className="space-y-2">
        <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Description
        </h4>
        <p className="text-foreground text-sm">{description}</p>
      </section>
    </>
  );
}

export function InvoicePaymentsSection({
  invoice,
  onPaymentRecorded,
}: {
  invoice: InvoiceSheetInvoice;
  onPaymentRecorded: (data: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMethod?: string;
    notes?: string;
  }) => Promise<void>;
}) {
  return (
    <section className="space-y-4">
      <InvoicePaymentCoverageCard invoice={invoice} />
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
    </section>
  );
}

function InvoiceTaxStatusRow({ taxStatus }: { taxStatus: string }) {
  return (
    <>
      <div className="text-muted-foreground">Tax Status</div>
      <div className="flex items-center gap-1.5">
        <Shield size={13} className="text-muted-foreground" />
        {taxStatus === 'TAX' ? 'Tax Payer' : 'Tax-Free'}
      </div>
    </>
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

function InvoiceDueDateRow({ invoice }: { invoice: InvoiceSheetInvoice }) {
  if (!invoice.dueDate) return null;
  return (
    <DateRow
      label="Due Date"
      date={invoice.dueDate}
      className={isInvoiceOverdue(invoice) ? 'text-red-500' : ''}
    />
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
    <>
      <div className="text-muted-foreground">{label}</div>
      <div className={`flex items-center gap-1.5 font-medium ${className}`}>
        <Clock size={13} />
        {new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </div>
    </>
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
    <div className="border-border flex items-center gap-2 rounded-lg border p-3 text-sm">
      <Icon size={14} className="text-muted-foreground" />
      <span className="font-medium">{value}</span>
      <span className="text-muted-foreground text-xs">{label}</span>
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
