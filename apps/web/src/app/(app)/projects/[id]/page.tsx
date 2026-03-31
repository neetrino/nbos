'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCcw,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Package,
  Puzzle,
  Ticket,
  KeyRound,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared';
import { projectsApi, type FullProject } from '@/lib/api/projects';
import { getProjectType } from '@/features/projects/constants/projects';
import { OverviewTab } from '@/features/projects/components/tabs/OverviewTab';
import { TasksTab } from '@/features/projects/components/tabs/TasksTab';
import { ProductsTab } from '@/features/projects/components/tabs/ProductsTab';
import { ExtensionsTab } from '@/features/projects/components/tabs/ExtensionsTab';
import { SupportTab } from '@/features/projects/components/tabs/SupportTab';
import { CredentialsTab } from '@/features/projects/components/tabs/CredentialsTab';
import { FinanceTab } from '@/features/projects/components/tabs/FinanceTab';
import { CreateProductDialog } from '@/features/projects/components/CreateProductDialog';
import { CreateExtensionDialog } from '@/features/projects/components/CreateExtensionDialog';

const TAB_ITEMS = [
  { value: 'overview', label: 'Overview', icon: LayoutDashboard },
  { value: 'products', label: 'Products', icon: Package },
  { value: 'extensions', label: 'Extensions', icon: Puzzle },
  { value: 'tasks', label: 'Tasks', icon: ListChecks },
  { value: 'support', label: 'Support', icon: Ticket },
  { value: 'credentials', label: 'Credentials', icon: KeyRound },
  { value: 'finance', label: 'Finance', icon: DollarSign },
] as const;

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<FullProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showCreateExtension, setShowCreateExtension] = useState(false);
  const [productsKey, setProductsKey] = useState(0);
  const [extensionsKey, setExtensionsKey] = useState(0);

  const fetchProject = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      const data = await projectsApi.getById(params.id);
      setProject(data);
    } catch {
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-5">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) return null;

  const projType = getProjectType(project.type);

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/projects')}>
            <ArrowLeft size={18} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-accent/10 text-accent rounded-xl p-2.5">
              <FolderKanban size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{project.name}</h1>
                {projType && <StatusBadge label={projType.label} variant={projType.variant} />}
                {project.isArchived && <StatusBadge label="Archived" variant="gray" />}
              </div>
              <p className="text-muted-foreground text-sm">{project.code}</p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={fetchProject}>
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
          <OverviewTab project={project} />
        </TabsContent>

        <TabsContent value="products" className="mt-5">
          <ProductsTab
            key={productsKey}
            projectId={project.id}
            onCreateClick={() => setShowCreateProduct(true)}
          />
        </TabsContent>

        <TabsContent value="extensions" className="mt-5">
          <ExtensionsTab
            key={extensionsKey}
            projectId={project.id}
            onCreateClick={() => setShowCreateExtension(true)}
          />
        </TabsContent>

        <TabsContent value="tasks" className="mt-5">
          <TasksTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="support" className="mt-5">
          <SupportTab tickets={project.tickets} />
        </TabsContent>

        <TabsContent value="credentials" className="mt-5">
          <CredentialsTab credentials={project.credentials} />
        </TabsContent>

        <TabsContent value="finance" className="mt-5">
          <FinanceTab
            orders={project.orders}
            subscriptions={project.subscriptions}
            expenses={project.expenses}
            domains={project.domains}
          />
        </TabsContent>
      </Tabs>

      <CreateProductDialog
        open={showCreateProduct}
        onOpenChange={setShowCreateProduct}
        onCreated={() => setProductsKey((k) => k + 1)}
        projectId={project.id}
      />

      <CreateExtensionDialog
        open={showCreateExtension}
        onOpenChange={setShowCreateExtension}
        onCreated={() => setExtensionsKey((k) => k + 1)}
        projectId={project.id}
      />
    </div>
  );
}
