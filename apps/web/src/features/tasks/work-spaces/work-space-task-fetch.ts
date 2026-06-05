import { tasksApi, type Task, type WorkSpace } from '@/lib/api/tasks';
import { workSpaceSprintsApi, type WorkSpaceSprint } from '@/lib/api/work-space-sprints';
import { TASK_LIST_PAGE_SIZE } from '@/features/tasks/constants/task-list-pagination';

export type TaskListMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const WORKSPACE_TASK_LIST_PARAMS = {
  pageSize: TASK_LIST_PAGE_SIZE,
  sortBy: 'workspaceSortOrder',
  sortOrder: 'asc' as const,
};

export function fetchWorkspaceTaskPage(workspaceId: string, page = 1) {
  return tasksApi.getAll({
    workspaceId,
    page,
    ...WORKSPACE_TASK_LIST_PARAMS,
  });
}

export function appendUniqueTasks(current: Task[], incoming: Task[]): Task[] {
  const seen = new Set(current.map((task) => task.id));
  const appended = incoming.filter((task) => !seen.has(task.id));
  return appended.length > 0 ? [...current, ...appended] : current;
}

export async function fetchLinkedProductTasks(productId: string): Promise<Task[]> {
  const resp = await tasksApi.getAll({
    entityType: 'PRODUCT',
    entityId: productId,
    pageSize: TASK_LIST_PAGE_SIZE,
  });
  return resp.items;
}

export async function fetchWorkspaceSprints(workspace: WorkSpace): Promise<WorkSpaceSprint[]> {
  if (!workspace.scrumEnabled) return [];
  return workSpaceSprintsApi.list(workspace.id);
}
