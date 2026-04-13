'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCcw, LayoutGrid, List, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PageHeader,
  FilterBar,
  KanbanBoard,
  EmptyState,
  StatusBadge,
  type KanbanColumn,
} from '@/components/shared';
import { DealCard } from '@/features/crm/components/DealCard';
import { DealSheet } from '@/features/crm/components/DealSheet';
import { CreateDealDialog } from '@/features/crm/components/CreateDealDialog';
import {
  DEAL_STAGES,
  DEAL_TYPES,
  PAYMENT_TYPES,
  getDealStage,
  formatAmount,
} from '@/features/crm/constants/dealPipeline';
import { dealsApi, type Deal } from '@/lib/api/deals';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

type ViewMode = 'kanban' | 'list';

export default function DealsPipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<ViewMode>('kanban');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dealsApi.getAll({
        pageSize: 200,
        search: search || undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        type: filters.type && filters.type !== 'all' ? filters.type : undefined,
      });
      setDeals(data.items);
    } catch {
      /* handled by API layer */
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleStatusChange = async (id: string, status: string) => {
    const previousDeals = deals;
    const previousSelected = selectedDeal;

    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
    if (selectedDeal?.id === id) {
      setSelectedDeal((prev) => (prev ? { ...prev, status } : prev));
    }

    try {
      await dealsApi.updateStatus(id, status);
    } catch {
      setDeals(previousDeals);
      if (selectedDeal?.id === id) {
        setSelectedDeal(previousSelected);
      }
    }
  };

  const handleUpdate = async (id: string, data: Partial<Deal>) => {
    const previousDeals = deals;
    const previousSelected = selectedDeal;

    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...data } : d)));
    setSelectedDeal((prev) => (prev?.id === id ? { ...prev, ...data } : prev));

    try {
      const updated = await dealsApi.update(id, data);
      setDeals((prev) => prev.map((d) => (d.id === id ? { ...updated, ...data } : d)));
      setSelectedDeal((prev) => (prev?.id === id ? { ...updated, ...data } : prev));
    } catch {
      setDeals(previousDeals);
      setSelectedDeal(previousSelected);
    }
  };

  const handleDelete = async (id: string) => {
    const previousDeals = deals;

    setSheetOpen(false);
    setSelectedDeal(null);
    setDeals((prev) => prev.filter((d) => d.id !== id));

    try {
      await dealsApi.delete(id);
    } catch {
      setDeals(previousDeals);
    }
  };

  const handleCardClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setSheetOpen(true);
  };

  const handleMove = (itemId: string, _from: string, toColumn: string) => {
    handleStatusChange(itemId, toColumn);
  };

  const kanbanColumns: KanbanColumn<Deal>[] = DEAL_STAGES.map((stage) => ({
    key: stage.key,
    label: stage.label,
    color: stage.color,
    items: deals.filter((d) => d.status === stage.key),
  }));

  const totalCount = deals.length;
  const activeCount = deals.filter((d) => d.status !== 'FAILED' && d.status !== 'WON').length;

  const filterConfigs = [
    {
      key: 'type',
      label: 'Type',
      options: DEAL_TYPES.map((t) => ({ value: t.value, label: t.label })),
    },
    {
      key: 'status',
      label: 'Stage',
      options: DEAL_STAGES.map((s) => ({ value: s.key, label: s.label })),
    },
  ];

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="shrink-0">
        <PageHeader
          title="Deal Pipeline"
          description={`${totalCount} deals · ${activeCount} active`}
        >
          <Button variant="outline" size="icon" onClick={fetchDeals}>
            <RefreshCcw size={16} />
          </Button>
          <div className="border-border flex rounded-lg border">
            <Button
              variant={view === 'kanban' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setView('kanban')}
              className="rounded-r-none"
            >
              <LayoutGrid size={14} />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setView('list')}
              className="rounded-l-none"
            >
              <List size={14} />
            </Button>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            New Deal
          </Button>
        </PageHeader>
      </div>

      <div className="shrink-0">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search deals by contact, company, amount..."
          filters={filterConfigs}
          filterValues={filters}
          onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          onClearFilters={() => setFilters({})}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : deals.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No deals yet"
          description="Create your first deal or convert a qualified lead"
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} />
              Create First Deal
            </Button>
          }
        />
      ) : view === 'kanban' ? (
        <div className="min-h-0 flex-1">
          <KanbanBoard
            columns={kanbanColumns}
            renderCard={(deal) => (
              <DealCard deal={deal} onClick={handleCardClick} onStatusChange={handleStatusChange} />
            )}
            getItemId={(deal) => deal.id}
            onMove={handleMove}
            columnWidth={270}
            emptyMessage="No deals"
          />
        </div>
      ) : (
        <div className="border-border min-h-0 flex-1 overflow-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => {
                const stage = getDealStage(deal.status);
                return (
                  <TableRow
                    key={deal.id}
                    className="cursor-pointer"
                    onClick={() => handleCardClick(deal)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{deal.name || deal.code}</p>
                        <p className="text-muted-foreground text-xs">{deal.code}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : '—'}
                    </TableCell>
                    <TableCell className="font-semibold">{formatAmount(deal.amount)}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={deal.type.replace(/_/g, ' ')}
                        variant={deal.type === 'EXTENSION' ? 'blue' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {stage && (
                        <StatusBadge
                          label={stage.label}
                          variant={stage.variant}
                          dot
                          dotColor={stage.color}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {deal.seller ? `${deal.seller.firstName} ${deal.seller.lastName}` : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(deal.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateDealDialog open={showCreate} onOpenChange={setShowCreate} onCreated={fetchDeals} />

      <DealSheet
        deal={selectedDeal}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdate={handleUpdate}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onRefresh={fetchDeals}
      />
    </div>
  );
}
