'use client';

import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { Task } from '@/lib/api/tasks';
import { subscribeTaskCreated } from './task-created-sync';

export function prependCreatedTask(prev: Task[], task: Task): Task[] {
  return [task, ...prev.filter((item) => item.id !== task.id)];
}

/** Keeps an open Tasks list in sync when a task is created from the sidebar plus. */
export function usePrependExternallyCreatedTask(setTasks: Dispatch<SetStateAction<Task[]>>): void {
  useEffect(() => {
    return subscribeTaskCreated((task) => {
      setTasks((prev) => prependCreatedTask(prev, task));
    });
  }, [setTasks]);
}
