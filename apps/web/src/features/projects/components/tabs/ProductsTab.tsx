'use client';

import { Box, Wrench } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { getProductStatus, PRODUCT_TYPES } from '../../constants/projects';
import type { ProjectProduct, ProjectExtension } from '@/lib/api/projects';

interface ProductsTabProps {
  products: ProjectProduct[];
  extensions: ProjectExtension[];
}

const STAGE_ORDER = ['NEW', 'CREATING', 'DEVELOPMENT', 'QA', 'TRANSFER', 'DONE'];
const EXTENSION_STATUS_MAP: Record<
  string,
  { label: string; variant: 'blue' | 'purple' | 'amber' | 'green' | 'gray' | 'red' }
> = {
  NEW: { label: 'New', variant: 'blue' },
  IN_PROGRESS: { label: 'In Progress', variant: 'purple' },
  REVIEW: { label: 'Review', variant: 'amber' },
  DONE: { label: 'Done', variant: 'green' },
  CANCELLED: { label: 'Cancelled', variant: 'red' },
};

function ProductProgressBar({ status }: { status: string }) {
  const currentIdx = STAGE_ORDER.indexOf(status);
  const progress = currentIdx >= 0 ? ((currentIdx + 1) / STAGE_ORDER.length) * 100 : 0;

  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="bg-secondary h-1.5 flex-1 rounded-full">
        <div
          className="h-1.5 rounded-full bg-blue-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-muted-foreground text-[10px]">{Math.round(progress)}%</span>
    </div>
  );
}

function getProductTypeName(value: string): string {
  return PRODUCT_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function ProductsTab({ products, extensions }: ProductsTabProps) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Box size={16} />
          Products ({products.length})
        </h3>
        {products.length === 0 ? (
          <p className="text-muted-foreground text-sm">No products yet</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {products.map((product) => {
              const st = getProductStatus(product.status);
              return (
                <div key={product.id} className="bg-card border-border rounded-xl border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {getProductTypeName(product.productType)}
                      </p>
                    </div>
                    {st && <StatusBadge label={st.label} variant={st.variant} />}
                  </div>
                  <ProductProgressBar status={product.status} />
                  <div className="text-muted-foreground mt-3 flex items-center justify-between text-xs">
                    <span>{product._count.tasks} tasks</span>
                    {product.pm && (
                      <span>
                        PM: {product.pm.firstName} {product.pm.lastName}
                      </span>
                    )}
                    {product.deadline && (
                      <span>Due: {new Date(product.deadline).toLocaleDateString()}</span>
                    )}
                  </div>
                  {product.extensions.length > 0 && (
                    <div className="mt-3 space-y-1 border-t border-dashed pt-2">
                      <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                        Extensions
                      </p>
                      {product.extensions.map((ext) => {
                        const extSt = EXTENSION_STATUS_MAP[ext.status];
                        return (
                          <div key={ext.id} className="flex items-center justify-between text-xs">
                            <span>{ext.name}</span>
                            {extSt && <StatusBadge label={extSt.label} variant={extSt.variant} />}
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

      <section>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Wrench size={16} />
          All Extensions ({extensions.length})
        </h3>
        {extensions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No extensions</p>
        ) : (
          <div className="border-border overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Product</th>
                  <th className="px-4 py-2 text-left font-medium">Size</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-left font-medium">Assignee</th>
                </tr>
              </thead>
              <tbody>
                {extensions.map((ext) => {
                  const extSt = EXTENSION_STATUS_MAP[ext.status];
                  return (
                    <tr key={ext.id} className="border-border border-t">
                      <td className="px-4 py-2 font-medium">{ext.name}</td>
                      <td className="text-muted-foreground px-4 py-2">
                        {ext.product?.name ?? '—'}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge label={ext.size} variant="gray" />
                      </td>
                      <td className="px-4 py-2">
                        {extSt && <StatusBadge label={extSt.label} variant={extSt.variant} />}
                      </td>
                      <td className="text-muted-foreground px-4 py-2">
                        {ext.assignee ? `${ext.assignee.firstName} ${ext.assignee.lastName}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
