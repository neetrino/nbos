import { describe, expect, it } from 'vitest';
import {
  bonusEntriesForKanbanColumn,
  matchesBonusBoardLifecycleScope,
  resolveBonusBoardKanbanColumn,
  visibleBonusBoardKanbanColumns,
} from './bonus-board-lifecycle';
import type { BonusStatus } from '@/lib/api/bonus';

function statusRow(status: BonusStatus) {
  return { status };
}

describe('resolveBonusBoardKanbanColumn', () => {
  it('maps full statuses to simplified kanban columns', () => {
    expect(resolveBonusBoardKanbanColumn('INCOMING')?.key).toBe('INCOMING');
    expect(resolveBonusBoardKanbanColumn('EARNED')?.key).toBe('IN_PROGRESS');
    expect(resolveBonusBoardKanbanColumn('PENDING_ELIGIBILITY')?.key).toBe('IN_PROGRESS');
    expect(resolveBonusBoardKanbanColumn('VESTED')?.key).toBe('IN_PROGRESS');
    expect(resolveBonusBoardKanbanColumn('ACTIVE')?.key).toBe('ACTIVE');
    expect(resolveBonusBoardKanbanColumn('PAID')?.key).toBe('PAID');
    expect(resolveBonusBoardKanbanColumn('CLAWBACK')?.key).toBe('CLAWBACK');
  });
});

describe('matchesBonusBoardLifecycleScope', () => {
  it('active scope excludes terminal statuses', () => {
    expect(matchesBonusBoardLifecycleScope('ACTIVE', 'ACTIVE')).toBe(true);
    expect(matchesBonusBoardLifecycleScope('PAID', 'ACTIVE')).toBe(false);
    expect(matchesBonusBoardLifecycleScope('CLAWBACK', 'ACTIVE')).toBe(false);
  });

  it('closed scope includes only terminal statuses', () => {
    expect(matchesBonusBoardLifecycleScope('PAID', 'CLOSED')).toBe(true);
    expect(matchesBonusBoardLifecycleScope('CLAWBACK', 'CLOSED')).toBe(true);
    expect(matchesBonusBoardLifecycleScope('VESTED', 'CLOSED')).toBe(false);
  });
});

describe('visibleBonusBoardKanbanColumns', () => {
  it('returns active pipeline columns by default scope', () => {
    const keys = visibleBonusBoardKanbanColumns('ACTIVE').map((c) => c.key);
    expect(keys).toEqual(['INCOMING', 'IN_PROGRESS', 'ACTIVE']);
  });

  it('returns closed outcome columns', () => {
    const keys = visibleBonusBoardKanbanColumns('CLOSED').map((c) => c.key);
    expect(keys).toEqual(['PAID', 'CLAWBACK']);
  });
});

describe('bonusEntriesForKanbanColumn', () => {
  it('groups in-progress statuses together', () => {
    const rows = [statusRow('EARNED'), statusRow('VESTED'), statusRow('ACTIVE'), statusRow('PAID')];
    expect(bonusEntriesForKanbanColumn(rows, 'IN_PROGRESS')).toHaveLength(2);
    expect(bonusEntriesForKanbanColumn(rows, 'ACTIVE')).toHaveLength(1);
  });
});
