'use client';

import { useState } from 'react';
import { FolderKanban, LayoutGrid, List, Package, Plus, RefreshCcw, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { CreateStandaloneWorkSpaceDialog } from './CreateStandaloneWorkSpaceDialog';
import { WorkSpaceCard } from './WorkSpaceCard';
import { WorkSpaceListTable } from './WorkSpaceListTable';
import { WORK_SPACES_PAGE_SIZE_OPTIONS } from './work-spaces-page-constants';
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
              <TabsList variant="line" className="w-full min-w-0 sm:w-auto">
                <TabsTrigger value="standalone" className="gap-2 text-sm font-semibold">
                  <FolderKanban
                    className="text-muted-foreground opacity-70"
                    size={16}
                    aria-hidden
                  />
                  Standalone
                  <Badge variant="secondary" className="tabular-nums">
                    {counts.standalone}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="product" className="gap-2 text-sm font-semibold">
                  <Package className="text-muted-foreground opacity-70" size={16} aria-hidden />
                  Product
                  <Badge variant="secondary" className="tabular-nums">
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
            {tab === 'standalone' ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={16} />
                New Standalone Work Space
              </Button>
            ) : null}
          </div>
        </div>
        <p className="text-muted-foreground max-w-3xl text-sm">
          Planning spaces for delivery and operations.
        </p>
      </header>

      <Card className="border-border/80 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
            <div className="relative min-h-10 min-w-0 flex-1">
              <Search
                size={16}
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
              />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, project, product…"
                className="h-11 w-full pl-10"
                aria-label="Search work spaces"
              />
            </div>
            <div className="flex w-full min-w-0 flex-wrap items-center gap-3 lg:w-auto lg:flex-nowrap lg:justify-end">
              <Select
                value={mode}
                onValueChange={(value) => setMode(value as 'all' | 'scrum' | 'kanban')}
              >
                <SelectTrigger
                  className="h-11 min-w-[140px] flex-1 sm:flex-initial"
                  aria-label="Planning mode filter"
                >
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modes</SelectItem>
                  <SelectItem value="scrum">Scrum</SelectItem>
                  <SelectItem value="kanban">Kanban</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger
                  className="h-11 min-w-[120px] flex-1 sm:flex-initial"
                  aria-label="Page size"
                >
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_SPACES_PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="bg-muted/60 ml-auto flex h-11 shrink-0 rounded-lg p-1 lg:ml-0">
                <Button
                  type="button"
                  variant={view === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-9 px-3"
                  onClick={() => setView('grid')}
                  aria-label="Card grid view"
                >
                  <LayoutGrid size={16} />
                </Button>
                <Button
                  type="button"
                  variant={view === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-9 px-3"
                  onClick={() => setView('list')}
                  aria-label="List view"
                >
                  <List size={16} />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={16} />
                Create Standalone Work Space
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
        <div className="border-border rounded-xl border">
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
