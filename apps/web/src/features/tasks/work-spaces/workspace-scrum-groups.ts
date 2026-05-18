import type { Task } from '@/lib/api/tasks';
import type { WorkSpaceSprint } from '@/lib/api/work-space-sprints';

export function getActiveSprintId(sprints: WorkSpaceSprint[]): string | null {
  return sprints.find((s) => s.status === 'ACTIVE')?.id ?? null;
}

export function groupTasksForScrumPlanner(tasks: Task[], sprints: WorkSpaceSprint[]) {
  const backlog = tasks.filter((t) => !t.sprintId);
  const bySprint = new Map<string, Task[]>();
  for (const sprint of sprints) {
    bySprint.set(
      sprint.id,
      tasks.filter((t) => t.sprintId === sprint.id),
    );
  }
  return {
    backlog,
    planning: sprints.filter((s) => s.status === 'PLANNING'),
    active: sprints.find((s) => s.status === 'ACTIVE') ?? null,
    closed: sprints.filter((s) => s.status === 'CLOSED'),
    bySprint,
  };
}

export function sprintCompletionPercent(sprintTasks: Task[]): number {
  if (sprintTasks.length === 0) return 0;
  const done = sprintTasks.filter((t) => t.status === 'COMPLETED').length;
  return Math.round((done / sprintTasks.length) * 100);
}
