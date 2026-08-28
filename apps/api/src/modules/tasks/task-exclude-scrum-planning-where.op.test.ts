import { describe, expect, it } from 'vitest';
import { TaskPlanningStatusEnum } from '@nbos/database';
import {
  buildExcludeScrumPlanningWhere,
  shouldExcludeScrumPlanningFromGlobalFeed,
} from './task-exclude-scrum-planning-where.op';

describe('shouldExcludeScrumPlanningFromGlobalFeed', () => {
  it('applies for personal global feed', () => {
    expect(shouldExcludeScrumPlanningFromGlobalFeed({ involvesEmployeeId: 'emp-1' })).toBe(true);
  });

  it('skips workspace-scoped lists', () => {
    expect(
      shouldExcludeScrumPlanningFromGlobalFeed({
        involvesEmployeeId: 'emp-1',
        workspaceId: 'ws-1',
      }),
    ).toBe(false);
  });

  it('skips explicit planningStatus filter', () => {
    expect(
      shouldExcludeScrumPlanningFromGlobalFeed({
        involvesEmployeeId: 'emp-1',
        planningStatus: 'BACKLOG',
      }),
    ).toBe(false);
  });

  it('skips trash scope', () => {
    expect(
      shouldExcludeScrumPlanningFromGlobalFeed({
        involvesEmployeeId: 'emp-1',
        scope: 'trash',
      }),
    ).toBe(false);
  });

  it('skips when involvesEmployeeId is absent', () => {
    expect(shouldExcludeScrumPlanningFromGlobalFeed({})).toBe(false);
  });
});

describe('buildExcludeScrumPlanningWhere', () => {
  it('excludes scrum backlog and future sprint only', () => {
    expect(buildExcludeScrumPlanningWhere()).toEqual({
      NOT: {
        AND: [
          { workspace: { is: { scrumEnabled: true } } },
          {
            planningStatus: {
              in: [TaskPlanningStatusEnum.BACKLOG, TaskPlanningStatusEnum.FUTURE_SPRINT],
            },
          },
        ],
      },
    });
  });
});
