import { ApiError } from '@/lib/api-errors';
import { tasksApi, type Task, type WorkSpace } from '@/lib/api/tasks';
import { workSpaceSprintsApi, type WorkSpaceSprint } from '@/lib/api/work-space-sprints';
import { mergeProductWorkSpaceTasks } from '@/features/tasks/work-spaces/work-space-utils';

export type ProductWorkSpaceTabData = {
  workspace: WorkSpace;
  tasks: Task[];
  sprints: WorkSpaceSprint[];
};

export const productWorkSpaceQueryKeys = {
  tab: (productId: string) => ['work-space', 'product', productId, 'tab'] as const,
};

async function loadProductWorkSpace(productId: string): Promise<WorkSpace> {
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
): Promise<ProductWorkSpaceTabData> {
  const workspace = await loadProductWorkSpace(productId);
  const [workspaceTasks, linkedTasks] = await Promise.all([
    tasksApi.getAll({ workspaceId: workspace.id, pageSize: 100 }),
    tasksApi.getByEntity('PRODUCT', productId),
  ]);
  const tasks = mergeProductWorkSpaceTasks(workspaceTasks.items, linkedTasks);
  const sprints = workspace.scrumEnabled ? await workSpaceSprintsApi.list(workspace.id) : [];
  return { workspace, tasks, sprints };
}
