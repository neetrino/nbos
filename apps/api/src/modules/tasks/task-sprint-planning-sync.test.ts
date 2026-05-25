import { describe, expect, it } from 'vitest';
import { SprintStatusEnum, TaskPlanningStatusEnum } from '@nbos/database';
import { derivePlanningStatusFromSprint } from './task-sprint-planning-sync';

describe('derivePlanningStatusFromSprint', () => {
  it('maps null sprint to backlog', () => {
    expect(derivePlanningStatusFromSprint(null)).toBe(TaskPlanningStatusEnum.BACKLOG);
  });

  it('maps active sprint', () => {
    expect(derivePlanningStatusFromSprint({ status: SprintStatusEnum.ACTIVE })).toBe(
      TaskPlanningStatusEnum.ACTIVE_SPRINT,
    );
  });

  it('maps planning sprint', () => {
    expect(derivePlanningStatusFromSprint({ status: SprintStatusEnum.PLANNING })).toBe(
      TaskPlanningStatusEnum.FUTURE_SPRINT,
    );
  });
});
