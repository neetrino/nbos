'use client';

import Link from 'next/link';
import { Plus, RefreshCcw, CheckSquare, FolderKanban, TableProperties } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  PageHeader,
  FilterBar,
  EmptyState,
  ErrorState,
  LoadingState,
  SegmentedControl,
} from '@/components/shared';
import { TASKS_BOARD_VIEW_SEGMENTS } from '@/features/tasks/tasks-board-view-segments';
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
    creatorId,
    creatorReady,
    selectedTaskId,
    handleTaskUpdate,
    handleTaskCreated,
    renderBoard,
  } = useTasksListPage();

  const newTaskDisabled = creatorReady && !creatorId;

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
          <SegmentedControl
            value={boardView}
            onValueChange={setBoardView}
            items={TASKS_BOARD_VIEW_SEGMENTS}
          />
          <Button
            onClick={() => setQuickCreateOpen(true)}
            disabled={newTaskDisabled}
            title={newTaskDisabled ? 'Employee profile required' : undefined}
          >
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
      ) : tasks.length === 0 && boardView !== 'list' ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Create your first task to get started"
          action={
            <Button onClick={() => setQuickCreateOpen(true)} disabled={newTaskDisabled}>
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
        creatorId={creatorId ?? ''}
        creatorReady={creatorReady}
        defaultDueDate={defaultCreateDueDate}
        onCreated={handleTaskCreated}
      />
    </div>
  );
}
