'use client';

import { Clock, LayoutGrid, List, User } from 'lucide-react';
import type { ReactNode } from 'react';

import type { ViewModeOption } from '@/components/shared';
import type { TasksListBoardView } from '@/features/tasks/tasks-list-types';
import type { WorkspaceBoardView } from '@/features/tasks/work-spaces/use-workspace-runtime-board';

/** Shared Deadline / My Plan / Board / List segments for Tasks page and workspace runtime. */
export type TasksBoardViewSegment<T extends string> = {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  ariaLabel?: string;
};

export const TASKS_BOARD_VIEW_SEGMENTS: TasksBoardViewSegment<TasksListBoardView>[] = [
  { value: 'deadline', label: 'Deadline', icon: <Clock size={14} /> },
  {
    value: 'my-plan',
    label: 'My Plan',
    icon: <User size={14} />,
    ariaLabel: 'My Plan',
  },
  { value: 'kanban', label: 'Board', icon: <LayoutGrid size={14} /> },
  { value: 'list', label: 'List', icon: <List size={14} /> },
];

/** Same views as global Tasks, but personal plan tab is scoped to the current work space in UI copy. */
export const TASKS_WORKSPACE_BOARD_VIEW_SEGMENTS: TasksBoardViewSegment<TasksListBoardView>[] = [
  { value: 'deadline', label: 'Deadline', icon: <Clock size={14} /> },
  {
    value: 'my-plan',
    label: 'Workspace Plan',
    icon: <User size={14} />,
    ariaLabel: 'Workspace Plan',
  },
  { value: 'kanban', label: 'Board', icon: <LayoutGrid size={14} /> },
  { value: 'list', label: 'List', icon: <List size={14} /> },
];

/** Active-area views for work spaces (Planning is a separate workspace area when Scrum is on). */
export function getWorkspaceBoardViewSegments(
  _scrumEnabled = false,
): TasksBoardViewSegment<TasksListBoardView>[] {
  return TASKS_WORKSPACE_BOARD_VIEW_SEGMENTS;
}

export const WORKSPACE_BOARD_VIEW_OPTIONS: ViewModeOption<WorkspaceBoardView>[] =
  TASKS_WORKSPACE_BOARD_VIEW_SEGMENTS.map((segment) => ({
    value: segment.value,
    label: typeof segment.label === 'string' ? segment.label : String(segment.value),
    icon: segment.icon,
    ariaLabel: segment.ariaLabel,
  }));
