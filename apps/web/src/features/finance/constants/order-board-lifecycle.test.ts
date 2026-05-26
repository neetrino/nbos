import { describe, expect, it } from 'vitest';
import { getBoardStageKeys, matchesBoardLifecycleScope } from '@/features/shared/board-lifecycle';
import { ORDER_BOARD_STAGES } from './order-board-lifecycle';

describe('order-board-lifecycle', () => {
  it('active scope excludes terminal order statuses', () => {
    expect(matchesBoardLifecycleScope('NEW', ORDER_BOARD_STAGES, 'ACTIVE')).toBe(true);
    expect(matchesBoardLifecycleScope('PARTIALLY_PAID', ORDER_BOARD_STAGES, 'ACTIVE')).toBe(true);
    expect(matchesBoardLifecycleScope('FULLY_PAID', ORDER_BOARD_STAGES, 'ACTIVE')).toBe(false);
    expect(matchesBoardLifecycleScope('CLOSED', ORDER_BOARD_STAGES, 'ACTIVE')).toBe(false);
    expect(matchesBoardLifecycleScope('CANCELLED', ORDER_BOARD_STAGES, 'ACTIVE')).toBe(false);
  });

  it('closed scope includes only terminal outcomes', () => {
    const keys = getBoardStageKeys(ORDER_BOARD_STAGES, 'CLOSED');
    expect(keys).toEqual(['FULLY_PAID', 'CLOSED', 'CANCELLED']);
  });
});
