import { describe, expect, it } from 'vitest';
import { getBoardStageKeys, matchesBoardLifecycleScope } from '@/features/shared/board-lifecycle';
import { INVOICE_MONEY_BOARD_STAGES } from './invoice-board-lifecycle';

describe('invoice-board-lifecycle', () => {
  it('active scope excludes terminal money statuses', () => {
    expect(matchesBoardLifecycleScope('NEW', INVOICE_MONEY_BOARD_STAGES, 'ACTIVE')).toBe(true);
    expect(matchesBoardLifecycleScope('PAID', INVOICE_MONEY_BOARD_STAGES, 'ACTIVE')).toBe(false);
    expect(matchesBoardLifecycleScope('CANCELLED', INVOICE_MONEY_BOARD_STAGES, 'ACTIVE')).toBe(
      false,
    );
  });

  it('closed scope includes only paid and cancelled', () => {
    const keys = getBoardStageKeys(INVOICE_MONEY_BOARD_STAGES, 'CLOSED');
    expect(keys).toEqual(['PAID', 'CANCELLED']);
  });
});
