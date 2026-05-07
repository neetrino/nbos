import type { Task, WorkSpace } from '@/lib/api/tasks';

export function buildWorkSpacesCsvRows(items: WorkSpace[]): string[][] {
  const header = ['Name', 'Type', 'Scrum', 'Project', 'Product', 'Id'];
  const rows = items.map((w) => [
    w.name,
    w.type,
    w.scrumEnabled ? 'yes' : 'no',
    w.project?.name ?? '',
    w.product?.name ?? '',
    w.id,
  ]);
  return [header, ...rows];
}

export function buildWorkspaceTasksCsvRows(tasks: Task[]): string[][] {
  const header = ['Code', 'Title', 'Status', 'Priority', 'Due date', 'Assignee'];
  const rows = tasks.map((t) => [
    t.code,
    t.title,
    t.status,
    t.priority,
    t.dueDate ?? '',
    t.assignee != null ? `${t.assignee.firstName} ${t.assignee.lastName}` : '',
  ]);
  return [header, ...rows];
}
