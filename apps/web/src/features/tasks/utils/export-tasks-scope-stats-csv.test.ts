import { describe, expect, it } from 'vitest';
import {
  buildTasksScopeStatsCsvContent,
  type TasksScopeStatsCsvMeta,
} from '@/features/tasks/utils/export-tasks-scope-stats-csv';
import type { TaskStats } from '@/lib/api/tasks';

const META: TasksScopeStatsCsvMeta = {
  exportedAtIso: '2026-04-29T12:00:00.000Z',
};

const SAMPLE: TaskStats = {
  byStatus: [
    { status: 'NEW', _count: 5 },
    { status: 'DONE', _count: 2 },
  ],
  byPriority: [{ priority: 'HIGH', _count: 3 }],
};

describe('buildTasksScopeStatsCsvContent', () => {
  it('includes meta totals by_status and by_priority', () => {
    const csv = buildTasksScopeStatsCsvContent(SAMPLE, META);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('section,col1,col2,col3,col4,col5');
    expect(lines.some((l) => l.startsWith('meta,scope_note,'))).toBe(true);
    expect(lines).toContain('totals,tasksCountedByStatus,7,,,');
    expect(lines).toContain('by_status,NEW,5,,,');
    expect(lines).toContain('by_priority,HIGH,3,,,');
  });
});
