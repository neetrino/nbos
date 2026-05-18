import { SprintStatusEnum, TaskPlanningStatusEnum } from '@nbos/database';

export type SprintPlanningSnapshot = {
  status: SprintStatusEnum;
} | null;

/** Derives legacy planningStatus from sprint membership for filters and compatibility. */
export function derivePlanningStatusFromSprint(
  sprint: SprintPlanningSnapshot,
): (typeof TaskPlanningStatusEnum)[keyof typeof TaskPlanningStatusEnum] {
  if (!sprint) return TaskPlanningStatusEnum.BACKLOG;
  if (sprint.status === SprintStatusEnum.ACTIVE) return TaskPlanningStatusEnum.ACTIVE_SPRINT;
  if (sprint.status === SprintStatusEnum.PLANNING) return TaskPlanningStatusEnum.FUTURE_SPRINT;
  return TaskPlanningStatusEnum.ACTIVE_SPRINT;
}
