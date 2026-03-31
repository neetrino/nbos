'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCcw,
  Package,
  LayoutDashboard,
  ListChecks,
  Puzzle,
  Ticket,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared';
import { productsApi, type FullProduct } from '@/lib/api/products';
import { getProductStatus, getProductType } from '@/features/projects/constants/projects';
import { ProductOverviewTab } from '@/features/projects/components/product-tabs/ProductOverviewTab';
import { ProductTasksTab } from '@/features/projects/components/product-tabs/ProductTasksTab';
import { ProductExtensionsTab } from '@/features/projects/components/product-tabs/ProductExtensionsTab';
import { ProductTicketsTab } from '@/features/projects/components/product-tabs/ProductTicketsTab';

const TAB_ITEMS = [
  { value: 'overview', label: 'Overview', icon: LayoutDashboard },
  { value: 'tasks', label: 'Tasks', icon: ListChecks },
  { value: 'extensions', label: 'Extensions', icon: Puzzle },
  { value: 'tickets', label: 'Tickets', icon: Ticket },
] as const;

export default function ProductDetailPage() {
  const params = useParams<{ id: string; productId: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<FullProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchProduct = useCallback(async () => {
    if (!params.productId) return;
    setLoading(true);
    try {
      const data = await productsApi.getById(params.productId);
      setProduct(data);
    } catch {
      router.push(`/projects/${params.id}`);
    } finally {
      setLoading(false);
    }
  }, [params.productId, params.id, router]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-5">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!product) return null;

  const st = getProductStatus(product.status);
  const pt = getProductType(product.productType);

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/projects/${params.id}`)}>
            <ArrowLeft size={18} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-500">
              <Package size={20} />
            </div>
            <div>
              <div className="text-muted-foreground mb-0.5 flex items-center gap-1 text-xs">
                <button
                  onClick={() => router.push(`/projects/${params.id}`)}
                  className="hover:text-foreground transition-colors"
                >
                  {product.project.name}
                </button>
                <ChevronRight size={12} />
                <span>Products</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{product.name}</h1>
                {st && <StatusBadge label={st.label} variant={st.variant} />}
                {pt && (
                  <span className="bg-secondary rounded-md px-2 py-0.5 text-[10px] font-medium">
                    {pt.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={fetchProduct}>
          <RefreshCcw size={16} />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList>
          {TAB_ITEMS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <ProductOverviewTab product={product} onStatusChange={fetchProduct} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-5">
          <ProductTasksTab productId={product.id} />
        </TabsContent>

        <TabsContent value="extensions" className="mt-5">
          <ProductExtensionsTab extensions={product.extensions} />
        </TabsContent>

        <TabsContent value="tickets" className="mt-5">
          <ProductTicketsTab tickets={product.tickets} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
