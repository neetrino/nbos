'use client';

import { DollarSign, ListChecks, Puzzle, Ticket } from 'lucide-react';
import type { FullProduct } from '@/lib/api/products';
import { ProductInfoPanel } from '@/features/projects/components/ProductInfoPanel';
import { ProductContactsSection } from '@/features/projects/components/ProductContactsSection';
import { ProductParticipantsSection } from '@/features/platform-access/components/ProductParticipantsSection';
import { DETAIL_SHEET_SECTION_TITLE_CLASS } from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';

interface ProductOverviewTabProps {
  product: FullProduct;
  onProductUpdated: (product: FullProduct) => void;
}

export function ProductOverviewTab({ product, onProductUpdated }: ProductOverviewTabProps) {
  const doneTasks = product.tasks.filter((task) => task.status === 'DONE').length;
  const doneExtensions = product.extensions.filter(
    (extension) => extension.status === 'DONE',
  ).length;
  const gateRequiredFields = new Set<string>();

  return (
    <div className="space-y-4 pb-6">
      <ProductStats product={product} doneTasks={doneTasks} doneExtensions={doneExtensions} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-start">
        <ProductInfoPanel
          product={product}
          gateRequiredFields={gateRequiredFields}
          className="w-full min-w-0"
        />
        <div className="flex w-full min-w-0 flex-col gap-4">
          <div className="bg-card border-border rounded-xl border p-4">
            <ProductContactsSection
              product={product}
              onProductUpdated={onProductUpdated}
              headerTitle="Contacts"
            />
          </div>
          <div className="bg-card border-border rounded-xl border p-4">
            <p className={cn(DETAIL_SHEET_SECTION_TITLE_CLASS, 'mb-3 text-xs')}>Product team</p>
            <ProductParticipantsSection productId={product.id} embedded />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductStats({
  product,
  doneTasks,
  doneExtensions,
}: {
  product: FullProduct;
  doneTasks: number;
  doneExtensions: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <StatChip
        icon={ListChecks}
        label="Tasks"
        value={`${doneTasks}/${product.tasks.length}`}
        tone="bg-blue-500/10 text-blue-700 dark:text-blue-300"
      />
      <StatChip
        icon={Puzzle}
        label="Extensions"
        value={`${doneExtensions}/${product.extensions.length}`}
        tone="bg-purple-500/10 text-purple-700 dark:text-purple-300"
      />
      <StatChip
        icon={Ticket}
        label="Tickets"
        value={String(product.tickets.length)}
        tone="bg-amber-500/10 text-amber-700 dark:text-amber-300"
      />
      <StatChip
        icon={DollarSign}
        label="Order"
        value={
          product.order
            ? `${Number(product.order.totalAmount).toLocaleString()} ${product.order.currency}`
            : '—'
        }
        tone="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      />
    </div>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="bg-card border-border flex items-center gap-2.5 rounded-xl border px-3 py-2.5">
      <div className={cn('rounded-lg p-1.5', tone)}>
        <Icon size={14} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate text-base leading-tight font-semibold">{value}</p>
        <p className="text-muted-foreground text-[11px]">{label}</p>
      </div>
    </div>
  );
}
