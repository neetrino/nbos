'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { KanbanBoard } from '@/components/shared';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import {
  buildTerminalDropZonesFromBoard,
  shouldShowTerminalDropBar,
} from '@/features/shared/kanban-terminal-drop';
import { TASK_BOARD_STAGES } from '@/features/tasks/constants/task-board-lifecycle';
import { isTaskStatusValue } from '@/features/tasks/constants/tasks';
import {
  TaskMiniCard,
  TaskListTableView,
  buildDeadlineKanbanColumns,
  buildMyPlanColumns,
  buildWorkspaceKanbanColumns,
} from '@/features/tasks/task-board';
import type { Task, TaskBoardStage } from '@/lib/api/tasks';
import type { TasksListBoardView } from '@/features/tasks/tasks-list-types';
import { createTaskKanbanQuickCreateConfig } from '@/features/tasks/kanban/tasks-kanban-quick-create';

export type TasksListKanbanViewsProps = {
  boardView: TasksListBoardView;
  boardScope: BoardLifecycleScope;
  tasks: Task[];
  myPlanStages: TaskBoardStage[];
  onTaskAction: (taskId: string, action: 'start' | 'complete' | 'reopen') => void;
  onTaskDueDateChange: (taskId: string, dueDate: string) => void | Promise<void>;
  onTaskClick: (task: Task) => void;
  onKanbanMove: (taskId: string, from: string, toColumn: string) => void;
  onKanbanReorder: (taskId: string, columnKey: string, toIndex: number) => void;
  onMyPlanMove: (taskId: string, from: string, toStageId: string) => void;
  onMyPlanReorder: (taskId: string, columnKey: string, toIndex: number) => void;
  onDeadlineMove: (taskId: string, from: string, toColumnKey: string) => void;
  onDeadlineReorder: (taskId: string, columnKey: string, toIndex: number) => void;
  onAddTaskInColumn: (columnKey: string) => void;
  onAddMyPlanStage: (title: string, color: string) => void;
  onRenameMyPlanStage: (columnKey: string, newTitle: string, newColor: string) => void;
  onDeleteMyPlanStage: (columnKey: string) => void;
};

export function TasksListKanbanViews({
  boardView,
  boardScope,
  tasks,
  myPlanStages,
  onTaskAction,
  onTaskDueDateChange,
  onTaskClick,
  onKanbanMove,
  onKanbanReorder,
  onMyPlanMove,
  onMyPlanReorder,
  onDeadlineMove,
  onDeadlineReorder,
  onAddTaskInColumn,
  onAddMyPlanStage,
  onRenameMyPlanStage,
  onDeleteMyPlanStage,
}: TasksListKanbanViewsProps) {
  const t = useTranslations('tasks');
  const taskTerminalDropZones = useMemo(
    () =>
      buildTerminalDropZonesFromBoard(TASK_BOARD_STAGES, {
        COMPLETED: t('status.COMPLETED'),
      }),
    [t],
  );
  const taskQuickCreate = useMemo(
    () => createTaskKanbanQuickCreateConfig(onAddTaskInColumn, t('kanban.quick')),
    [onAddTaskInColumn, t],
  );
  const deadlineColumns = useMemo(
    () => buildDeadlineKanbanColumns(tasks, boardScope, (key) => t(`deadline.${key}`)),
    [boardScope, t, tasks],
  );
  const workspaceColumns = useMemo(
    () =>
      buildWorkspaceKanbanColumns(tasks, boardScope, (status) =>
        isTaskStatusValue(status) ? t(`status.${status}`) : status,
      ),
    [boardScope, t, tasks],
  );
  const myPlanColumns = useMemo(
    () => buildMyPlanColumns(tasks, myPlanStages, t('kanban.unassigned')),
    [myPlanStages, t, tasks],
  );

  const renderCard = (task: Task) => (
    <TaskMiniCard
      task={task}
      onAction={onTaskAction}
      onDueDateChange={onTaskDueDateChange}
      onClick={onTaskClick}
    />
  );

  if (boardView === 'list') {
    return (
      <div className="min-h-0 flex-1 overflow-auto">
        <TaskListTableView tasks={tasks} boardScope={boardScope} onRowClick={onTaskClick} />
      </div>
    );
  }

  if (boardView === 'deadline') {
    return (
      <div className="min-h-0 flex-1">
        <KanbanBoard
          columns={deadlineColumns}
          renderCard={renderCard}
          getItemId={(t) => t.id}
          onMove={onDeadlineMove}
          onReorderWithinColumn={onDeadlineReorder}
          columnQuickCreate={taskQuickCreate}
          columnWidth={240}
          emptyMessage={t('kanban.empty')}
        />
      </div>
    );
  }

  if (boardView === 'kanban') {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="min-h-0 flex-1">
          <KanbanBoard
            columns={workspaceColumns}
            columnWidth={boardScope === 'CLOSED' ? 288 : 270}
            renderCard={renderCard}
            getItemId={(t) => t.id}
            onMove={onKanbanMove}
            onReorderWithinColumn={onKanbanReorder}
            columnQuickCreate={taskQuickCreate}
            emptyMessage={t('kanban.empty')}
            terminalDropZones={
              shouldShowTerminalDropBar(boardScope) ? taskTerminalDropZones : undefined
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1">
      <KanbanBoard
        columns={myPlanColumns}
        renderCard={renderCard}
        getItemId={(t) => t.id}
        onMove={onMyPlanMove}
        onReorderWithinColumn={onMyPlanReorder}
        onAddColumn={onAddMyPlanStage}
        onRenameColumn={onRenameMyPlanStage}
        onDeleteColumn={onDeleteMyPlanStage}
        columnQuickCreate={taskQuickCreate}
        columnWidth={270}
        emptyMessage={t('kanban.empty')}
      />
    </div>
  );
}
