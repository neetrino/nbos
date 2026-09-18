import { describe, expect, it } from 'vitest';
import { resolveKanbanStageHex } from '@/components/shared/kanban/kanban-stage-hex';
import { EXPENSE_STAGE_COLOR_CLASS, EXPENSE_STAGE_HEX } from './expense-stage-colors';

describe('expense-stage-colors', () => {
  it('maps every stage hex from the same kanban Tailwind token', () => {
    for (const [key, colorClass] of Object.entries(EXPENSE_STAGE_COLOR_CLASS)) {
      expect(EXPENSE_STAGE_HEX[key]).toBe(resolveKanbanStageHex(colorClass));
    }
    expect(EXPENSE_STAGE_HEX.PLANNED).toBe('#3B82F6');
    expect(EXPENSE_STAGE_HEX.ON_HOLD).toBe('#9CA3AF');
  });
});
