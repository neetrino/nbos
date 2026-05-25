import { describe, expect, it } from 'vitest';
import { getBoardStageKeys, matchesBoardLifecycleScope } from '@/features/shared/board-lifecycle';
import { PRODUCT_BOARD_STAGES, productMatchesProductBoardScope } from './product-board-lifecycle';

describe('product-board-lifecycle', () => {
  it('exposes active pipeline stages without terminal outcomes', () => {
    expect(getBoardStageKeys(PRODUCT_BOARD_STAGES, 'ACTIVE')).toEqual([
      'NEW',
      'CREATING',
      'DEVELOPMENT',
      'QA',
      'TRANSFER',
    ]);
  });

  it('exposes closed scope as DONE and LOST only', () => {
    expect(getBoardStageKeys(PRODUCT_BOARD_STAGES, 'CLOSED')).toEqual(['DONE', 'LOST']);
  });

  it('matches scope via helper', () => {
    expect(productMatchesProductBoardScope('DEVELOPMENT', 'ACTIVE')).toBe(true);
    expect(productMatchesProductBoardScope('DONE', 'ACTIVE')).toBe(false);
    expect(productMatchesProductBoardScope('DONE', 'CLOSED')).toBe(true);
    expect(matchesBoardLifecycleScope('LOST', PRODUCT_BOARD_STAGES, 'CLOSED')).toBe(true);
  });
});
