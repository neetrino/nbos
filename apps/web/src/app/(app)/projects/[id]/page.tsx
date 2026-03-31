'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCcw,
  FolderKanban,
  Plus,
  Package,
  ArrowRight,
  Building2,
  UserCircle,
  User,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared';
import { projectsApi, type FullProject } from '@/lib/api/projects';
import { productsApi, type Product } from '@/lib/api/products';
import {
  getProductStatus,
  getProductType,
  PRODUCT_STATUSES,
} from '@/features/projects/constants/projects';
import { CreateProductDialog } from '@/features/projects/components/CreateProductDialog';

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<FullProject | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

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

  const fetchProducts = useCallback(async () => {
    if (!params.id) return;
    setProductsLoading(true);
    try {
      const data = await productsApi.getAll({
        projectId: params.id,
        pageSize: 50,
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setProducts(data.items);
    } catch {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [params.id, statusFilter]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-5">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) return null;

  const byStatus = (status: string) => products.filter((p) => p.status === status).length;

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Header */}
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
                {project.isArchived && <StatusBadge label="Archived" variant="gray" />}
              </div>
              <p className="text-muted-foreground text-sm">{project.code}</p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            fetchProject();
            fetchProducts();
          }}
        >
          <RefreshCcw size={16} />
        </Button>
      </div>

      {/* Project Info Card */}
      <div className="bg-card border-border grid gap-6 rounded-xl border p-5 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Project Details</h3>
          <div className="space-y-2">
            {project.contact && (
              <InfoRow
                icon={UserCircle}
                label="Contact"
                value={`${project.contact.firstName} ${project.contact.lastName}`}
              />
            )}
            {project.company && (
              <InfoRow icon={Building2} label="Company" value={project.company.name} />
            )}
          </div>
        </div>
        {project.description && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Description</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{project.description}</p>
          </div>
        )}
      </div>

      {/* Products Section */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">Products</h2>
            <span className="bg-secondary text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
              {products.length}
            </span>
            {products.length > 0 && (
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
            )}
          </div>
          <Button size="sm" onClick={() => setShowCreateProduct(true)} className="gap-1.5">
            <Plus size={14} />
            New Product
          </Button>
        </div>

        {productsLoading ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-muted-foreground py-16 text-center">
            <Package size={48} className="mx-auto mb-4 opacity-20" />
            <p className="mb-1 text-sm font-medium">No products in this project yet</p>
            <p className="mb-4 text-xs">Create a product to start tracking work</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateProduct(true)}
              className="gap-1.5"
            >
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
                  onClick={() => router.push(`/projects/${params.id}/products/${product.id}`)}
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
                      <span className="text-muted-foreground">
                        {product._count.extensions} ext.
                      </span>
                      <span className="text-muted-foreground">
                        {product._count.tickets} tickets
                      </span>
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

      <CreateProductDialog
        open={showCreateProduct}
        onOpenChange={setShowCreateProduct}
        onCreated={fetchProducts}
        projectId={project.id}
      />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="text-muted-foreground flex items-center gap-2">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <span className="font-medium">{value}</span>
    </div>
  );
}
