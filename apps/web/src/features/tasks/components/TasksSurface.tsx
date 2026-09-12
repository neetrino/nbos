'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Plus, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OpenMyAccountButton } from '@/features/account/components/open-my-account-button';
import {
  PageHero,
  ViewModeSwitch,
  IntegratedSearchFilters,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/shared';
import { TasksWorkflowScopeBanner } from '@/features/tasks/components/TasksWorkflowScopeBanner';
import { useTasksListPage } from '@/features/tasks/use-tasks-list-page';
import { DEFAULT_BOARD_LIFECYCLE_SCOPE } from '@/features/shared/board-lifecycle';
import { TaskSheet } from '@/features/tasks/components/TaskSheet';
import { QuickCreateTaskDialog } from '@/features/tasks/components/QuickCreateTaskDialog';
import { ClientsDirectoryTrashBanner } from '@/features/clients/components/clients-directory-trash-banner';
import { TasksPageSettingsSheet } from '@/features/tasks/components/TasksPageSettingsSheet';
import { TaskListLoadMoreBanner } from '@/features/tasks/components/TaskListLoadMoreBanner';
import type { TasksListBoardView } from '@/features/tasks/tasks-list-types';
import { buildTasksListViewOptions } from '@/features/tasks/tasks-list-view-options';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { useTranslations } from 'next-intl';

export interface TasksSurfaceProps {
  hostedCreateDialog?: boolean;
  onRequestCreate?: () => void;
  onListSettled?: () => void;
}

export function TasksSurface({
  hostedCreateDialog = true,
  onRequestCreate,
  onListSettled,
}: TasksSurfaceProps) {
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
    setQuickCreateColumnKey,
    creatorId,
    creatorReady,
    selectedTaskId,
    initialTask,
    handleTaskUpdate,
    handleTaskDelete,
    handleTaskRestore,
    listScope,
    setListScope,
    isTrashView,
    handleTaskCreated,
    taskMeta,
    loadMoreTasks,
    loadingMore,
    renderBoard,
  } = useTasksListPage();
  const listSettledRef = useRef(false);
  useEffect(() => {
    if (loading || listSettledRef.current) {
      return;
    }
    listSettledRef.current = true;
    onListSettled?.();
  }, [loading, onListSettled]);
  const t = useTranslations('tasks');
  const isMobileViewport = useIsMobileViewport();
  const tasksViewOptions = useMemo(() => buildTasksListViewOptions(t), [t]);
  const newTaskDisabled = creatorReady && !creatorId;
  const showDesktopBoardChrome = !isMobileViewport && !isTrashView;
  const displayBoardView: TasksListBoardView = isTrashView
    ? 'list'
    : isMobileViewport
      ? 'kanban'
      : boardView;

  const openCreate = () => {
    if (hostedCreateDialog) {
      setQuickCreateOpen(true);
      return;
    }
    onRequestCreate?.();
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHero
        title={t('pageTitle')}
        search={
          <IntegratedSearchFilters
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t('searchPlaceholder')}
            filters={showDesktopBoardChrome ? filterConfigs : undefined}
            filterValues={
              showDesktopBoardChrome
                ? {
                    boardScope: filters.boardScope ?? DEFAULT_BOARD_LIFECYCLE_SCOPE,
                    ...filters,
                  }
                : undefined
            }
            onFilterChange={showDesktopBoardChrome ? handleFilterChange : undefined}
            onClearAll={showDesktopBoardChrome ? handleClearFilters : undefined}
          />
        }
        viewMode={
          showDesktopBoardChrome ? (
            <ViewModeSwitch value={boardView} onChange={setBoardView} options={tasksViewOptions} />
          ) : null
        }
        trailing={
          <>
            <TasksPageSettingsSheet
              listScope={listScope}
              onListScopeChange={setListScope}
              exportDisabled={loading || !stats}
              onExportScopeStatsCsv={handleExportScopeStatsCsv}
            />
            <Button
              onClick={openCreate}
              disabled={newTaskDisabled || isTrashView}
              title={
                isTrashView
                  ? t('newTaskTrashTitle')
                  : newTaskDisabled
                    ? t('employeeProfileRequired')
                    : undefined
              }
            >
              <Plus size={16} aria-hidden />
              {t('newTask')}
            </Button>
          </>
        }
      />

      {isTrashView ? (
        <ClientsDirectoryTrashBanner
          entityLabel="tasks"
          message={t('trash.viewing')}
          backLabel={t('trash.backToActive')}
          onBackToActive={() => setListScope('active')}
        />
      ) : (
        <TasksWorkflowScopeBanner scope={boardScope} />
      )}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchTasks} />
      ) : creatorReady && !creatorId ? (
        <EmptyState
          icon={CheckSquare}
          title={t('empty.profileTitle')}
          description={t('empty.profileDescription')}
          action={<OpenMyAccountButton>{t('empty.openMyAccount')}</OpenMyAccountButton>}
        />
      ) : displayTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={isTrashView ? t('empty.trashEmpty') : t('empty.noTasks')}
          description={
            isTrashView ? t('empty.trashEmptyDescription') : t('empty.noTasksDescription')
          }
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-1">
          {renderBoard(displayBoardView)}
          {taskMeta ? (
            <TaskListLoadMoreBanner
              loadedCount={displayTasks.length}
              totalCount={taskMeta.total}
              onLoadMore={() => void loadMoreTasks()}
              loading={loadingMore}
              hasMorePages={taskMeta.page < taskMeta.totalPages}
            />
          ) : null}
        </div>
      )}

      <TaskSheet
        taskId={selectedTaskId}
        initialTask={initialTask}
        open={sheetOpen}
        onOpenChange={handleTaskSheetOpenChange}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
        onRestore={handleTaskRestore}
        isTrashView={isTrashView}
      />

      {hostedCreateDialog ? (
        <QuickCreateTaskDialog
          open={quickCreateOpen}
          onOpenChange={(nextOpen) => {
            setQuickCreateOpen(nextOpen);
            if (!nextOpen) {
              setDefaultCreateDueDate(null);
              setQuickCreateColumnKey(null);
            }
          }}
          creatorId={creatorId ?? ''}
          creatorReady={creatorReady}
          defaultDueDate={defaultCreateDueDate}
          onCreated={handleTaskCreated}
        />
      ) : null}
    </div>
  );
}
