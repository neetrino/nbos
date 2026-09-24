'use client';

import { useState } from 'react';
import { Building2, CreditCard, FileText, FolderKanban } from 'lucide-react';
import { useLocale } from 'next-intl';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DETAIL_SHEET_TAB_BODY_STRETCH_CLASS,
  DetailSheetCollapsibleSection,
  DetailSheetEntityLinkGrid,
  DetailSheetSection,
  InlineField,
  useEntityItemHost,
} from '@/components/shared';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import { formatInvoiceSheetDate } from '@/features/finance/components/invoices/format-invoice-sheet-date';
import { InvoiceLinkedReadonlyField } from '@/features/finance/components/invoices/InvoiceLinkedReadonlyField';
import { formatAmount } from '@/features/finance/constants/finance';
import { paymentMethodLabel } from '@/features/finance/utils/payment-method-label';
import type { Payment } from '@/lib/api/finance';

interface PaymentGeneralTabProps {
  payment: Payment;
}

export function PaymentGeneralTab({ payment }: PaymentGeneralTabProps) {
  const locale = useLocale();
  const [paymentOpen, setPaymentOpen] = useState(true);
  const method = paymentMethodLabel(payment.paymentMethod);
  const confirmerName = payment.confirmer
    ? `${payment.confirmer.firstName} ${payment.confirmer.lastName}`.trim()
    : null;
  const notes = payment.notes?.trim() || null;

  return (
    <div className={`${DETAIL_SHEET_TAB_BODY_STRETCH_CLASS} w-full max-w-none gap-4`}>
      <DetailSheetCollapsibleSection
        title="Payment"
        icon={<CreditCard size={12} />}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
      >
        <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
          <InlineField label="Amount" value={formatAmount(Number(payment.amount))} />
          <div className="grid grid-cols-2 gap-4">
            <InlineField
              label="Payment date"
              value={formatInvoiceSheetDate(payment.paymentDate, locale)}
            />
            <InlineField label="Method" value={method ?? '—'} />
          </div>
          {confirmerName ? <InlineField label="Confirmed by" value={confirmerName} /> : null}
          {notes ? <InlineField label="Notes" value={notes} /> : null}
        </div>
      </DetailSheetCollapsibleSection>

      <PaymentLinkedPanel payment={payment} />
      <p className="text-muted-foreground text-sm">
        Recorded {formatInvoiceSheetDate(payment.createdAt, locale)}
      </p>
    </div>
  );
}

function PaymentLinkedPanel({ payment }: { payment: Payment }) {
  const relations = useEntityRelations();
  const { openEntityItem } = useEntityItemHost();
  const invoice = payment.invoice;
  const project = payment.project;
  const company = payment.company;

  if (!invoice && !project && !company) return null;

  return (
    <DetailSheetSection title="Linked" outlined>
      <DetailSheetEntityLinkGrid className="sm:grid-cols-2">
        {invoice ? (
          <InvoiceLinkedReadonlyField
            label="Invoice"
            entityKind="order"
            value={invoice.id}
            selectionLabel={invoice.code}
            icon={<FileText size={12} />}
            onOpen={() => openEntityItem({ id: invoice.id, kind: 'invoice' })}
          />
        ) : null}
        {project ? (
          <InvoiceLinkedReadonlyField
            label="Project"
            entityKind="project"
            value={project.id}
            selectionLabel={project.name}
            icon={<FolderKanban size={12} />}
            onOpen={() => relations.openEntity('project', project.id)}
          />
        ) : null}
        {company ? (
          <InvoiceLinkedReadonlyField
            label="Company"
            entityKind="company"
            value={company.id}
            selectionLabel={company.name}
            icon={<Building2 size={12} />}
            onOpen={() => relations.openEntity('company', company.id)}
          />
        ) : null}
      </DetailSheetEntityLinkGrid>
    </DetailSheetSection>
  );
}
