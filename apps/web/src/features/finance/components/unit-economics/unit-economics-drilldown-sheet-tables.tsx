'use client';

import Link from 'next/link';
import { formatAmount, parseMoneyAmount } from '@/features/finance/constants/finance';
import { OPEN_INVOICE_QUERY } from '@/features/finance/constants/invoice-deep-link';
import type { UnitEconomicsOrderDetail } from '@/lib/api/unit-economics';

function invoiceOpenHref(invoiceId: string): string {
  const q = new URLSearchParams({ [OPEN_INVOICE_QUERY]: invoiceId });
  return `/finance/invoices?${q.toString()}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

export function UnitEconomicsDrilldownInvoicesTable({
  detail,
}: {
  detail: UnitEconomicsOrderDetail;
}) {
  if (detail.invoices.length === 0) {
    return <p className="text-muted-foreground text-sm">No invoices linked to this unit.</p>;
  }
  return (
    <div className="border-border overflow-auto rounded-xl border">
      <table className="w-full min-w-[32rem] border-collapse text-xs">
        <thead className="bg-muted/40">
          <tr className="text-muted-foreground text-left">
            <th className="border-border border-b px-3 py-2 font-semibold">Invoice</th>
            <th className="border-border border-b px-2 py-2 text-right font-semibold">Amount</th>
            <th className="border-border border-b px-2 py-2 text-right font-semibold">Received</th>
            <th className="border-border border-b px-2 py-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {detail.invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-muted/30">
              <td className="border-border border-b px-3 py-2">
                <Link href={invoiceOpenHref(inv.id)} className="hover:text-primary font-medium">
                  {inv.code}
                </Link>
                <p className="text-muted-foreground text-[11px]">{inv.type}</p>
              </td>
              <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                {formatAmount(parseMoneyAmount(inv.amount))}
              </td>
              <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                {formatAmount(parseMoneyAmount(inv.receivedOnInvoice))}
              </td>
              <td className="border-border border-b px-2 py-2">
                <span className="text-foreground font-medium">{inv.moneyStatus}</span>
                <p className="text-muted-foreground text-[11px]">
                  Due {formatDate(inv.dueDate)} · Paid {formatDate(inv.paidDate)}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UnitEconomicsDrilldownPaymentsTable({
  detail,
}: {
  detail: UnitEconomicsOrderDetail;
}) {
  if (detail.payments.length === 0) {
    return <p className="text-muted-foreground text-sm">No payments recorded for this unit.</p>;
  }
  return (
    <div className="border-border overflow-auto rounded-xl border">
      <table className="w-full min-w-[32rem] border-collapse text-xs">
        <thead className="bg-muted/40">
          <tr className="text-muted-foreground text-left">
            <th className="border-border border-b px-3 py-2 font-semibold">Payment</th>
            <th className="border-border border-b px-2 py-2 font-semibold">Invoice</th>
            <th className="border-border border-b px-2 py-2 text-right font-semibold">Amount</th>
            <th className="border-border border-b px-2 py-2 font-semibold">Date</th>
          </tr>
        </thead>
        <tbody>
          {detail.payments.map((pay) => (
            <tr key={pay.id} className="hover:bg-muted/30">
              <td className="border-border border-b px-3 py-2 font-medium tabular-nums">
                {formatAmount(parseMoneyAmount(pay.amount))}
                {pay.paymentMethod ? (
                  <p className="text-muted-foreground text-[11px] font-normal">
                    {pay.paymentMethod}
                  </p>
                ) : null}
              </td>
              <td className="border-border border-b px-2 py-2">
                <Link
                  href={invoiceOpenHref(pay.invoiceId)}
                  className="hover:text-primary font-medium"
                >
                  {pay.invoiceCode}
                </Link>
              </td>
              <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                {formatAmount(parseMoneyAmount(pay.amount))}
              </td>
              <td className="border-border border-b px-2 py-2">
                {new Date(pay.paymentDate).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
