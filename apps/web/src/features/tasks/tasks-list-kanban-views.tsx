'use client';

import { useMemo } from 'react';
import { KanbanBoard } from '@/components/shared';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import {
  buildTerminalDropZonesFromBoard,
  shouldShowTerminalDropBar,
} from '@/features/shared/kanban-terminal-drop';
import { TASK_BOARD_STAGES } from '@/features/tasks/constants/task-board-lifecycle';
import {
  TaskMiniCard,
  TaskListTableView,
  buildDeadlineKanbanColumns,
  buildMyPlanColumns,
  buildWorkspaceKanbanColumns,
} from '@/features/tasks/task-board';
import type { Task, TaskBoardStage } from '@/lib/api/tasks';
import type { TasksListBoardView } from '@/features/tasks/tasks-list-types';

export type TasksListKanbanViewsProps = {
  boardView: TasksListBoardView;
  boardScope: BoardLifecycleScope;
  tasks: Task[];
  myPlanStages: TaskBoardStage[];
  onTaskAction: (taskId: string, action: 'start' | 'complete' | 'reopen') => void;
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
  const taskTerminalDropZones = useMemo(
    () =>
      buildTerminalDropZonesFromBoard(TASK_BOARD_STAGES, {
        COMPLETED: 'Completed',
      }),
    [],
  );

  const renderCard = (task: Task) => (
    <TaskMiniCard task={task} onAction={onTaskAction} onClick={onTaskClick} />
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
          columns={buildDeadlineKanbanColumns(tasks, boardScope)}
          renderCard={renderCard}
          getItemId={(t) => t.id}
          onMove={onDeadlineMove}
          onReorderWithinColumn={onDeadlineReorder}
          onAddItemInColumn={onAddTaskInColumn}
          addButtonLabel="Quick"
          columnWidth={240}
          emptyMessage="No tasks"
        />
      </div>
    );
  }

  if (boardView === 'kanban') {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="min-h-0 flex-1">
          <KanbanBoard
            columns={buildWorkspaceKanbanColumns(tasks, boardScope)}
            columnWidth={boardScope === 'CLOSED' ? 288 : 270}
            renderCard={renderCard}
            getItemId={(t) => t.id}
            onMove={onKanbanMove}
            onReorderWithinColumn={onKanbanReorder}
            onAddItemInColumn={onAddTaskInColumn}
            addButtonLabel="Quick"
            emptyMessage="No tasks"
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
        columns={buildMyPlanColumns(tasks, myPlanStages)}
        renderCard={renderCard}
        getItemId={(t) => t.id}
        onMove={onMyPlanMove}
        onReorderWithinColumn={onMyPlanReorder}
        onAddColumn={onAddMyPlanStage}
        onRenameColumn={onRenameMyPlanStage}
        onDeleteColumn={onDeleteMyPlanStage}
        onAddItemInColumn={onAddTaskInColumn}
        addButtonLabel="Quick"
        columnWidth={270}
        emptyMessage="No tasks"
      />
    </div>
  );
}
