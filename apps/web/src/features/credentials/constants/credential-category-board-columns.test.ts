import { describe, expect, it } from 'vitest';
import { buildCredentialCategoryKanbanColumns } from './credential-category-board-columns';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';

const COLUMNS = [
  { value: 'DOMAIN', label: 'Domain' },
  { value: 'APP', label: 'App Store' },
] as const;

function item(id: string, category: string): CredentialListItem {
  return { id, category } as CredentialListItem;
}

describe('buildCredentialCategoryKanbanColumns', () => {
  it('attaches per-column total and load-more flags', () => {
    const columns = buildCredentialCategoryKanbanColumns(
      [item('1', 'DOMAIN'), item('2', 'DOMAIN')],
      COLUMNS,
      {
        DOMAIN: { totalCount: 46, hasMore: true, loadingMore: false },
        APP: { totalCount: 0, hasMore: false, loadingMore: false },
      },
    );

    expect(columns).toHaveLength(2);
    expect(columns[0]?.key).toBe('DOMAIN');
    expect(columns[0]?.items).toHaveLength(2);
    expect(columns[0]?.totalCount).toBe(46);
    expect(columns[0]?.hasMore).toBe(true);
    expect(columns[1]?.items).toHaveLength(0);
    expect(columns[1]?.totalCount).toBe(0);
  });
});
