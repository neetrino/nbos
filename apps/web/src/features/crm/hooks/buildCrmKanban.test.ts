import { describe, expect, it } from 'vitest';
import { buildScopedKanbanColumns } from './buildCrmKanban';

const STAGES = [
  { key: 'A', label: 'A', color: 'bg-blue-500', hexColor: '#3B82F6' },
  { key: 'B', label: 'B', color: 'bg-red-500', hexColor: '#EF4444', terminal: true },
] as const;

describe('buildScopedKanbanColumns', () => {
  it('attaches per-column total and load-more flags', () => {
    const columns = buildScopedKanbanColumns({
      items: [
        { id: '1', status: 'A' },
        { id: '2', status: 'A' },
      ],
      stages: STAGES,
      scopeValue: 'ACTIVE',
      columnMeta: {
        A: { totalCount: 12, hasMore: true, loadingMore: false },
      },
    });

    expect(columns).toHaveLength(1);
    expect(columns[0]?.key).toBe('A');
    expect(columns[0]?.items).toHaveLength(2);
    expect(columns[0]?.totalCount).toBe(12);
    expect(columns[0]?.hasMore).toBe(true);
  });
});
