'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  ListChecks,
  Puzzle,
  Headphones,
  KeyRound,
  DollarSign,
  ServerCog,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PAGE_TAB_BAR_WRAPPER_CLASS } from '@/components/shared/detail-sheet-classes';
import { EntityDriveNavAction } from '@/features/drive/EntityDriveNavAction';
import { productsApi, type Product, type FullProduct } from '@/lib/api/products';
import { projectsApi } from '@/lib/api/projects';
import { EntityDetailSheetsHost } from '@/features/projects/components/EntityDetailSheetsHost';
import { ProductOverviewTab } from '@/features/projects/components/product-tabs/ProductOverviewTab';
import { ProductTasksTab } from '@/features/projects/components/product-tabs/ProductTasksTab';
import { ProductExtensionsTab } from '@/features/projects/components/product-tabs/ProductExtensionsTab';
import { ProductSupportTab } from '@/features/projects/components/product-tabs/ProductSupportTab';
import { ProductTechnicalTab } from '@/features/projects/components/product-tabs/ProductTechnicalTab';
import { ProductCredentialsTab } from '@/features/projects/components/product-tabs/ProductCredentialsTab';
import { FinanceTab } from '@/features/projects/components/tabs/FinanceTab';
import { useProductDetailHeader } from '@/features/projects/hooks/use-product-detail-header';
import { useProductCredentialsTab } from '@/features/projects/hooks/use-product-credentials-tab';
import { useProductSupportTab } from '@/features/projects/hooks/use-product-support-tab';
import { useProductWorkSpaceTab } from '@/features/projects/hooks/use-product-work-space-tab';
import { useProductTechnicalTab } from '@/features/projects/hooks/use-product-technical-tab';
import { buildDriveHrefWithProduct } from '@/features/drive/drive-deep-link';
import {
  parseProductDetailTab,
  PRODUCT_DETAIL_TAB_DEFAULT,
  PRODUCT_DETAIL_TAB_QUERY,
  type ProductDetailTab,
} from '@/features/projects/constants/product-detail-tab';

const TAB_ITEMS = [
  { value: 'overview', label: 'Overview', icon: LayoutDashboard },
  { value: 'tasks', label: 'Work Space', icon: ListChecks },
  { value: 'extensions', label: 'Extensions', icon: Puzzle },
  { value: 'support', label: 'Support', icon: Headphones },
  { value: 'credentials', label: 'Credentials', icon: KeyRound },
  { value: 'finance', label: 'Finance', icon: DollarSign },
  { value: 'technical', label: 'Technical', icon: ServerCog },
] as const satisfies ReadonlyArray<{
  value: ProductDetailTab;
  label: string;
  icon: typeof LayoutDashboard;
}>;

function ProductDetailPageContent() {
  const params = useParams<{ id: string; productId: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [product, setProduct] = useState<FullProduct | null>(null);
  const [siblingProducts, setSiblingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const activeTab = parseProductDetailTab(searchParams.get(PRODUCT_DETAIL_TAB_QUERY));
  const [projectData, setProjectData] = useState<{
    orders: unknown[];
    subscriptions: unknown[];
    expenses: unknown[];
    domains: unknown[];
  } | null>(null);

  useProductDetailHeader(product, siblingProducts, params.id);

  const workSpaceTab = useProductWorkSpaceTab(
    params.productId,
    activeTab === 'tasks',
    product?.workSpaceId ?? null,
  );

  const credentialsTab = useProductCredentialsTab(
    params.productId,
    params.id,
    activeTab === 'credentials',
  );

  const supportTab = useProductSupportTab(params.productId, activeTab === 'support');

  const technicalTab = useProductTechnicalTab(params.productId, activeTab === 'technical');

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

  const fetchSiblings = useCallback(async () => {
    if (!params.id) return;
    try {
      const data = await productsApi.getAll({ projectId: params.id, pageSize: 50 });
      setSiblingProducts(data.items);
    } catch {
      setSiblingProducts([]);
    }
  }, [params.id]);

  const fetchProjectData = useCallback(async () => {
    if (!params.id) return;
    try {
      const data = await projectsApi.getById(params.id);
      setProjectData({
        orders: data.orders,
        subscriptions: data.subscriptions,
        expenses: data.expenses,
        domains: data.domains,
      });
    } catch {
      /* empty */
    }
  }, [params.id]);

  useEffect(() => {
    fetchProduct();
    fetchSiblings();
  }, [fetchProduct, fetchSiblings]);

  const handleTabChange = useCallback(
    (value: string) => {
      const tab = parseProductDetailTab(value);
      const nextParams = new URLSearchParams(searchParams.toString());
      if (tab === PRODUCT_DETAIL_TAB_DEFAULT) {
        nextParams.delete(PRODUCT_DETAIL_TAB_QUERY);
      } else {
        nextParams.set(PRODUCT_DETAIL_TAB_QUERY, tab);
      }
      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (activeTab === 'finance') {
      if (!projectData) fetchProjectData();
    }
  }, [activeTab, projectData, fetchProjectData]);

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-5">
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

  const driveHref = buildDriveHrefWithProduct(product.id);

  return (
    <div className="flex h-full flex-col gap-5">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className={PAGE_TAB_BAR_WRAPPER_CLASS}>
          <TabsList className="min-w-0 flex-1 justify-start overflow-x-auto">
            {TAB_ITEMS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                <tab.icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
            <EntityDriveNavAction href={driveHref} variant="tab" hideLabelOnMobile />
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-5">
          <ProductOverviewTab product={product} onStatusChange={fetchProduct} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-5">
          <ProductTasksTab {...workSpaceTab} />
        </TabsContent>

        <TabsContent value="extensions" className="mt-5">
          <ProductExtensionsTab productId={product.id} extensions={product.extensions} />
        </TabsContent>

        <TabsContent value="support" className="mt-5 flex min-h-0 flex-1 flex-col">
          <ProductSupportTab {...supportTab} projectId={params.id} />
        </TabsContent>

        <TabsContent value="credentials" className="mt-5 flex min-h-0 flex-1 flex-col">
          <ProductCredentialsTab {...credentialsTab} />
        </TabsContent>

        <TabsContent value="finance" className="mt-5 flex min-h-0 flex-1 flex-col">
          {projectData ? (
            <FinanceTab
              projectId={params.id}
              project={{
                id: product.project.id,
                code: product.project.code,
                name: product.project.name,
              }}
              productOrderId={product.order?.id ?? null}
              orders={projectData.orders as never[]}
              subscriptions={projectData.subscriptions as never[]}
              expenses={projectData.expenses as never[]}
            />
          ) : (
            <div className="text-muted-foreground py-8 text-center text-sm">Loading...</div>
          )}
        </TabsContent>

        <TabsContent value="technical" className="mt-5 flex min-h-0 flex-1 flex-col">
          <ProductTechnicalTab {...technicalTab} />
        </TabsContent>
      </Tabs>

      <EntityDetailSheetsHost product={product} onEntityUpdated={() => void fetchProduct()} />
    </div>
  );
}

function ProductDetailPageFallback() {
  return (
    <div className="flex h-full flex-col gap-5">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<ProductDetailPageFallback />}>
      <ProductDetailPageContent />
    </Suspense>
  );
}
