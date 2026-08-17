import type { Task } from '@/lib/api/tasks';

/** True when the employee is marked on the task (any status). Project team alone is not enough. */
export function taskInvolvesEmployee(task: Task, employeeId: string): boolean {
  if (task.assignee?.id === employeeId) return true;
  if (task.creator.id === employeeId) return true;
  if (task.reviewer?.id === employeeId) return true;
  if (task.coAssignees.includes(employeeId)) return true;
  if (task.observers.includes(employeeId)) return true;
  return false;
}
