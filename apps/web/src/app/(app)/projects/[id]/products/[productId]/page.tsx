'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  ListChecks,
  Puzzle,
  Ticket,
  KeyRound,
  DollarSign,
  ServerCog,
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsTriggerVariants,
} from '@/components/ui/tabs';
import { SIDEBAR_MODULE_VISUALS } from '@/components/layout/sidebar-module-visual';
import { productsApi, type Product, type FullProduct } from '@/lib/api/products';
import { projectsApi } from '@/lib/api/projects';
import { ProductOverviewTab } from '@/features/projects/components/product-tabs/ProductOverviewTab';
import { ProductTasksTab } from '@/features/projects/components/product-tabs/ProductTasksTab';
import { ProductExtensionsTab } from '@/features/projects/components/product-tabs/ProductExtensionsTab';
import { ProductTicketsTab } from '@/features/projects/components/product-tabs/ProductTicketsTab';
import { ProductTechnicalTab } from '@/features/projects/components/product-tabs/ProductTechnicalTab';
import { CredentialsTab } from '@/features/projects/components/tabs/CredentialsTab';
import { FinanceTab } from '@/features/projects/components/tabs/FinanceTab';
import { useProductDetailHeader } from '@/features/projects/hooks/use-product-detail-header';
import { buildDriveHrefWithProduct } from '@/features/drive/drive-deep-link';
import { cn } from '@/lib/utils';

const DriveNavIcon = SIDEBAR_MODULE_VISUALS.drive.Icon;

const TAB_ITEMS = [
  { value: 'overview', label: 'Overview', icon: LayoutDashboard },
  { value: 'tasks', label: 'Work Space', icon: ListChecks },
  { value: 'extensions', label: 'Extensions', icon: Puzzle },
  { value: 'tickets', label: 'Tickets', icon: Ticket },
  { value: 'technical', label: 'Technical', icon: ServerCog },
  { value: 'credentials', label: 'Credentials', icon: KeyRound },
  { value: 'finance', label: 'Finance', icon: DollarSign },
] as const;

type ProductTab = (typeof TAB_ITEMS)[number]['value'];

function ProductDetailPageContent() {
  const params = useParams<{ id: string; productId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [product, setProduct] = useState<FullProduct | null>(null);
  const [siblingProducts, setSiblingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProductTab>(getInitialTab(searchParams.get('tab')));
  const [projectData, setProjectData] = useState<{
    credentials: unknown[];
    orders: unknown[];
    subscriptions: unknown[];
    expenses: unknown[];
    domains: unknown[];
  } | null>(null);

  useProductDetailHeader(product, siblingProducts, params.id);

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
        credentials: data.credentials,
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

  useEffect(() => {
    setActiveTab(getInitialTab(searchParams.get('tab')));
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'credentials' || activeTab === 'finance') {
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
        onValueChange={(value) => setActiveTab(getInitialTab(value))}
        className="flex-1"
      >
        <TabsList>
          {TAB_ITEMS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
          <Link
            href={driveHref}
            className={cn(tabsTriggerVariants({ listVariant: 'default' }), 'gap-1.5')}
          >
            <DriveNavIcon size={14} aria-hidden />
            <span className="hidden sm:inline">Drive</span>
          </Link>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <ProductOverviewTab
            product={product}
            onStatusChange={fetchProduct}
            onNavigateTab={(tab) => setActiveTab(tab as ProductTab)}
          />
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

        <TabsContent value="technical" className="mt-5">
          <ProductTechnicalTab productId={product.id} />
        </TabsContent>

        <TabsContent value="credentials" className="mt-5">
          {projectData ? (
            <CredentialsTab credentials={projectData.credentials as never[]} />
          ) : (
            <div className="text-muted-foreground py-8 text-center text-sm">Loading...</div>
          )}
        </TabsContent>

        <TabsContent value="finance" className="mt-5">
          {projectData ? (
            <FinanceTab
              projectId={params.id}
              orders={projectData.orders as never[]}
              subscriptions={projectData.subscriptions as never[]}
              expenses={projectData.expenses as never[]}
              domains={projectData.domains as never[]}
              onAfterDriveUpload={() => void fetchProduct()}
            />
          ) : (
            <div className="text-muted-foreground py-8 text-center text-sm">Loading...</div>
          )}
        </TabsContent>
      </Tabs>
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

function getInitialTab(value: string | null): ProductTab {
  return TAB_ITEMS.some((tab) => tab.value === value) ? (value as ProductTab) : 'overview';
}
