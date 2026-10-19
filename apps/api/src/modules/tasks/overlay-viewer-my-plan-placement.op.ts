import type { TasksDbClient } from './tasks-db-client';

export type TaskMyPlanPlacementFields = {
  myPlanStageId: string | null;
  myPlanSortOrder: number;
};

const EMPTY_VIEWER_PLACEMENT: TaskMyPlanPlacementFields = {
  myPlanStageId: null,
  myPlanSortOrder: 0,
};

type TaskWithId = { id: string };

/**
 * Replaces legacy task-level My Plan fields with the viewer's personal slot.
 * Missing viewer or missing row reads as Unassigned.
 */
export async function overlayViewerMyPlanPlacement<T extends TaskWithId>(
  db: TasksDbClient,
  tasks: T[],
  employeeId?: string,
): Promise<Array<T & TaskMyPlanPlacementFields>> {
  if (tasks.length === 0) {
    return tasks as Array<T & TaskMyPlanPlacementFields>;
  }

  const viewerId = employeeId?.trim();
  if (!viewerId) {
    for (const task of tasks) {
      Object.assign(task, EMPTY_VIEWER_PLACEMENT);
    }
    return tasks as Array<T & TaskMyPlanPlacementFields>;
  }

  const rows = await db.taskMyPlanPlacement.findMany({
    where: { employeeId: viewerId, taskId: { in: tasks.map((task) => task.id) } },
    select: { taskId: true, stageId: true, sortOrder: true },
  });
  const byTaskId = new Map(rows.map((row) => [row.taskId, row]));

  for (const task of tasks) {
    const row = byTaskId.get(task.id);
    Object.assign(task, {
      myPlanStageId: row?.stageId ?? null,
      myPlanSortOrder: row?.sortOrder ?? 0,
    });
  }

  return tasks as Array<T & TaskMyPlanPlacementFields>;
}
