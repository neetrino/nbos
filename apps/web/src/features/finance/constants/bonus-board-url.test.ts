import { describe, expect, it } from 'vitest';
import { BONUS_BOARD_PROJECT_FILTER_QUERY, bonusBoardHref } from './bonus-board-url';

describe('bonusBoardHref', () => {
  it('returns bare path when project id missing', () => {
    expect(bonusBoardHref()).toBe('/bonus');
    expect(bonusBoardHref(null)).toBe('/bonus');
    expect(bonusBoardHref('   ')).toBe('/bonus');
  });

  it('appends projectId query', () => {
    expect(bonusBoardHref('proj-1')).toBe(`/bonus?${BONUS_BOARD_PROJECT_FILTER_QUERY}=proj-1`);
  });
});
