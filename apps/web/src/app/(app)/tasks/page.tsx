'use client';

import Link from 'next/link';
import { Plus, CheckSquare } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  PageHero,
  ViewModeSwitch,
  IntegratedSearchFilters,
  EmptyState,
  ErrorState,
  LoadingState,
  type ViewModeOption,
} from '@/components/shared';
import { TASKS_BOARD_VIEW_SEGMENTS } from '@/features/tasks/tasks-board-view-segments';
import { TasksWorkflowScopeBanner } from '@/features/tasks/components/TasksWorkflowScopeBanner';
import { useTasksListPage } from '@/features/tasks/use-tasks-list-page';
import { DEFAULT_BOARD_LIFECYCLE_SCOPE } from '@/features/shared/board-lifecycle';
import { TaskSheet } from '@/features/tasks/components/TaskSheet';
import { QuickCreateTaskDialog } from '@/features/tasks/components/QuickCreateTaskDialog';
import { TasksPageSettingsSheet } from '@/features/tasks/components/TasksPageSettingsSheet';
import type { TasksListBoardView } from '@/features/tasks/tasks-list-types';

const TASKS_VIEW_OPTIONS: ViewModeOption<TasksListBoardView>[] = TASKS_BOARD_VIEW_SEGMENTS.map(
  (segment) => ({
    value: segment.value,
    label: typeof segment.label === 'string' ? segment.label : String(segment.value),
    icon: segment.icon,
    ariaLabel: segment.ariaLabel,
  }),
);

export default function TasksPage() {
  const {
    stats,
    loading,
    error,
    search,
    setSearch,
    boardScope,
    displayTasks,
    filters,
    handleFilterChange,
    handleClearFilters,
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
      <PageHero
        title="Tasks"
        search={
          <IntegratedSearchFilters
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by task, project, product, workspace…"
            filters={filterConfigs}
            filterValues={{
              boardScope: filters.boardScope ?? DEFAULT_BOARD_LIFECYCLE_SCOPE,
              ...filters,
            }}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearFilters}
          />
        }
        viewMode={
          <ViewModeSwitch value={boardView} onChange={setBoardView} options={TASKS_VIEW_OPTIONS} />
        }
        trailing={
          <>
            <TasksPageSettingsSheet
              exportDisabled={loading || !stats}
              onExportScopeStatsCsv={handleExportScopeStatsCsv}
            />
            <Button
              onClick={() => setQuickCreateOpen(true)}
              disabled={newTaskDisabled}
              title={newTaskDisabled ? 'Employee profile required' : undefined}
            >
              <Plus size={16} aria-hidden />
              New Task
            </Button>
          </>
        }
      />

      <TasksWorkflowScopeBanner scope={boardScope} />

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
      ) : displayTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks in this view"
          description="Try another status scope or clear filters."
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
