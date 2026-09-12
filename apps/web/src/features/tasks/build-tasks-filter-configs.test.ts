import { describe, expect, it } from 'vitest';
import { DEFAULT_BOARD_LIFECYCLE_SCOPE } from '@/features/shared/board-lifecycle';
import { buildTasksFilterConfigs } from './build-tasks-filter-configs';

describe('buildTasksFilterConfigs', () => {
  it('keeps persisted filter values and translates visible labels', () => {
    const configs = buildTasksFilterConfigs((key) => `t:${key}`);

    expect(configs[0]?.key).toBe('boardScope');
    expect(configs[0]?.defaultOptionValue).toBe(DEFAULT_BOARD_LIFECYCLE_SCOPE);
    expect(configs[0]?.options.map((option) => option.value)).toEqual(['ALL', 'ACTIVE', 'CLOSED']);
    expect(configs[0]?.options[1]?.label).toBe('t:scope.ACTIVE');

    expect(configs[1]?.options.map((option) => option.value)).toEqual([
      'OPEN',
      'IN_PROGRESS',
      'REVIEW',
      'ON_HOLD',
      'COMPLETED',
    ]);
    expect(configs[1]?.allOptionLabel).toBe('t:filters.allStage');
    expect(configs[2]?.options.map((option) => option.value)).toEqual(['NORMAL', 'HIGH']);
  });
});
