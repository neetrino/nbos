import { attachTaskLinkDisplayNames } from './task-link-display-names.op';
import { overlayViewerMyPlanPlacement } from './overlay-viewer-my-plan-placement.op';
import type { TasksDbClient } from './tasks-db-client';

type PresentableTask = {
  id: string;
  links?: Array<{ entityType: string; entityId: string }> | null;
};

/** Attaches link labels and the viewer's personal My Plan slot. */
export async function presentTaskRecords(
  db: TasksDbClient,
  tasks: PresentableTask[],
  employeeId?: string,
): Promise<void> {
  await attachTaskLinkDisplayNames(db, tasks);
  await overlayViewerMyPlanPlacement(db, tasks, employeeId);
}
