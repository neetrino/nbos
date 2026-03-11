'use client';

import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CreditCard,
  Building2,
  Banknote,
  Bitcoin,
  Filter,
} from 'lucide-react';

/* ───────── Types ───────── */

type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'CASH' | 'CRYPTO';

interface Payment {
  id: string;
  date: string;
  invoice: string;
  amount: string;
  method: PaymentMethod;
  notes: string;
}

interface SummaryCard {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number }>;
  iconBg: string;
  iconText: string;
}

/* ───────── Mock data ───────── */

const PAYMENTS: Payment[] = [
  {
    id: '1',
    date: '2026-03-10',
    invoice: 'INV-0248',
    amount: '֏1,450,000',
    method: 'BANK_TRANSFER',
    notes: 'ArmenTech Q1 payment',
  },
  {
    id: '2',
    date: '2026-03-09',
    invoice: 'INV-0247',
    amount: '֏320,000',
    method: 'CARD',
    notes: 'CloudHost monthly',
  },
  {
    id: '3',
    date: '2026-03-08',
    invoice: 'INV-0245',
    amount: '֏85,000',
    method: 'CASH',
    notes: 'DesignLab consultation',
  },
  {
    id: '4',
    date: '2026-03-07',
    invoice: 'INV-0244',
    amount: '֏760,000',
    method: 'BANK_TRANSFER',
    notes: 'SkyNet Solutions dev sprint',
  },
  {
    id: '5',
    date: '2026-03-05',
    invoice: 'INV-0242',
    amount: '֏420,000',
    method: 'CRYPTO',
    notes: 'Nova Design branding',
  },
  {
    id: '6',
    date: '2026-03-03',
    invoice: 'INV-0240',
    amount: '֏950,000',
    method: 'BANK_TRANSFER',
    notes: 'TechCorp hosting',
  },
  {
    id: '7',
    date: '2026-03-01',
    invoice: 'INV-0238',
    amount: '֏180,000',
    method: 'CARD',
    notes: 'FastTrack AM support',
  },
  {
    id: '8',
    date: '2026-02-28',
    invoice: 'INV-0235',
    amount: '֏2,100,000',
    method: 'BANK_TRANSFER',
    notes: 'GreenLine annual license',
  },
];

const SUMMARY: SummaryCard[] = [
  {
    label: 'Total Received',
    value: '֏6,265,000',
    icon: DollarSign,
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
  },
  {
    label: 'This Month',
    value: '֏3,985,000',
    icon: TrendingUp,
    iconBg: 'bg-violet-100',
    iconText: 'text-violet-600',
  },
  {
    label: 'Pending',
    value: '֏1,240,000',
    icon: Clock,
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
  },
];

/* ───────── Helpers ───────── */

const METHOD_CONFIG: Record<
  PaymentMethod,
  { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  BANK_TRANSFER: { label: 'Bank Transfer', color: 'bg-blue-100 text-blue-700', icon: Building2 },
  CARD: { label: 'Card', color: 'bg-violet-100 text-violet-700', icon: CreditCard },
  CASH: { label: 'Cash', color: 'bg-emerald-100 text-emerald-700', icon: Banknote },
  CRYPTO: { label: 'Crypto', color: 'bg-orange-100 text-orange-700', icon: Bitcoin },
};

const ALL_METHODS: PaymentMethod[] = ['BANK_TRANSFER', 'CARD', 'CASH', 'CRYPTO'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ───────── Components ───────── */

function SummaryCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {SUMMARY.map((s) => (
        <div key={s.label} className="border-border bg-card rounded-2xl border p-5">
          <div className={`inline-flex rounded-xl p-2.5 ${s.iconBg} ${s.iconText}`}>
            <s.icon size={20} />
          </div>
          <p className="text-foreground mt-3 text-2xl font-semibold">{s.value}</p>
          <p className="text-muted-foreground mt-1 text-sm">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

function MethodBadge({ method }: { method: PaymentMethod }) {
  const cfg = METHOD_CONFIG[method];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${cfg.color}`}
    >
      <cfg.icon size={12} />
      {cfg.label}
    </span>
  );
}

/* ───────── Page ───────── */

export default function PaymentsPage() {
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | ''>('');

  const filtered = methodFilter ? PAYMENTS.filter((p) => p.method === methodFilter) : PAYMENTS;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">Payments</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track incoming payments and transaction history.
        </p>
      </div>

      <SummaryCards />

      <div className="flex items-center gap-3">
        <Filter size={16} className="text-muted-foreground" />
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | '')}
          className="border-border bg-card text-foreground rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#E5A84B]/40"
        >
          <option value="">All Methods</option>
          {ALL_METHODS.map((m) => (
            <option key={m} value={m}>
              {METHOD_CONFIG[m].label}
            </option>
          ))}
        </select>
      </div>

      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="text-muted-foreground px-5 py-3.5 font-medium">Date</th>
              <th className="text-muted-foreground px-5 py-3.5 font-medium">Invoice</th>
              <th className="text-muted-foreground px-5 py-3.5 font-medium">Amount</th>
              <th className="text-muted-foreground px-5 py-3.5 font-medium">Method</th>
              <th className="text-muted-foreground px-5 py-3.5 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                className="border-border hover:bg-secondary/30 border-b transition-colors last:border-0"
              >
                <td className="text-foreground px-5 py-3.5">{formatDate(p.date)}</td>
                <td className="text-foreground px-5 py-3.5 font-medium">{p.invoice}</td>
                <td className="text-foreground px-5 py-3.5 font-semibold">{p.amount}</td>
                <td className="px-5 py-3.5">
                  <MethodBadge method={p.method} />
                </td>
                <td className="text-muted-foreground px-5 py-3.5">{p.notes}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-5 py-12 text-center">
                  No payments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
