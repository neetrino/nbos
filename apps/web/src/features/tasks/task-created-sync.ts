import type { Task } from '@/lib/api/tasks';

export const TASK_CREATED_EVENT = 'nbos:task-created';

export type TaskCreatedDetail = {
  task: Task;
};

/** Notify open Tasks views that a task was created elsewhere (e.g. sidebar plus). */
export function dispatchTaskCreated(task: Task): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<TaskCreatedDetail>(TASK_CREATED_EVENT, {
      detail: { task },
    }),
  );
}

/** Subscribe to tasks created outside the current Tasks page instance. */
export function subscribeTaskCreated(listener: (task: Task) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const handler = (event: Event) => {
    const custom = event as CustomEvent<TaskCreatedDetail>;
    const task = custom.detail?.task;
    if (task) listener(task);
  };

  window.addEventListener(TASK_CREATED_EVENT, handler);
  return () => window.removeEventListener(TASK_CREATED_EVENT, handler);
}
