'use client';

import { useState } from 'react';
import { ListChecks, Puzzle, Ticket, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import type { FullProduct } from '@/lib/api/products';
import { productsApi } from '@/lib/api/products';
import {
  getProductStatus,
  getProductType,
  PRODUCT_STATUSES,
} from '@/features/projects/constants/projects';

interface ProductOverviewTabProps {
  product: FullProduct;
  onStatusChange: () => void;
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW: ['CREATING', 'LOST'],
  CREATING: ['DEVELOPMENT', 'ON_HOLD', 'LOST'],
  DEVELOPMENT: ['QA', 'ON_HOLD', 'LOST'],
  QA: ['TRANSFER', 'DEVELOPMENT', 'ON_HOLD'],
  TRANSFER: ['DONE', 'QA'],
  ON_HOLD: ['CREATING', 'DEVELOPMENT'],
  DONE: [],
  LOST: [],
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="bg-card border-border rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-muted-foreground text-xs">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function ProductOverviewTab({ product, onStatusChange }: ProductOverviewTabProps) {
  const [updating, setUpdating] = useState(false);
  const st = getProductStatus(product.status);
  const pt = getProductType(product.productType);
  const nextStatuses = ALLOWED_TRANSITIONS[product.status] ?? [];
  const doneTasks = product.tasks.filter((t) => t.status === 'DONE').length;
  const doneExtensions = product.extensions.filter((e) => e.status === 'DONE').length;

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      await productsApi.updateStatus(product.id, newStatus);
      onStatusChange();
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={ListChecks}
          label="Tasks"
          value={`${doneTasks}/${product.tasks.length}`}
          color="bg-blue-500"
        />
        <StatCard
          icon={Puzzle}
          label="Extensions"
          value={`${doneExtensions}/${product.extensions.length}`}
          color="bg-purple-500"
        />
        <StatCard
          icon={Ticket}
          label="Tickets"
          value={product.tickets.length}
          color="bg-amber-500"
        />
        <StatCard
          icon={DollarSign}
          label="Order"
          value={
            product.order
              ? `${Number(product.order.totalAmount).toLocaleString()} ${product.order.currency}`
              : '\u2014'
          }
          color="bg-emerald-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="bg-card border-border rounded-xl border p-5">
          <h3 className="mb-4 text-sm font-semibold">Product Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              {pt && <span className="font-medium">{pt.label}</span>}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              {st && <StatusBadge label={st.label} variant={st.variant} />}
            </div>
            {product.pm && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">PM</span>
                <span className="font-medium">
                  {product.pm.firstName} {product.pm.lastName}
                </span>
              </div>
            )}
            {product.deadline && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deadline</span>
                <span className="font-medium">
                  {new Date(product.deadline).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Project</span>
              <span className="font-medium">{product.project.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">
                {new Date(product.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </section>

        <section className="bg-card border-border rounded-xl border p-5">
          <h3 className="mb-4 text-sm font-semibold">Stage Gate</h3>
          {nextStatuses.length > 0 ? (
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs">Move product to the next stage:</p>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((ns) => {
                  const nst = PRODUCT_STATUSES.find((s) => s.value === ns);
                  return (
                    <Button
                      key={ns}
                      variant="outline"
                      size="sm"
                      disabled={updating}
                      onClick={() => handleStatusChange(ns)}
                      className="gap-1.5"
                    >
                      <div className={`h-2 w-2 rounded-full ${nst?.color ?? 'bg-gray-400'}`} />
                      {nst?.label ?? ns}
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {product.status === 'DONE'
                ? 'Product is completed.'
                : product.status === 'LOST'
                  ? 'Product is marked as lost.'
                  : 'No available transitions.'}
            </p>
          )}
        </section>
      </div>

      {product.description && (
        <section className="bg-card border-border rounded-xl border p-5">
          <h3 className="mb-2 text-sm font-semibold">Description</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
        </section>
      )}
    </div>
  );
}
