'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FolderKanban, Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState, ErrorState, FilterBar, LoadingState, PageHeader } from '@/components/shared';
import { tasksApi, type WorkSpace } from '@/lib/api/tasks';
import { CreateStandaloneWorkSpaceDialog } from './CreateStandaloneWorkSpaceDialog';
import { WorkSpaceCard } from './WorkSpaceCard';
import {
  filterWorkSpaces,
  groupWorkSpaces,
  summarizeWorkSpaces,
  WORK_SPACE_GROUPS,
} from './work-space-utils';

const FILTERS = [
  {
    key: 'type',
    label: 'type',
    options: [
      { value: 'STANDALONE_OPERATIONAL', label: 'Standalone' },
      { value: 'PRODUCT_DELIVERY', label: 'Product Delivery' },
    ],
  },
  {
    key: 'mode',
    label: 'mode',
    options: [
      { value: 'scrum', label: 'Scrum' },
      { value: 'kanban', label: 'Kanban' },
    ],
  },
];

export function WorkSpacesPage() {
  const [workspaces, setWorkspaces] = useState<WorkSpace[]>([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchWorkSpaces = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tasksApi.getWorkSpaces();
      setWorkspaces(data);
      setError(null);
    } catch {
      setError('Work Spaces could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkSpaces();
  }, [fetchWorkSpaces]);

  const filteredWorkSpaces = useMemo(
    () => filterWorkSpaces(workspaces, search, filters),
    [workspaces, search, filters],
  );
  const groups = useMemo(() => groupWorkSpaces(filteredWorkSpaces), [filteredWorkSpaces]);
  const summary = useMemo(() => summarizeWorkSpaces(workspaces), [workspaces]);

  const handleCreated = (workspace: WorkSpace) => {
    setWorkspaces((current) => [workspace, ...current]);
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title="Work Spaces" description="Planning spaces for delivery and operations.">
        <Button variant="outline" size="icon" onClick={fetchWorkSpaces} aria-label="Refresh">
          <RefreshCcw size={16} />
        </Button>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          New Standalone Work Space
        </Button>
      </PageHeader>

      <SummaryCards summary={summary} />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search work spaces..."
        filters={FILTERS}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
        onClearFilters={() => setFilters({})}
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchWorkSpaces} />
      ) : filteredWorkSpaces.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No Work Spaces found"
          description="Create a standalone Work Space or open a Product to ensure its connected space."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              Create Standalone Work Space
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {WORK_SPACE_GROUPS.map((group) => (
            <section key={group.key} className="space-y-3">
              <div>
                <h2 className="text-foreground text-base font-semibold">{group.title}</h2>
                <p className="text-muted-foreground text-sm">{group.description}</p>
              </div>
              {groups[group.key].length === 0 ? (
                <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                  No matching spaces in this group.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {groups[group.key].map((workspace) => (
                    <WorkSpaceCard key={workspace.id} workspace={workspace} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <CreateStandaloneWorkSpaceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}

function SummaryCards({ summary }: { summary: ReturnType<typeof summarizeWorkSpaces> }) {
  const cards = [
    { label: 'Total', value: summary.total },
    { label: 'Standalone', value: summary.standalone },
    { label: 'Product Delivery', value: summary.product },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label} size="sm">
          <CardContent>
            <p className="text-muted-foreground text-xs">{card.label}</p>
            <p className="text-foreground mt-1 text-2xl font-semibold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
