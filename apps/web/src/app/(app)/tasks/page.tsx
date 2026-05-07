'use client';

import Link from 'next/link';
import {
  Plus,
  RefreshCcw,
  CheckSquare,
  Clock,
  User,
  LayoutGrid,
  FolderKanban,
  TableProperties,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { PageHeader, FilterBar, EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { useTasksListPage } from '@/features/tasks/use-tasks-list-page';
import { TaskSheet } from '@/features/tasks/components/TaskSheet';
import { QuickCreateTaskDialog } from '@/features/tasks/components/QuickCreateTaskDialog';

export default function TasksPage() {
  const {
    tasks,
    stats,
    loading,
    error,
    search,
    setSearch,
    filters,
    setFilters,
    boardView,
    setBoardView,
    fetchTasks,
    filterConfigs,
    handleExportScopeStatsCsv,
    sheetOpen,
    setSheetOpen,
    quickCreateOpen,
    setQuickCreateOpen,
    defaultCreateDueDate,
    setDefaultCreateDueDate,
    currentUserId,
    selectedTaskId,
    handleTaskUpdate,
    handleTaskCreated,
    renderBoard,
  } = useTasksListPage();

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="shrink-0">
        <PageHeader title="Tasks" description={`${tasks.length} tasks`}>
          <Button variant="outline" size="icon" onClick={fetchTasks} aria-label="Refresh tasks">
            <RefreshCcw size={16} />
          </Button>
          <Link href="/work-spaces" className={buttonVariants({ variant: 'outline' })}>
            <FolderKanban size={16} />
            Work Spaces
          </Link>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={loading || !stats}
            onClick={() => handleExportScopeStatsCsv()}
            aria-label="Export task scope statistics as CSV"
            title="UTF-8 CSV snapshot from GET /api/tasks/stats (workspace-wide; list filters not applied—see scope_note row)"
          >
            <TableProperties size={16} aria-hidden />
          </Button>
          <div className="border-border bg-muted/50 flex rounded-lg border p-0.5">
            <button
              type="button"
              onClick={() => setBoardView('deadline')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all',
                boardView === 'deadline'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Clock size={14} />
              Deadline
            </button>
            <button
              type="button"
              onClick={() => setBoardView('my-plan')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all',
                boardView === 'my-plan'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <User size={14} />
              My Plan
            </button>
            <button
              type="button"
              onClick={() => setBoardView('kanban')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all',
                boardView === 'kanban'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <LayoutGrid size={14} />
              Board
            </button>
          </div>
          <Button onClick={() => setQuickCreateOpen(true)}>
            <Plus size={16} />
            New Task
          </Button>
        </PageHeader>
      </div>

      <div className="shrink-0">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search tasks..."
          filters={filterConfigs}
          filterValues={filters}
          onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          onClearFilters={() => setFilters({})}
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchTasks} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Create your first task to get started"
          action={
            <Button onClick={() => setQuickCreateOpen(true)}>
              <Plus size={16} /> Create First Task
            </Button>
          }
        />
      ) : (
        renderBoard()
      )}

      <TaskSheet
        taskId={selectedTaskId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdate={handleTaskUpdate}
      />

      <QuickCreateTaskDialog
        open={quickCreateOpen}
        onOpenChange={(open) => {
          setQuickCreateOpen(open);
          if (!open) setDefaultCreateDueDate(null);
        }}
        creatorId={currentUserId}
        defaultDueDate={defaultCreateDueDate}
        onCreated={handleTaskCreated}
      />
    </div>
  );
}
