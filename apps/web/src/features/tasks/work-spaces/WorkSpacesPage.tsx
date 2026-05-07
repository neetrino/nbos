'use client';

import { useState } from 'react';
import { FolderKanban, Package, Plus, RefreshCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { CreateStandaloneWorkSpaceDialog } from './CreateStandaloneWorkSpaceDialog';
import { WorkSpaceCard } from './WorkSpaceCard';
import { WorkSpaceListTable } from './WorkSpaceListTable';
import { WorkSpacesToolbar } from './WorkSpacesToolbar';
import { useWorkSpacesDirectory } from './use-work-spaces-directory';

export function WorkSpacesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const {
    tab,
    setTab,
    searchInput,
    setSearchInput,
    mode,
    setMode,
    setPage,
    pageSize,
    setPageSize,
    view,
    setView,
    items,
    meta,
    counts,
    loading,
    error,
    refetch,
  } = useWorkSpacesDirectory();

  return (
    <div className="flex h-full flex-col gap-5">
      <header className="space-y-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
            <h1 className="text-foreground shrink-0 text-2xl font-semibold tracking-tight">
              Work Spaces
            </h1>
            <Tabs
              value={tab}
              onValueChange={(value) => setTab(value as 'standalone' | 'product')}
              className="min-w-0 flex-1 sm:w-auto sm:flex-initial"
            >
              <TabsList variant="pill" className="w-full min-w-0 sm:w-auto">
                <TabsTrigger value="standalone" className="font-semibold">
                  <FolderKanban size={16} strokeWidth={2} aria-hidden />
                  Standalone
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 rounded-full px-1.5 text-xs font-medium tabular-nums"
                  >
                    {counts.standalone}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="product" className="font-semibold">
                  <Package size={16} strokeWidth={2} aria-hidden />
                  Product
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 rounded-full px-1.5 text-xs font-medium tabular-nums"
                  >
                    {counts.product}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <Button
              variant="outline"
              size="icon"
              onClick={() => void refetch()}
              aria-label="Refresh list"
            >
              <RefreshCcw size={16} />
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground max-w-3xl text-sm">
          Planning spaces for delivery and operations.
        </p>
      </header>

      <WorkSpacesToolbar
        tab={tab}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        mode={mode}
        onModeChange={setMode}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        view={view}
        onViewChange={setView}
        onQuickCreated={() => void refetch()}
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No Work Spaces found"
          description={
            tab === 'standalone'
              ? 'Try another search or create a standalone space for internal planning.'
              : 'Product delivery spaces appear when a product has an ensured work space. Open a product from Projects to connect tasks.'
          }
          action={
            tab === 'standalone' ? (
              <Button variant="secondary" onClick={() => setCreateOpen(true)}>
                <Plus size={16} />
                Full form (description & Scrum)
              </Button>
            ) : undefined
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((workspace) => (
            <WorkSpaceCard key={workspace.id} workspace={workspace} />
          ))}
        </div>
      ) : (
        <div className="bg-card/40 overflow-hidden rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_8px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.04]">
          <WorkSpaceListTable workspaces={items} />
        </div>
      )}

      {!loading && !error && items.length > 0 ? (
        <WorkSpacesPaginationFooter meta={meta} onPageChange={setPage} />
      ) : null}

      <CreateStandaloneWorkSpaceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void refetch()}
      />
    </div>
  );
}

function WorkSpacesPaginationFooter({
  meta,
  onPageChange,
}: {
  meta: { total: number; page: number; pageSize: number; totalPages: number };
  onPageChange: (page: number) => void;
}) {
  const start = meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
  const end = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <div className="text-muted-foreground flex flex-col gap-3 border-t pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="tabular-nums">
        {start}–{end} of {meta.total}
      </span>
      {meta.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={meta.page <= 1}
            onClick={() => onPageChange(meta.page - 1)}
          >
            Previous
          </Button>
          <span className="text-muted-foreground px-1 tabular-nums">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={meta.page >= meta.totalPages}
            onClick={() => onPageChange(meta.page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
