'use client';

import { useState } from 'react';
import {
  Search,
  ChevronDown,
  Gift,
  User,
  FolderKanban,
  DollarSign,
  Hash,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

type BonusStatus =
  | 'INCOMING'
  | 'EARNED'
  | 'PENDING_ELIGIBILITY'
  | 'VESTED'
  | 'HOLDBACK'
  | 'ACTIVE'
  | 'PAID'
  | 'CLAWBACK';
type BonusType = 'PERFORMANCE' | 'PROJECT' | 'REFERRAL' | 'RETENTION' | 'SIGNING';

interface Bonus {
  id: string;
  employee: string;
  type: BonusType;
  amount: number;
  status: BonusStatus;
  project: string | null;
}

const STATUSES: { key: BonusStatus; label: string; color: string }[] = [
  { key: 'INCOMING', label: 'Incoming', color: 'bg-gray-400' },
  { key: 'EARNED', label: 'Earned', color: 'bg-blue-400' },
  { key: 'PENDING_ELIGIBILITY', label: 'Pending Eligibility', color: 'bg-amber-400' },
  { key: 'VESTED', label: 'Vested', color: 'bg-indigo-500' },
  { key: 'HOLDBACK', label: 'Holdback', color: 'bg-orange-500' },
  { key: 'ACTIVE', label: 'Active', color: 'bg-purple-500' },
  { key: 'PAID', label: 'Paid', color: 'bg-emerald-500' },
  { key: 'CLAWBACK', label: 'Clawback', color: 'bg-red-500' },
];

const TYPE_CONFIG: Record<BonusType, { label: string; color: string }> = {
  PERFORMANCE: { label: 'Performance', color: 'bg-blue-500/10 text-blue-600' },
  PROJECT: { label: 'Project', color: 'bg-purple-500/10 text-purple-600' },
  REFERRAL: { label: 'Referral', color: 'bg-emerald-500/10 text-emerald-600' },
  RETENTION: { label: 'Retention', color: 'bg-amber-500/10 text-amber-600' },
  SIGNING: { label: 'Signing', color: 'bg-indigo-500/10 text-indigo-600' },
};

const MOCK_BONUSES: Bonus[] = [
  {
    id: '1',
    employee: 'Arman K.',
    type: 'PERFORMANCE',
    amount: 200_000,
    status: 'PAID',
    project: 'NBOS Platform',
  },
  {
    id: '2',
    employee: 'Lilit M.',
    type: 'PROJECT',
    amount: 150_000,
    status: 'ACTIVE',
    project: 'Client Portal',
  },
  {
    id: '3',
    employee: 'Davit S.',
    type: 'REFERRAL',
    amount: 100_000,
    status: 'EARNED',
    project: null,
  },
  {
    id: '4',
    employee: 'Arman K.',
    type: 'RETENTION',
    amount: 300_000,
    status: 'VESTED',
    project: null,
  },
  {
    id: '5',
    employee: 'Lilit M.',
    type: 'PERFORMANCE',
    amount: 180_000,
    status: 'PENDING_ELIGIBILITY',
    project: 'NBOS Platform',
  },
  {
    id: '6',
    employee: 'Davit S.',
    type: 'PROJECT',
    amount: 250_000,
    status: 'INCOMING',
    project: 'Client Portal',
  },
  {
    id: '7',
    employee: 'Aram V.',
    type: 'SIGNING',
    amount: 500_000,
    status: 'HOLDBACK',
    project: null,
  },
  {
    id: '8',
    employee: 'Aram V.',
    type: 'PERFORMANCE',
    amount: 120_000,
    status: 'CLAWBACK',
    project: 'NBOS Platform',
  },
  {
    id: '9',
    employee: 'Arman K.',
    type: 'PROJECT',
    amount: 170_000,
    status: 'ACTIVE',
    project: 'NBOS Platform',
  },
  {
    id: '10',
    employee: 'Lilit M.',
    type: 'RETENTION',
    amount: 220_000,
    status: 'EARNED',
    project: null,
  },
  {
    id: '11',
    employee: 'Davit S.',
    type: 'PERFORMANCE',
    amount: 190_000,
    status: 'PAID',
    project: 'Client Portal',
  },
  {
    id: '12',
    employee: 'Aram V.',
    type: 'REFERRAL',
    amount: 100_000,
    status: 'INCOMING',
    project: null,
  },
];

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US').format(amount) + ' AMD';
}

