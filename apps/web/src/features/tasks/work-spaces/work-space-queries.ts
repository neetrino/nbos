import type { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-errors';
import { tasksApi, type Task, type WorkSpace } from '@/lib/api/tasks';
import { workSpaceSprintsApi, type WorkSpaceSprint } from '@/lib/api/work-space-sprints';
import { mergeProductWorkSpaceTasks } from '@/features/tasks/work-spaces/work-space-utils';
import {
  appendUniqueTasks,
  fetchLinkedProductTasks,
  fetchWorkspaceSprints,
  fetchWorkspaceTaskPage,
  type TaskListMeta,
} from '@/features/tasks/work-spaces/work-space-task-fetch';

export type { TaskListMeta };

export type WorkSpaceTabData = {
  workspace: WorkSpace;
  tasks: Task[];
  taskMeta: TaskListMeta;
  sprints: WorkSpaceSprint[];
};

export const workSpaceQueryKeys = {
  productTab: (productId: string) => ['work-space', 'product', productId, 'tab'] as const,
  detail: (workspaceId: string) => ['work-space', 'detail', workspaceId] as const,
};

export const productWorkSpaceQueryKeys = {
  tab: workSpaceQueryKeys.productTab,
};

export function invalidateWorkSpaceTaskQueries(
  queryClient: QueryClient,
  scope: { workspaceId: string; productId?: string | null },
): void {
  void queryClient.invalidateQueries({ queryKey: workSpaceQueryKeys.detail(scope.workspaceId) });
  if (scope.productId) {
    void queryClient.invalidateQueries({
      queryKey: workSpaceQueryKeys.productTab(scope.productId),
    });
  }
}

async function loadProductWorkSpace(
  productId: string,
  knownWorkSpaceId?: string | null,
): Promise<WorkSpace> {
  if (knownWorkSpaceId) {
    try {
      const workspace = await tasksApi.getWorkSpaceById(knownWorkSpaceId);
      if (workspace.productId === productId) return workspace;
    } catch {
      /* fall through to by-product lookup */
    }
  }

  try {
    return await tasksApi.getWorkSpaceByProductId(productId);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return tasksApi.ensureProductWorkSpace(productId);
    }
    throw error;
  }
}

/** Workspace + merged tasks + sprints for the product Work Space tab. */
export async function fetchProductWorkSpaceTabData(
  productId: string,
  knownWorkSpaceId?: string | null,
): Promise<WorkSpaceTabData> {
  const workspace = await loadProductWorkSpace(productId, knownWorkSpaceId);
  const [workspaceTasks, linkedTasks] = await Promise.all([
    fetchWorkspaceTaskPage(workspace.id),
    fetchLinkedProductTasks(productId),
  ]);
  const tasks = mergeProductWorkSpaceTasks(workspaceTasks.items, linkedTasks);
  const sprints = await fetchWorkspaceSprints(workspace);
  return { workspace, tasks, taskMeta: workspaceTasks.meta, sprints };
}

/** Workspace + tasks + sprints for standalone `/work-spaces/[id]`. */
export async function fetchWorkSpaceDetailData(workspaceId: string): Promise<WorkSpaceTabData> {
  const workspace = await tasksApi.getWorkSpaceById(workspaceId);
  const [taskData, sprints] = await Promise.all([
    fetchWorkspaceTaskPage(workspaceId),
    fetchWorkspaceSprints(workspace),
  ]);
  return { workspace, tasks: taskData.items, taskMeta: taskData.meta, sprints };
}

/** Appends the next workspace task page; legacy linked tasks stay from the initial load. */
export async function fetchMoreWorkSpaceTabTasks(
  data: WorkSpaceTabData,
): Promise<Pick<WorkSpaceTabData, 'tasks' | 'taskMeta'>> {
  const nextPage = data.taskMeta.page + 1;
  if (nextPage > data.taskMeta.totalPages) {
    return { tasks: data.tasks, taskMeta: data.taskMeta };
  }

  const workspaceTasks = await fetchWorkspaceTaskPage(data.workspace.id, nextPage);
  return {
    tasks: appendUniqueTasks(data.tasks, workspaceTasks.items),
    taskMeta: workspaceTasks.meta,
  };
}
