'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2 } from 'lucide-react';
import { EntityDetailSheetContent } from '@/components/shared';
import { Sheet, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { buttonVariants } from '@/components/ui/button';
import { OPEN_INVOICE_QUERY } from '@/features/finance/constants/invoice-deep-link';
import { formatAmount } from '@/features/finance/constants/finance';
import { UnitEconomicsDrilldownBonusesTable } from '@/features/finance/components/unit-economics/unit-economics-drilldown-bonuses-table';
import { UnitEconomicsDrilldownExpensesTable } from '@/features/finance/components/unit-economics/unit-economics-drilldown-expenses-table';
import { bonusBoardHref } from '@/features/finance/constants/bonus-board-url';
import {
  unitEconomicsApi,
  type UnitEconomicsDrilldownFocus,
  type UnitEconomicsOrderDetail,
} from '@/lib/api/unit-economics';
import { getApiErrorMessage } from '@/lib/api-errors';
import { cn } from '@/lib/utils';

function invoiceOpenHref(invoiceId: string): string {
  const q = new URLSearchParams({ [OPEN_INVOICE_QUERY]: invoiceId });
  return `/finance/invoices?${q.toString()}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

function DrilldownTab({
  active,
  label,
  onSelect,
}: {
  active: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cn(
        'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/60',
      )}
      onClick={onSelect}
    >
      {label}
    </button>
  );
}

function SummaryMetrics({ detail }: { detail: UnitEconomicsOrderDetail }) {
  const { summary } = detail;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {[
        { label: 'Received', value: summary.receivedAmount },
        { label: 'To receive', value: summary.receivableAmount },
        { label: 'Spent', value: summary.outFactAmount },
        { label: 'Bonus to pay', value: summary.remainingBonuses },
        { label: 'Cash balance', value: summary.cashBalance },
        { label: 'Out committed', value: summary.outCommittedAmount },
        { label: 'Margin', value: summary.marginAfterCommitments },
        { label: 'Bonus plan', value: summary.plannedBonuses },
      ].map((cell) => (
        <div key={cell.label} className="border-border bg-card rounded-xl border px-3 py-2">
          <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
            {cell.label}
          </p>
          <p className="mt-1 text-base font-semibold tabular-nums">
            {formatAmount(Number.parseFloat(cell.value))}
          </p>
        </div>
      ))}
    </div>
  );
}

function InvoicesTable({ detail }: { detail: UnitEconomicsOrderDetail }) {
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
                {formatAmount(Number.parseFloat(inv.amount))}
              </td>
              <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                {formatAmount(Number.parseFloat(inv.receivedOnInvoice))}
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

function PaymentsTable({ detail }: { detail: UnitEconomicsOrderDetail }) {
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
                {formatAmount(Number.parseFloat(pay.amount))}
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
                {formatAmount(Number.parseFloat(pay.amount))}
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

export function UnitEconomicsDrilldownSheet({
  orderId,
  focus,
  open,
  onOpenChange,
}: {
  orderId: string | null;
  focus: UnitEconomicsDrilldownFocus;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const [tab, setTab] = useState<UnitEconomicsDrilldownFocus>(focus);
  const [detail, setDetail] = useState<UnitEconomicsOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setTab(focus);
  }, [open, focus]);

  useEffect(() => {
    if (!open || !orderId) {
      setDetail(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void unitEconomicsApi
      .orderDetail(orderId)
      .then((detail) => {
        if (!cancelled) setDetail(detail);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load unit detail.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, orderId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent open={open} layout="auxiliary" className="gap-0">
        <SheetHeader>
          <SheetTitle>{detail?.label ?? 'Delivery unit'}</SheetTitle>
          <SheetDescription>
            {detail
              ? `${detail.orderCode} · ${detail.projectCode} · ${detail.orderType}`
              : 'Invoices, payments, expenses, and bonuses for the selected delivery unit.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
          {loading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading…
            </div>
          ) : null}
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          {detail ? (
            <>
              <SummaryMetrics detail={detail} />
              <div className="flex flex-wrap gap-2" role="tablist">
                <DrilldownTab
                  active={tab === 'invoices'}
                  label={`Invoices (${detail.invoices.length})`}
                  onSelect={() => setTab('invoices')}
                />
                <DrilldownTab
                  active={tab === 'payments'}
                  label={`Payments (${detail.payments.length})`}
                  onSelect={() => setTab('payments')}
                />
                <DrilldownTab
                  active={tab === 'expenses'}
                  label={`Expenses (${detail.expenses.length})`}
                  onSelect={() => setTab('expenses')}
                />
                <DrilldownTab
                  active={tab === 'bonuses'}
                  label={`Bonuses (${detail.bonuses.length})`}
                  onSelect={() => setTab('bonuses')}
                />
              </div>
              {tab === 'invoices' ? <InvoicesTable detail={detail} /> : null}
              {tab === 'payments' ? <PaymentsTable detail={detail} /> : null}
              {tab === 'expenses' ? <UnitEconomicsDrilldownExpensesTable detail={detail} /> : null}
              {tab === 'bonuses' ? <UnitEconomicsDrilldownBonusesTable detail={detail} /> : null}
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/finance/invoices?search=${encodeURIComponent(detail.orderCode)}`}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
                >
                  Invoices
                  <ExternalLink size={12} className="opacity-70" aria-hidden />
                </Link>
                <Link
                  href={bonusBoardHref(detail.projectId)}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
                >
                  Bonus board
                  <ExternalLink size={12} className="opacity-70" aria-hidden />
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
