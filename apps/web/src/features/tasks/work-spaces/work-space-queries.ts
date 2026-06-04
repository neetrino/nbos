import type { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-errors';
import { tasksApi, type Task, type WorkSpace } from '@/lib/api/tasks';
import { workSpaceSprintsApi, type WorkSpaceSprint } from '@/lib/api/work-space-sprints';
import { mergeProductWorkSpaceTasks } from '@/features/tasks/work-spaces/work-space-utils';

export type WorkSpaceTabData = {
  workspace: WorkSpace;
  tasks: Task[];
  sprints: WorkSpaceSprint[];
};

/** @deprecated use `WorkSpaceTabData` */
export type ProductWorkSpaceTabData = WorkSpaceTabData;

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
    tasksApi.getAll({ workspaceId: workspace.id, pageSize: 100 }),
    tasksApi.getByEntity('PRODUCT', productId),
  ]);
  const tasks = mergeProductWorkSpaceTasks(workspaceTasks.items, linkedTasks);
  const sprints = workspace.scrumEnabled ? await workSpaceSprintsApi.list(workspace.id) : [];
  return { workspace, tasks, sprints };
}

/** Workspace + tasks + sprints for standalone `/work-spaces/[id]`. */
export async function fetchWorkSpaceDetailData(workspaceId: string): Promise<WorkSpaceTabData> {
  const workspace = await tasksApi.getWorkSpaceById(workspaceId);
  const [taskData, sprintData] = await Promise.all([
    tasksApi.getAll({ workspaceId, pageSize: 100 }),
    workspace.scrumEnabled
      ? workSpaceSprintsApi.list(workspaceId).catch(() => [] as WorkSpaceSprint[])
      : Promise.resolve([] as WorkSpaceSprint[]),
  ]);
  return { workspace, tasks: taskData.items, sprints: sprintData };
}
