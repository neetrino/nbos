'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  ChevronDown,
  X,
  Receipt,
  Server,
  Globe,
  Users,
  Code,
  Shield,
  Megaphone,
  Building2,
  TrendingUp,
  Hash,
  FolderKanban,
} from 'lucide-react';

type ExpenseCategory =
  | 'INFRASTRUCTURE'
  | 'SOFTWARE'
  | 'PERSONNEL'
  | 'MARKETING'
  | 'OFFICE'
  | 'SECURITY'
  | 'OTHER';
type ExpenseType = 'FIXED' | 'VARIABLE' | 'ONE_TIME';
type ExpenseStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';
type ExpenseFrequency = 'MONTHLY' | 'YEARLY' | 'QUARTERLY' | 'ONE_TIME';

interface Expense {
  id: string;
  name: string;
  category: ExpenseCategory;
  type: ExpenseType;
  amount: number;
  frequency: ExpenseFrequency;
  status: ExpenseStatus;
  project: string | null;
  isPlanned: boolean;
}

const CATEGORY_CONFIG: Record<
  ExpenseCategory,
  { label: string; icon: typeof Server; color: string }
> = {
  INFRASTRUCTURE: { label: 'Infrastructure', icon: Server, color: 'bg-blue-500/10 text-blue-600' },
  SOFTWARE: { label: 'Software', icon: Code, color: 'bg-purple-500/10 text-purple-600' },
  PERSONNEL: { label: 'Personnel', icon: Users, color: 'bg-emerald-500/10 text-emerald-600' },
  MARKETING: { label: 'Marketing', icon: Megaphone, color: 'bg-orange-500/10 text-orange-600' },
  OFFICE: { label: 'Office', icon: Building2, color: 'bg-amber-500/10 text-amber-600' },
  SECURITY: { label: 'Security', icon: Shield, color: 'bg-red-500/10 text-red-600' },
  OTHER: { label: 'Other', icon: Globe, color: 'bg-gray-500/10 text-gray-500' },
};

const TYPE_CONFIG: Record<ExpenseType, { label: string; color: string }> = {
  FIXED: { label: 'Fixed', color: 'bg-blue-500/10 text-blue-600' },
  VARIABLE: { label: 'Variable', color: 'bg-amber-500/10 text-amber-600' },
  ONE_TIME: { label: 'One-time', color: 'bg-gray-500/10 text-gray-500' },
};

const STATUS_CONFIG: Record<ExpenseStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'bg-emerald-500/10 text-emerald-600' },
  PAUSED: { label: 'Paused', color: 'bg-amber-500/10 text-amber-600' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-500/10 text-red-600' },
};

const FREQUENCY_LABELS: Record<ExpenseFrequency, string> = {
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
  QUARTERLY: 'Quarterly',
  ONE_TIME: 'One-time',
};

const MOCK_EXPENSES: Expense[] = [
  {
    id: '1',
    name: 'Neon PostgreSQL Pro',
    category: 'INFRASTRUCTURE',
    type: 'FIXED',
    amount: 69_000,
    frequency: 'MONTHLY',
    status: 'ACTIVE',
    project: 'NBOS Platform',
    isPlanned: true,
  },
  {
    id: '2',
    name: 'Vercel Pro Plan',
    category: 'INFRASTRUCTURE',
    type: 'FIXED',
    amount: 20_000,
    frequency: 'MONTHLY',
    status: 'ACTIVE',
    project: 'NBOS Platform',
    isPlanned: true,
  },
  {
    id: '3',
    name: 'Cloudflare R2 Storage',
    category: 'INFRASTRUCTURE',
    type: 'VARIABLE',
    amount: 12_500,
    frequency: 'MONTHLY',
    status: 'ACTIVE',
    project: null,
    isPlanned: true,
  },
  {
    id: '4',
    name: 'Figma Organization',
    category: 'SOFTWARE',
    type: 'FIXED',
    amount: 540_000,
    frequency: 'YEARLY',
    status: 'ACTIVE',
    project: null,
    isPlanned: true,
  },
  {
    id: '5',
    name: 'Senior Developer Salary',
    category: 'PERSONNEL',
    type: 'FIXED',
    amount: 800_000,
    frequency: 'MONTHLY',
    status: 'ACTIVE',
    project: 'NBOS Platform',
    isPlanned: true,
  },
  {
    id: '6',
    name: 'Google Ads Campaign',
    category: 'MARKETING',
    type: 'VARIABLE',
    amount: 150_000,
    frequency: 'MONTHLY',
    status: 'PAUSED',
    project: 'Client Portal',
    isPlanned: false,
  },
  {
    id: '7',
    name: 'Office Rent',
    category: 'OFFICE',
    type: 'FIXED',
    amount: 350_000,
    frequency: 'MONTHLY',
    status: 'ACTIVE',
    project: null,
    isPlanned: true,
  },
  {
    id: '8',
    name: 'Security Audit',
    category: 'SECURITY',
    type: 'ONE_TIME',
    amount: 1_200_000,
    frequency: 'ONE_TIME',
    status: 'ACTIVE',
    project: 'NBOS Platform',
    isPlanned: false,
  },
  {
    id: '9',
    name: 'Sentry Error Tracking',
    category: 'SOFTWARE',
    type: 'FIXED',
    amount: 26_000,
    frequency: 'MONTHLY',
    status: 'ACTIVE',
    project: null,
    isPlanned: true,
  },
  {
    id: '10',
    name: 'Domain Renewals',
    category: 'INFRASTRUCTURE',
    type: 'FIXED',
    amount: 18_000,
    frequency: 'YEARLY',
    status: 'ACTIVE',
    project: null,
    isPlanned: true,
  },
];

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US').format(amount) + ' AMD';
}

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

function CreateExpenseModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border-border w-full max-w-lg rounded-2xl border p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-lg font-semibold">Add Expense</h2>
          <button
            onClick={onClose}
            className="hover:bg-secondary rounded-lg p-1.5 transition-colors"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-foreground mb-1.5 block text-xs font-medium">Name</label>
            <input
              type="text"
              placeholder="Expense name"
              className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-foreground mb-1.5 block text-xs font-medium">Category</label>
              <select className="border-input bg-card text-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none">
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-foreground mb-1.5 block text-xs font-medium">Type</label>
              <select className="border-input bg-card text-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none">
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-foreground mb-1.5 block text-xs font-medium">
                Amount (AMD)
              </label>
              <input
                type="number"
                placeholder="0"
                className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-foreground mb-1.5 block text-xs font-medium">Frequency</label>
              <select className="border-input bg-card text-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none">
                {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-foreground mb-1.5 block text-xs font-medium">
              Project (optional)
            </label>
            <input
              type="text"
              placeholder="Project name"
              className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="border-border text-muted-foreground hover:bg-secondary rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Add Expense
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<ExpenseType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'ALL'>('ALL');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = MOCK_EXPENSES.filter((exp) => {
    const matchesSearch = !search || exp.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || exp.category === categoryFilter;
    const matchesType = typeFilter === 'ALL' || exp.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || exp.status === statusFilter;
    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });

  const activeExpenses = MOCK_EXPENSES.filter((e) => e.status === 'ACTIVE');
  const totalMonthly = activeExpenses
    .filter((e) => e.frequency === 'MONTHLY')
    .reduce((sum, e) => sum + e.amount, 0);
  const plannedCount = MOCK_EXPENSES.filter((e) => e.isPlanned).length;
  const unplannedCount = MOCK_EXPENSES.filter((e) => !e.isPlanned).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Expenses</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {MOCK_EXPENSES.length} expense items tracked
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total Expenses" value={String(MOCK_EXPENSES.length)} icon={Hash} />
        <SummaryCard
          label="Monthly Total"
          value={formatAmount(totalMonthly)}
          icon={TrendingUp}
          accent
        />
        <SummaryCard label="Planned" value={String(plannedCount)} icon={Receipt} />
        <SummaryCard label="Unplanned" value={String(unplannedCount)} icon={Receipt} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses..."
            className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
        <div className="relative">
          <ChevronDown
            size={14}
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | 'ALL')}
            className="border-input bg-card text-foreground focus:ring-ring appearance-none rounded-xl border py-2.5 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ExpenseType | 'ALL')}
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ExpenseStatus | 'ALL')}
            className="border-input bg-card text-foreground focus:ring-ring appearance-none rounded-xl border py-2.5 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border-border rounded-2xl border border-dashed py-20 text-center">
          <Receipt size={48} className="text-muted-foreground/30 mx-auto" />
          <h3 className="text-foreground mt-4 text-lg font-semibold">No expenses found</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Adjust your filters or add a new expense
          </p>
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-2xl border">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                  Name
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                  Category
                </th>
                <th className="text-muted-foreground px-4 py-3 text-center text-xs font-medium">
                  Type
                </th>
                <th className="text-muted-foreground px-4 py-3 text-right text-xs font-medium">
                  Amount
                </th>
                <th className="text-muted-foreground px-4 py-3 text-center text-xs font-medium">
                  Frequency
                </th>
                <th className="text-muted-foreground px-4 py-3 text-center text-xs font-medium">
                  Status
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                  Project
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {filtered.map((exp) => {
                const catCfg = CATEGORY_CONFIG[exp.category];
                const CatIcon = catCfg.icon;
                const typeCfg = TYPE_CONFIG[exp.type];
                const statusCfg = STATUS_CONFIG[exp.status];

                return (
                  <tr key={exp.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-foreground text-sm font-medium">{exp.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${catCfg.color}`}
                      >
                        <CatIcon size={12} />
                        {catCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${typeCfg.color}`}
                      >
                        {typeCfg.label}
                      </span>
                    </td>
                    <td className="text-foreground px-4 py-3 text-right text-sm font-semibold">
                      {formatAmount(exp.amount)}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-center text-xs">
                      {FREQUENCY_LABELS[exp.frequency]}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${statusCfg.color}`}
                      >
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {exp.project ? (
                        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <FolderKanban size={12} />
                          {exp.project}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateExpenseModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
