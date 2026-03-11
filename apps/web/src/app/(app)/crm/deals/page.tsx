'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  DollarSign,
  User,
  ChevronRight,
  MoreHorizontal,
  RefreshCcw,
  Briefcase,
} from 'lucide-react';
import { dealsApi, type Deal } from '@/lib/api/deals';

const DEAL_STATUSES = [
  { key: 'START_CONVERSATION', label: 'Start Conversation', color: 'bg-blue-400' },
  { key: 'DISCUSS_NEEDS', label: 'Discuss Needs', color: 'bg-blue-500' },
  { key: 'MEETING', label: 'Meeting', color: 'bg-indigo-500' },
  { key: 'CAN_WE_DO_IT', label: 'Can We Do It?', color: 'bg-purple-500' },
  { key: 'SEND_OFFER', label: 'Send Offer', color: 'bg-violet-500' },
  { key: 'GET_ANSWER', label: 'Get Answer', color: 'bg-fuchsia-500' },
  { key: 'DEPOSIT_AND_CONTRACT', label: 'Deposit & Contract', color: 'bg-amber-500' },
  { key: 'CREATING', label: 'Creating', color: 'bg-orange-500' },
  { key: 'GET_FINAL_PAY', label: 'Get Final Pay', color: 'bg-emerald-500' },
  { key: 'MAINTENANCE_OFFER', label: 'Maintenance Offer', color: 'bg-teal-500' },
  { key: 'FAILED', label: 'Failed', color: 'bg-red-500' },
  { key: 'WON', label: 'Won', color: 'bg-green-600' },
] as const;

function formatAmount(amount: number | null): string {
  if (!amount) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'AMD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function DealCard({
  deal,
  onStatusChange,
}: {
  deal: Deal;
  onStatusChange: (id: string, status: string) => void;
}) {
  const statusIdx = DEAL_STATUSES.findIndex((s) => s.key === deal.status);
  const nextStatus = statusIdx < 9 ? DEAL_STATUSES[statusIdx + 1] : undefined;

  return (
    <div className="group border-border bg-card rounded-xl border p-4 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-muted-foreground text-xs font-medium">{deal.code}</p>
          <h4 className="text-foreground mt-1 text-sm font-semibold">
            {deal.contact?.firstName} {deal.contact?.lastName}
          </h4>
        </div>
        <button className="hover:bg-secondary rounded-lg p-1 opacity-0 transition-opacity group-hover:opacity-100">
          <MoreHorizontal size={14} className="text-muted-foreground" />
        </button>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Briefcase size={12} />
          <span>{deal.type.replace(/_/g, ' ')}</span>
        </div>
        {deal.amount && (
          <div className="text-foreground flex items-center gap-2 text-xs font-medium">
            <DollarSign size={12} className="text-accent" />
            <span>{formatAmount(deal.amount)}</span>
          </div>
        )}
        {deal.seller && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <User size={12} />
            <span>
              {deal.seller.firstName} {deal.seller.lastName}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        {deal.lead && (
          <span className="bg-secondary text-muted-foreground rounded-md px-2 py-0.5 text-[10px] font-medium">
            {deal.lead.code}
          </span>
        )}
        {!deal.lead && <span />}
        {nextStatus && (
          <button
            onClick={() => onStatusChange(deal.id, nextStatus.key)}
            className="bg-accent/10 text-accent hover:bg-accent/20 flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors"
          >
            <ChevronRight size={10} />
            {nextStatus.label}
          </button>
        )}
      </div>
    </div>
  );
}

export default function DealsPipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dealsApi.getAll({
        pageSize: 200,
        search: search || undefined,
      });
      setDeals(data.items);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await dealsApi.updateStatus(id, status);
      await fetchDeals();
    } catch {
      /* empty */
    }
  };

  const groupedDeals = DEAL_STATUSES.map((status) => ({
    ...status,
    deals: deals.filter((d) => d.status === status.key),
  }));

  const totalAmount = deals.reduce((sum, d) => sum + (d.amount ?? 0), 0);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Deal Pipeline</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {deals.length} deals &middot; Total value: {formatAmount(totalAmount)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDeals}
            className="border-border text-muted-foreground hover:bg-secondary rounded-xl border p-2.5 transition-colors"
          >
            <RefreshCcw size={16} />
          </button>
          <button className="border-border text-muted-foreground hover:bg-secondary rounded-xl border p-2.5 transition-colors">
            <Filter size={16} />
          </button>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors">
            <Plus size={16} />
            New Deal
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mt-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals by code, contact name..."
            className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="mt-6 flex-1 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="border-accent h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        ) : (
          <div className="flex gap-4 pb-4" style={{ minWidth: `${DEAL_STATUSES.length * 260}px` }}>
            {groupedDeals.map((column) => (
              <div key={column.key} className="w-[250px] flex-shrink-0">
                <div className="mb-3 flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${column.color}`} />
                  <h3 className="text-foreground text-xs font-semibold">{column.label}</h3>
                  <span className="bg-secondary text-muted-foreground ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                    {column.deals.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {column.deals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} onStatusChange={handleStatusChange} />
                  ))}
                  {column.deals.length === 0 && (
                    <div className="border-border rounded-xl border border-dashed p-6 text-center">
                      <p className="text-muted-foreground text-[10px]">No deals</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