const UNIQUE_EMPLOYEES = [...new Set(MOCK_BONUSES.map((b) => b.employee))];

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  accent?: boolean;
}) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <div
          className={`rounded-xl p-2 ${accent ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground'}`}
        >
          <Icon size={16} />
        </div>
      </div>
      <p className="text-foreground mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function BonusCard({ bonus }: { bonus: Bonus }) {
  const typeCfg = TYPE_CONFIG[bonus.type];

  return (
    <div className="group border-border bg-card rounded-xl border p-3.5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="text-foreground flex items-center gap-1.5 text-sm font-medium">
          <User size={12} className="text-muted-foreground" />
          {bonus.employee}
        </div>
        <span
          className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-medium ${typeCfg.color}`}
        >
          {typeCfg.label}
        </span>
      </div>

      <div className="text-foreground mt-2.5 flex items-center gap-1 text-sm font-semibold">
        <DollarSign size={12} className="text-accent" />
        {formatAmount(bonus.amount)}
      </div>

      {bonus.project && (
        <div className="text-muted-foreground mt-2 flex items-center gap-1 text-[10px]">
          <FolderKanban size={10} />
          {bonus.project}
        </div>
      )}
    </div>
  );
}

export default function BonusPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<BonusType | 'ALL'>('ALL');
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL');

  const filtered = MOCK_BONUSES.filter((bonus) => {
    const matchesSearch =
      !search ||
      bonus.employee.toLowerCase().includes(search.toLowerCase()) ||
      bonus.project?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || bonus.type === typeFilter;
    const matchesEmployee = employeeFilter === 'ALL' || bonus.employee === employeeFilter;
    return matchesSearch && matchesType && matchesEmployee;
  });

  const totalAmount = MOCK_BONUSES.reduce((sum, b) => sum + b.amount, 0);
  const paidCount = MOCK_BONUSES.filter((b) => b.status === 'PAID').length;

  const columns = STATUSES.map((status) => ({
    ...status,
    bonuses: filtered.filter((b) => b.status === status.key),
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Bonus Board</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {MOCK_BONUSES.length} bonuses &middot; {UNIQUE_EMPLOYEES.length} employees
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Bonuses" value={String(MOCK_BONUSES.length)} icon={Hash} />
        <SummaryCard
          label="Total Amount"
          value={formatAmount(totalAmount)}
          icon={TrendingUp}
          accent
        />
        <SummaryCard label="Paid" value={String(paidCount)} icon={CheckCircle2} />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee or project..."
            className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
        <div className="relative">
          <ChevronDown
            size={14}
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as BonusType | 'ALL')}
            className="border-input bg-card text-foreground focus:ring-ring appearance-none rounded-xl border py-2.5 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <ChevronDown
            size={14}
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
          />
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="border-input bg-card text-foreground focus:ring-ring appearance-none rounded-xl border py-2.5 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
          >
            <option value="ALL">All Employees</option>
            {UNIQUE_EMPLOYEES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 flex-1 overflow-x-auto">
        <div className="flex gap-4 pb-4" style={{ minWidth: `${STATUSES.length * 260}px` }}>
          {columns.map((column) => (
            <div key={column.key} className="w-[240px] flex-shrink-0">
              <div className="mb-3 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${column.color}`} />
                <h3 className="text-foreground text-xs font-semibold">{column.label}</h3>
                <span className="bg-secondary text-muted-foreground ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                  {column.bonuses.length}
                </span>
              </div>
              <div className="space-y-3">
                {column.bonuses.map((bonus) => (
                  <BonusCard key={bonus.id} bonus={bonus} />
                ))}
                {column.bonuses.length === 0 && (
                  <div className="border-border rounded-xl border border-dashed p-8 text-center">
                    <Gift size={20} className="text-muted-foreground/30 mx-auto" />
                    <p className="text-muted-foreground mt-2 text-[10px]">No bonuses</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
