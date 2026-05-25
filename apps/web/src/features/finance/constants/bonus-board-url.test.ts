import { describe, expect, it } from 'vitest';
import {
  BONUS_BOARD_PROJECT_FILTER_QUERY,
  FINANCE_BONUS_BOARD_PATH,
  bonusBoardHref,
} from './bonus-board-url';

describe('bonusBoardHref', () => {
  it('returns bare path when project id missing', () => {
    expect(bonusBoardHref()).toBe(FINANCE_BONUS_BOARD_PATH);
    expect(bonusBoardHref(null)).toBe(FINANCE_BONUS_BOARD_PATH);
    expect(bonusBoardHref('   ')).toBe(FINANCE_BONUS_BOARD_PATH);
  });

  it('appends projectId query', () => {
    expect(bonusBoardHref('proj-1')).toBe(
      `${FINANCE_BONUS_BOARD_PATH}?${BONUS_BOARD_PROJECT_FILTER_QUERY}=proj-1`,
    );
  });
});
