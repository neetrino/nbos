'use client';

import {
  FileText,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  User,
  FolderKanban,
  Shield,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { EntitySheet, StatusBadge } from '@/components/shared';
import { getInvoiceStage, formatAmount } from '../constants/finance';

interface Invoice {
  id: string;
  code: string;
  amount: string;
  currency: string;
  status: string;
  type: string;
  taxStatus: string;
  dueDate: string | null;
  paidDate: string | null;
  createdAt: string;
  description: string | null;
  order: { id: string; code: string } | null;
  company: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string } | null;
  _count: { payments: number };
}

interface InvoiceSheetProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceSheet({ invoice, open, onOpenChange }: InvoiceSheetProps) {
  if (!invoice) return null;

  const stage = getInvoiceStage(invoice.status);
  const amount = parseFloat(invoice.amount);
  const isOverdue =
    invoice.status === 'DELAYED' ||
    (invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID');

  return (
    <EntitySheet
      open={open}
      onOpenChange={onOpenChange}
      title={invoice.code}
      description={invoice.type}
      badge={
        <div className="flex gap-1.5">
          {stage && <StatusBadge label={stage.label} variant={stage.variant} />}
          <StatusBadge
            label={invoice.taxStatus === 'TAX' ? 'Tax' : 'Tax-Free'}
            variant={invoice.taxStatus === 'TAX' ? 'green' : 'gray'}
          />
        </div>
      }
    >
      <div className="space-y-6">
        <section className="bg-secondary/50 rounded-xl p-4">
          <div className="text-center">
            <p className="text-muted-foreground text-xs font-medium">Amount</p>
            <p className="text-foreground mt-1 text-3xl font-bold">
              {formatAmount(amount, invoice.currency)}
            </p>
            {isOverdue && <p className="mt-1 text-xs font-medium text-red-500">Overdue</p>}
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Invoice Details
          </h4>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="text-muted-foreground">Type</div>
            <div className="font-medium">{invoice.type}</div>

            <div className="text-muted-foreground">Status</div>
            <div>{stage && <StatusBadge label={stage.label} variant={stage.variant} />}</div>

            <div className="text-muted-foreground">Tax Status</div>
            <div className="flex items-center gap-1.5">
              <Shield size={13} className="text-muted-foreground" />
              {invoice.taxStatus === 'TAX' ? 'Tax Payer' : 'Tax-Free'}
            </div>

            {invoice.dueDate && (
              <>
                <div className="text-muted-foreground">Due Date</div>
                <div
                  className={`flex items-center gap-1.5 font-medium ${isOverdue ? 'text-red-500' : ''}`}
                >
                  <Calendar size={13} />
                  {new Date(invoice.dueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </>
            )}

            {invoice.paidDate && (
              <>
                <div className="text-muted-foreground">Paid Date</div>
                <div className="flex items-center gap-1.5 font-medium text-green-600">
                  <Clock size={13} />
                  {new Date(invoice.paidDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </>
            )}

            <div className="text-muted-foreground">Created</div>
            <div className="text-muted-foreground flex items-center gap-1.5">
              <Clock size={13} />
              {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        </section>

        <Separator />

        <section className="space-y-3">
          <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Linked Entities
          </h4>
          <div className="space-y-2">
            {invoice.company && (
              <div className="border-border flex items-center gap-2 rounded-lg border p-3 text-sm">
                <Building2 size={14} className="text-muted-foreground" />
                <span className="font-medium">{invoice.company.name}</span>
                <span className="text-muted-foreground text-xs">Company</span>
              </div>
            )}
            {invoice.project && (
              <div className="border-border flex items-center gap-2 rounded-lg border p-3 text-sm">
                <FolderKanban size={14} className="text-muted-foreground" />
                <span className="font-medium">{invoice.project.name}</span>
                <span className="text-muted-foreground text-xs">Project</span>
              </div>
            )}
            {invoice.contact && (
              <div className="border-border flex items-center gap-2 rounded-lg border p-3 text-sm">
                <User size={14} className="text-muted-foreground" />
                <span className="font-medium">
                  {invoice.contact.firstName} {invoice.contact.lastName}
                </span>
                <span className="text-muted-foreground text-xs">Contact</span>
              </div>
            )}
            {invoice.order && (
              <div className="border-border flex items-center gap-2 rounded-lg border p-3 text-sm">
                <FileText size={14} className="text-muted-foreground" />
                <span className="font-medium">{invoice.order.code}</span>
                <span className="text-muted-foreground text-xs">Order</span>
              </div>
            )}
          </div>
        </section>

        {invoice.description && (
          <>
            <Separator />
            <section className="space-y-2">
              <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Description
              </h4>
              <p className="text-foreground text-sm">{invoice.description}</p>
            </section>
          </>
        )}

        <Separator />

        <section className="space-y-2">
          <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Payments
          </h4>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <DollarSign size={16} className="text-muted-foreground mx-auto" />
            <p className="mt-1 text-lg font-bold">{invoice._count.payments}</p>
            <p className="text-muted-foreground text-[10px]">Payments received</p>
          </div>
        </section>
      </div>
    </EntitySheet>
  );
}
