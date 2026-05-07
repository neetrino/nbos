'use client';

import { KanbanBoard } from '@/components/shared';
import {
  DEADLINE_COLUMNS_DEF,
  getDeadlineColumn,
  TaskMiniCard,
  buildMyPlanColumns,
  buildTasksPageKanbanColumns,
} from '@/features/tasks/task-board';
import type { Task, TaskBoardStage } from '@/lib/api/tasks';
import type { TasksListBoardView } from '@/features/tasks/tasks-list-types';

export type TasksListKanbanViewsProps = {
  boardView: TasksListBoardView;
  tasks: Task[];
  kanbanStages: TaskBoardStage[];
  myPlanStages: TaskBoardStage[];
  onTaskAction: (taskId: string, action: 'start' | 'complete' | 'reopen') => void;
  onTaskClick: (task: Task) => void;
  onKanbanMove: (taskId: string, from: string, toColumn: string) => void;
  onMyPlanMove: (taskId: string, from: string, toStageId: string) => void;
  onDeadlineMove: (taskId: string, from: string, toColumnKey: string) => void;
  onAddTaskInColumn: (columnKey: string) => void;
  onAddMyPlanStage: (title: string, color: string) => void;
  onRenameMyPlanStage: (columnKey: string, newTitle: string, newColor: string) => void;
  onDeleteMyPlanStage: (columnKey: string) => void;
};

export function TasksListKanbanViews({
  boardView,
  tasks,
  kanbanStages,
  myPlanStages,
  onTaskAction,
  onTaskClick,
  onKanbanMove,
  onMyPlanMove,
  onDeadlineMove,
  onAddTaskInColumn,
  onAddMyPlanStage,
  onRenameMyPlanStage,
  onDeleteMyPlanStage,
}: TasksListKanbanViewsProps) {
  const buildDeadlineColumns = () =>
    DEADLINE_COLUMNS_DEF.map((col) => ({
      key: col.key,
      label: col.label,
      color: col.color,
      hexColor: col.hexColor,
      items: tasks.filter((t) => getDeadlineColumn(t) === col.key),
    }));

  const renderCard = (task: Task) => (
    <TaskMiniCard task={task} onAction={onTaskAction} onClick={onTaskClick} />
  );

  if (boardView === 'deadline') {
    return (
      <div className="min-h-0 flex-1">
        <KanbanBoard
          columns={buildDeadlineColumns()}
          renderCard={renderCard}
          getItemId={(t) => t.id}
          onMove={onDeadlineMove}
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
      <div className="min-h-0 flex-1">
        <KanbanBoard
          columns={buildTasksPageKanbanColumns(tasks, kanbanStages)}
          renderCard={renderCard}
          getItemId={(t) => t.id}
          onMove={onKanbanMove}
          onAddItemInColumn={onAddTaskInColumn}
          addButtonLabel="Quick"
          columnWidth={270}
          emptyMessage="No tasks"
        />
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
