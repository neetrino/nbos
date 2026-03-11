'use client';

import { useState } from 'react';
import {
  RefreshCw,
  Server,
  Globe,
  KeyRound,
  Headphones,
  Package,
  Filter,
  CalendarDays,
} from 'lucide-react';

/* ───────── Types ───────── */

type SubType = 'HOSTING' | 'DOMAIN' | 'LICENSE' | 'SUPPORT' | 'OTHER';
type SubStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

interface Subscription {
  id: string;
  code: string;
  project: string;
  type: SubType;
  amount: string;
  billingDay: number;
  status: SubStatus;
  partner: string;
}

/* ───────── Mock data ───────── */

const SUBSCRIPTIONS: Subscription[] = [
  {
    id: '1',
    code: 'SUB-001',
    project: 'ArmenTech Website',
    type: 'HOSTING',
    amount: '֏45,000',
    billingDay: 1,
    status: 'ACTIVE',
    partner: 'CloudHost Armenia',
  },
  {
    id: '2',
    code: 'SUB-002',
    project: 'SkyNet Portal',
    type: 'DOMAIN',
    amount: '֏8,000',
    billingDay: 15,
    status: 'ACTIVE',
    partner: 'ServerAM',
  },
  {
    id: '3',
    code: 'SUB-003',
    project: 'GreenLine CRM',
    type: 'LICENSE',
    amount: '֏120,000',
    billingDay: 5,
    status: 'ACTIVE',
    partner: 'TechSupport Pro',
  },
  {
    id: '4',
    code: 'SUB-004',
    project: 'DigiPay App',
    type: 'SUPPORT',
    amount: '֏80,000',
    billingDay: 10,
    status: 'PAUSED',
    partner: 'WebDev Studio',
  },
  {
    id: '5',
    code: 'SUB-005',
    project: 'Nova Design Brand',
    type: 'OTHER',
    amount: '֏35,000',
    billingDay: 20,
    status: 'ACTIVE',
    partner: 'DesignLab',
  },
  {
    id: '6',
    code: 'SUB-006',
    project: 'FastTrack Logistics',
    type: 'HOSTING',
    amount: '֏65,000',
    billingDay: 1,
    status: 'CANCELLED',
    partner: 'CloudHost Armenia',
  },
];

const TYPE_CONFIG: Record<
  SubType,
  { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  HOSTING: { label: 'Hosting', color: 'bg-blue-100 text-blue-700', icon: Server },
  DOMAIN: { label: 'Domain', color: 'bg-violet-100 text-violet-700', icon: Globe },
  LICENSE: { label: 'License', color: 'bg-amber-100 text-amber-700', icon: KeyRound },
  SUPPORT: { label: 'Support', color: 'bg-emerald-100 text-emerald-700', icon: Headphones },
  OTHER: { label: 'Other', color: 'bg-gray-100 text-gray-700', icon: Package },
};

const STATUS_CONFIG: Record<SubStatus, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-600',
  PAUSED: 'bg-amber-500/10 text-amber-600',
  CANCELLED: 'bg-red-500/10 text-red-600',
};

/* ───────── Computed summary ───────── */

const ACTIVE_COUNT = SUBSCRIPTIONS.filter((s) => s.status === 'ACTIVE').length;

const MRR = SUBSCRIPTIONS.filter((s) => s.status === 'ACTIVE').reduce(
  (sum, s) => sum + parseInt(s.amount.replace(/[^\d]/g, ''), 10),
  0,
);

function nextBillingDate(): string {
  const today = new Date();
  const upcoming = SUBSCRIPTIONS.filter((s) => s.status === 'ACTIVE')
    .map((s) => {
      const d = new Date(today.getFullYear(), today.getMonth(), s.billingDay);
      if (d <= today) d.setMonth(d.getMonth() + 1);
      return d;
    })
    .sort((a, b) => a.getTime() - b.getTime());
  if (upcoming.length === 0) return '—';
  return upcoming[0]!.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ───────── Components ───────── */

function SummaryCards() {
  const summaries = [
    {
      label: 'Total Active',
      value: String(ACTIVE_COUNT),
      icon: RefreshCw,
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-600',
    },
    {
      label: 'MRR',
      value: `֏${MRR.toLocaleString()}`,
      icon: RefreshCw,
      iconBg: 'bg-violet-100',
      iconText: 'text-violet-600',
    },
    {
      label: 'Next Billing',
      value: nextBillingDate(),
      icon: CalendarDays,
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {summaries.map((s) => (
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

function TypeBadge({ type }: { type: SubType }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${cfg.color}`}
    >
      <cfg.icon size={12} />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: SubStatus }) {
  return (
    <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${STATUS_CONFIG[status]}`}>
      {status}
    </span>
  );
}

/* ───────── Page ───────── */

export default function SubscriptionsPage() {
  const [typeFilter, setTypeFilter] = useState<SubType | ''>('');

  const filtered = typeFilter ? SUBSCRIPTIONS.filter((s) => s.type === typeFilter) : SUBSCRIPTIONS;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">Subscriptions</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Recurring subscriptions and billing overview.
        </p>
      </div>

      <SummaryCards />

      <div className="flex items-center gap-3">
        <Filter size={16} className="text-muted-foreground" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as SubType | '')}
          className="border-border bg-card text-foreground rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#E5A84B]/40"
        >
          <option value="">All Types</option>
          {(Object.keys(TYPE_CONFIG) as SubType[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_CONFIG[t].label}
            </option>
          ))}
        </select>
      </div>

      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="text-muted-foreground px-5 py-3.5 font-medium">Code</th>
              <th className="text-muted-foreground px-5 py-3.5 font-medium">Project</th>
              <th className="text-muted-foreground px-5 py-3.5 font-medium">Type</th>
              <th className="text-muted-foreground px-5 py-3.5 font-medium">Amount/mo</th>
              <th className="text-muted-foreground px-5 py-3.5 font-medium">Billing Day</th>
              <th className="text-muted-foreground px-5 py-3.5 font-medium">Status</th>
              <th className="text-muted-foreground px-5 py-3.5 font-medium">Partner</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr
                key={s.id}
                className="border-border hover:bg-secondary/30 border-b transition-colors last:border-0"
              >
                <td className="text-foreground px-5 py-3.5 font-medium">{s.code}</td>
                <td className="text-foreground px-5 py-3.5">{s.project}</td>
                <td className="px-5 py-3.5">
                  <TypeBadge type={s.type} />
                </td>
                <td className="text-foreground px-5 py-3.5 font-semibold">{s.amount}</td>
                <td className="text-muted-foreground px-5 py-3.5">{s.billingDay}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={s.status} />
                </td>
                <td className="text-muted-foreground px-5 py-3.5">{s.partner}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-5 py-12 text-center">
                  No subscriptions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
