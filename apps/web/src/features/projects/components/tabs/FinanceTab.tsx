'use client';

import { DollarSign, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import type {
  ProjectOrder,
  ProjectSubscription,
  ProjectExpense,
  ProjectDomain,
} from '@/lib/api/projects';

interface FinanceTabProps {
  orders: ProjectOrder[];
  subscriptions: ProjectSubscription[];
  expenses: ProjectExpense[];
  domains: ProjectDomain[];
}

function formatAmount(amount: number | string): string {
  return Number(amount).toLocaleString('en-US');
}

const ORDER_STATUS_MAP: Record<
  string,
  { label: string; variant: 'blue' | 'amber' | 'green' | 'gray' }
> = {
  ACTIVE: { label: 'Active', variant: 'blue' },
  PARTIALLY_PAID: { label: 'Partial', variant: 'amber' },
  FULLY_PAID: { label: 'Paid', variant: 'green' },
  CLOSED: { label: 'Closed', variant: 'gray' },
};

const INVOICE_STATUS_MAP: Record<
  string,
  { label: string; variant: 'blue' | 'indigo' | 'purple' | 'red' | 'gray' | 'green' | 'amber' }
> = {
  NEW: { label: 'New', variant: 'blue' },
  CREATED_IN_GOV: { label: 'Gov', variant: 'indigo' },
  SENT: { label: 'Sent', variant: 'purple' },
  OVERDUE: { label: 'Overdue', variant: 'red' },
  ON_HOLD: { label: 'Hold', variant: 'gray' },
  PAID: { label: 'Paid', variant: 'green' },
  UNPAID: { label: 'Unpaid', variant: 'amber' },
};

const SUB_STATUS_MAP: Record<string, { label: string; variant: 'green' | 'amber' | 'red' }> = {
  ACTIVE: { label: 'Active', variant: 'green' },
  PAUSED: { label: 'Paused', variant: 'amber' },
  CANCELLED: { label: 'Cancelled', variant: 'red' },
};

export function FinanceTab({ orders, subscriptions, expenses, domains }: FinanceTabProps) {
  const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
  const paidInvoices = orders.flatMap((o) => o.invoices).filter((i) => i.status === 'PAID');
  const totalPaid = paidInvoices.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const monthlyMRR = subscriptions
    .filter((s) => s.status === 'ACTIVE')
    .reduce((s, sub) => s + Number(sub.amount), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="bg-card border-border rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-500" />
            <span className="text-muted-foreground text-xs">Total Revenue</span>
          </div>
          <p className="mt-1 text-xl font-bold">{formatAmount(totalRevenue)}</p>
        </div>
        <div className="bg-card border-border rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" />
            <span className="text-muted-foreground text-xs">Received</span>
          </div>
          <p className="mt-1 text-xl font-bold">{formatAmount(totalPaid)}</p>
        </div>
        <div className="bg-card border-border rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="text-red-500" />
            <span className="text-muted-foreground text-xs">Expenses</span>
          </div>
          <p className="mt-1 text-xl font-bold">{formatAmount(totalExpenses)}</p>
        </div>
        <div className="bg-card border-border rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-purple-500" />
            <span className="text-muted-foreground text-xs">MRR</span>
          </div>
          <p className="mt-1 text-xl font-bold">{formatAmount(monthlyMRR)}</p>
        </div>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold">Orders ({orders.length})</h3>
        {orders.length === 0 ? (
          <p className="text-muted-foreground text-sm">No orders</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const st = ORDER_STATUS_MAP[order.status];
              const paidAmount = order.invoices
                .filter((i) => i.status === 'PAID')
                .reduce((s, i) => s + Number(i.amount), 0);
              const progress =
                Number(order.totalAmount) > 0 ? (paidAmount / Number(order.totalAmount)) * 100 : 0;

              return (
                <div key={order.id} className="bg-card border-border rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{order.code}</p>
                        {st && <StatusBadge label={st.label} variant={st.variant} />}
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {order.type} &middot; {order.paymentType.replace(/_/g, ' ')}
                        {order.product && ` → ${order.product.name}`}
                        {order.extension && ` → ${order.extension.name}`}
                      </p>
                    </div>
                    <p className="text-lg font-bold">{formatAmount(order.totalAmount)}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="bg-secondary h-1.5 flex-1 rounded-full">
                      <div
                        className="h-1.5 rounded-full bg-green-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground text-[10px]">
                      {formatAmount(paidAmount)} / {formatAmount(order.totalAmount)}
                    </span>
                  </div>
                  {order.invoices.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {order.invoices.map((inv) => {
                        const invSt = INVOICE_STATUS_MAP[inv.status];
                        return (
                          <div key={inv.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{inv.code}</span>
                              {invSt && <StatusBadge label={invSt.label} variant={invSt.variant} />}
                            </div>
                            <span className="font-medium">{formatAmount(inv.amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {subscriptions.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold">Subscriptions ({subscriptions.length})</h3>
          <div className="space-y-3">
            {subscriptions.map((sub) => {
              const st = SUB_STATUS_MAP[sub.status];
              return (
                <div key={sub.id} className="bg-card border-border rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{sub.code}</p>
                      {st && <StatusBadge label={st.label} variant={st.variant} />}
                    </div>
                    <p className="font-bold">{formatAmount(sub.amount)} / mo</p>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {sub.type.replace(/_/g, ' ')} &middot; Billing day: {sub.billingDay} &middot;
                    Since {new Date(sub.startDate).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {expenses.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold">Expenses ({expenses.length})</h3>
          <div className="border-border overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Expense</th>
                  <th className="px-4 py-2 text-left font-medium">Category</th>
                  <th className="px-4 py-2 text-left font-medium">Frequency</th>
                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id} className="border-border border-t">
                    <td className="px-4 py-2 font-medium">
                      {exp.name}
                      {exp.isPassThrough && (
                        <StatusBadge label="Pass-through" variant="gray" className="ml-2" />
                      )}
                    </td>
                    <td className="text-muted-foreground px-4 py-2">{exp.category}</td>
                    <td className="text-muted-foreground px-4 py-2">
                      {exp.frequency.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">{formatAmount(exp.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {domains.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold">Domains ({domains.length})</h3>
          <div className="space-y-2">
            {domains.map((dom) => (
              <div
                key={dom.id}
                className="bg-card border-border flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div>
                  <p className="font-mono text-sm font-medium">{dom.domainName}</p>
                  <p className="text-muted-foreground text-xs">
                    {dom.provider ?? ''} &middot;{' '}
                    {dom.expiryDate
                      ? `Expires ${new Date(dom.expiryDate).toLocaleDateString()}`
                      : 'No expiry'}
                  </p>
                </div>
                <StatusBadge
                  label={dom.status.replace(/_/g, ' ')}
                  variant={
                    dom.status === 'ACTIVE'
                      ? 'green'
                      : dom.status === 'EXPIRING_SOON'
                        ? 'amber'
                        : dom.status === 'EXPIRED'
                          ? 'red'
                          : 'gray'
                  }
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
