'use client';

import { Clock, LayoutGrid, List, User } from 'lucide-react';
import type { ReactNode } from 'react';

import type { TasksListBoardView } from '@/features/tasks/tasks-list-types';

/** Shared Deadline / My Plan / Board / List segments for Tasks page and workspace runtime. */
export type TasksBoardViewSegment<T extends string> = {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  ariaLabel?: string;
};

export const TASKS_BOARD_VIEW_SEGMENTS: TasksBoardViewSegment<TasksListBoardView>[] = [
  { value: 'deadline', label: 'Deadline', icon: <Clock size={14} /> },
  { value: 'my-plan', label: 'My Plan', icon: <User size={14} /> },
  { value: 'kanban', label: 'Board', icon: <LayoutGrid size={14} /> },
  { value: 'list', label: 'List', icon: <List size={14} /> },
];
