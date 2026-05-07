'use client';

import { Clock, LayoutGrid, List, User } from 'lucide-react';

import type { SegmentedControlItem } from '@/components/shared';
import type { TasksListBoardView } from '@/features/tasks/tasks-list-types';

/** Shared Deadline / My Plan / Board / List segments for Tasks page and workspace runtime. */
export const TASKS_BOARD_VIEW_SEGMENTS: SegmentedControlItem<TasksListBoardView>[] = [
  { value: 'deadline', label: 'Deadline', icon: <Clock size={14} /> },
  { value: 'my-plan', label: 'My Plan', icon: <User size={14} /> },
  { value: 'kanban', label: 'Board', icon: <LayoutGrid size={14} /> },
  { value: 'list', label: 'List', icon: <List size={14} /> },
];
