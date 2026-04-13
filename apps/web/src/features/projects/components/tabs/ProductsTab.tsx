'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Package, ArrowRight, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import { productsApi, type Product } from '@/lib/api/products';
import {
  getProductStatus,
  getProductType,
  PRODUCT_STATUSES,
} from '@/features/projects/constants/projects';

interface ProductsTabProps {
  projectId: string;
  onCreateClick: () => void;
}

export function ProductsTab({ projectId, onCreateClick }: ProductsTabProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productsApi.getAll({
        projectId,
        pageSize: 50,
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setProducts(data.items);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const byStatus = (status: string) => products.filter((p) => p.status === status).length;

  if (loading) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">Loading products...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{products.length} products</span>
          <div className="flex gap-1">
            <Button
              variant={statusFilter === null ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(null)}
              className="h-7 text-xs"
            >
              All
            </Button>
            {PRODUCT_STATUSES.filter((s) => byStatus(s.value) > 0).map((s) => (
              <Button
                key={s.value}
                variant={statusFilter === s.value ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(s.value)}
                className="h-7 text-xs"
              >
                {s.label} ({byStatus(s.value)})
              </Button>
            ))}
          </div>
        </div>
        <Button size="sm" onClick={onCreateClick} className="gap-1.5">
          <Plus size={14} />
          New Product
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No products in this project yet.</p>
          <Button variant="outline" size="sm" onClick={onCreateClick} className="mt-3 gap-1.5">
            <Plus size={14} />
            Create First Product
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const st = getProductStatus(product.status);
            const pt = getProductType(product.productType);
            return (
              <div
                key={product.id}
                onClick={() => router.push(`/projects/${projectId}/products/${product.id}`)}
                className="bg-card border-border hover:border-accent/50 group cursor-pointer rounded-xl border p-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold">{product.name}</h4>
                    {pt && <span className="text-muted-foreground text-xs">{pt.label}</span>}
                  </div>
                  {st && <StatusBadge label={st.label} variant={st.variant} />}
                </div>

                <div className="mt-3 space-y-1.5">
                  {product.pm && (
                    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <User size={12} />
                      <span>
                        {product.pm.firstName} {product.pm.lastName}
                      </span>
                    </div>
                  )}
                  {product.deadline && (
                    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <Calendar size={12} />
                      <span>{new Date(product.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-3 text-[10px]">
                    <span className="text-muted-foreground">{product._count.tasks} tasks</span>
                    <span className="text-muted-foreground">{product._count.extensions} ext.</span>
                    <span className="text-muted-foreground">{product._count.tickets} tickets</span>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
