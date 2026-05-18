'use client';

import Link from 'next/link';
import { Plus, CheckSquare, FolderKanban } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { PageHeader, FilterBar, EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TASKS_BOARD_VIEW_SEGMENTS } from '@/features/tasks/tasks-board-view-segments';
import { useTasksListPage } from '@/features/tasks/use-tasks-list-page';
import { TaskSheet } from '@/features/tasks/components/TaskSheet';
import { QuickCreateTaskDialog } from '@/features/tasks/components/QuickCreateTaskDialog';
import { TasksPageSettingsDialog } from '@/features/tasks/components/TasksPageSettingsDialog';

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
    handleTaskSheetOpenChange,
    quickCreateOpen,
    setQuickCreateOpen,
    defaultCreateDueDate,
    setDefaultCreateDueDate,
    creatorId,
    creatorReady,
    selectedTaskId,
    handleTaskUpdate,
    handleTaskDelete,
    handleTaskCreated,
    renderBoard,
  } = useTasksListPage();

  const newTaskDisabled = creatorReady && !creatorId;

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="shrink-0">
        <PageHeader title="Tasks" description={`${tasks.length} tasks`}>
          <Link href="/work-spaces" className={buttonVariants({ variant: 'outline' })}>
            <FolderKanban size={16} />
            Work Spaces
          </Link>
          <Link href="/tasks/recurring" className={buttonVariants({ variant: 'outline' })}>
            Recurring
          </Link>
          <TasksPageSettingsDialog
            exportDisabled={loading || !stats}
            onExportScopeStatsCsv={handleExportScopeStatsCsv}
          />
          <Tabs
            value={boardView}
            onValueChange={(value) => setBoardView(value as typeof boardView)}
          >
            <TabsList variant="segmented">
              {TASKS_BOARD_VIEW_SEGMENTS.map((segment) => (
                <TabsTrigger
                  key={segment.value}
                  value={segment.value}
                  aria-label={segment.ariaLabel}
                  className="gap-1.5 px-3 py-2"
                >
                  {segment.icon}
                  {segment.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
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
          searchPlaceholder="Search by task, project, product, workspace…"
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
      ) : creatorReady && !creatorId ? (
        <EmptyState
          icon={CheckSquare}
          title="Employee profile required"
          description="Complete your employee profile to load tasks you participate in and use My Plan."
          action={
            <Link href="/my-account" className={buttonVariants({ variant: 'default' })}>
              Open My Account
            </Link>
          }
        />
      ) : (
        renderBoard()
      )}

      <TaskSheet
        taskId={selectedTaskId}
        open={sheetOpen}
        onOpenChange={handleTaskSheetOpenChange}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
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
