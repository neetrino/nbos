import { FileText, Building2, User, FolderKanban, Repeat, Handshake } from 'lucide-react';
import { DetailSheetSection, InlineField, StatusBadge } from '@/components/shared';
import { getInvoiceMoneyStage } from '@/features/finance/constants/finance';
import type { Invoice } from '@/lib/api/finance';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
import { InvoiceOfficialRequestPanel } from './InvoiceOfficialRequestPanel';
import { getInvoiceDealTitle, getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import { RecordPaymentForm } from './RecordPaymentForm';

export type InvoiceSheetInvoice = Invoice;

export function InvoiceSheetBadge({ invoice }: { invoice: InvoiceSheetInvoice }) {
  const money = getInvoiceMoneyStage(invoice.moneyStatus);
  if (!money) return null;
  return <StatusBadge label={money.label} variant={money.variant} />;
}

export function InvoiceOfficialSection({
  invoice,
  onInvoiceUpdated,
}: {
  invoice: InvoiceSheetInvoice;
  onInvoiceUpdated?: (invoice: InvoiceSheetInvoice) => void;
}) {
  return (
    <DetailSheetSection title="Official invoice">
      {onInvoiceUpdated ? (
        <InvoiceOfficialRequestPanel invoice={invoice} onUpdated={onInvoiceUpdated} />
      ) : (
        <OfficialInvoiceReadOnly invoice={invoice} />
      )}
    </DetailSheetSection>
  );
}

export function InvoiceLinkedEntitiesSection({ invoice }: { invoice: InvoiceSheetInvoice }) {
  const dealTitle = getInvoiceDealTitle(invoice.order);
  const links = [
    dealTitle
      ? { icon: Handshake, label: 'Deal', value: dealTitle }
      : invoice.order
        ? { icon: FileText, label: 'Order', value: getOrderDisplayTitle(invoice.order) }
        : null,
    invoice.company ? { icon: Building2, label: 'Company', value: invoice.company.name } : null,
    invoice.project ? { icon: FolderKanban, label: 'Project', value: invoice.project.name } : null,
    invoice.contact
      ? {
          icon: User,
          label: 'Contact',
          value: `${invoice.contact.firstName} ${invoice.contact.lastName}`,
        }
      : null,
    invoice.subscriptionId
      ? { icon: Repeat, label: 'Subscription', value: invoice.subscriptionId }
      : null,
  ].filter((row): row is { icon: typeof FileText; label: string; value: string } => row != null);

  if (links.length === 0) return null;

  return (
    <DetailSheetSection title="Linked">
      <div className="space-y-3">
        {links.map((row) => (
          <LinkedEntity key={`${row.label}-${row.value}`} {...row} />
        ))}
      </div>
    </DetailSheetSection>
  );
}

export function InvoiceDescriptionSection({ description }: { description: string | null }) {
  if (!description) return null;
  return (
    <DetailSheetSection title="Description">
      <p className="text-foreground text-sm leading-relaxed">{description}</p>
    </DetailSheetSection>
  );
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
    <div className="space-y-4">
      {invoice.paymentCoverage?.isFullyPaid ? (
        <p className="text-sm font-medium text-green-600">Fully paid</p>
      ) : null}
      <RecordPaymentForm
        invoice={invoice}
        onRecordPayment={onPaymentRecorded}
        gateRequiredFields={gateRequiredFields}
      />
      {invoice.payments.length > 0 ? (
        <DetailSheetSection title="Payment proofs">
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
        </DetailSheetSection>
      ) : null}
    </div>
  );
}

function OfficialInvoiceReadOnly({ invoice }: { invoice: InvoiceSheetInvoice }) {
  if (invoice.taxStatus !== 'TAX') {
    return (
      <p className="text-muted-foreground text-sm">
        Tax-free invoice — accountant request is not required.
      </p>
    );
  }
  const status = invoice.officialInvoiceRequestSent
    ? 'Sent to accountant'
    : invoice.officialInvoiceCancelledAt
      ? 'Cancelled'
      : 'Not sent';
  const variant = invoice.officialInvoiceRequestSent
    ? 'green'
    : invoice.officialInvoiceCancelledAt
      ? 'amber'
      : 'gray';
  return (
    <div className="space-y-2">
      <StatusBadge label={status} variant={variant} />
      {invoice.govInvoiceId ? (
        <p className="text-muted-foreground font-mono text-xs">{invoice.govInvoiceId}</p>
      ) : null}
    </div>
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
    <InlineField
      variant="controlled"
      label={label}
      type="text"
      value={value}
      icon={<Icon size={12} />}
      disabled
      onValueChange={() => undefined}
    />
  );
}
