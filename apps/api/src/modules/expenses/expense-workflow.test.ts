import { describe, expect, it } from 'vitest';
import { deriveTimeBasedWorkflowStatus, refreshExpenseWorkflowStatus } from './expense-workflow';

describe('deriveTimeBasedWorkflowStatus', () => {
  const ref = '2026-04-10';

  it('returns OVERDUE when due before reference day', () => {
    expect(deriveTimeBasedWorkflowStatus(new Date('2026-04-09T12:00:00.000Z'), ref)).toBe(
      'OVERDUE',
    );
  });

  it('returns DUE_NOW on the reference day', () => {
    expect(deriveTimeBasedWorkflowStatus(new Date('2026-04-10T08:00:00.000Z'), ref)).toBe(
      'DUE_NOW',
    );
  });

  it('returns DUE_SOON within the soon window', () => {
    expect(deriveTimeBasedWorkflowStatus(new Date('2026-04-12T00:00:00.000Z'), ref)).toBe(
      'DUE_SOON',
    );
  });

  it('returns PLANNED for later due dates', () => {
    expect(deriveTimeBasedWorkflowStatus(new Date('2026-05-01T00:00:00.000Z'), ref)).toBe(
      'PLANNED',
    );
  });

  it('returns PLANNED when due date is missing', () => {
    expect(deriveTimeBasedWorkflowStatus(null, ref)).toBe('PLANNED');
  });
});

describe('refreshExpenseWorkflowStatus', () => {
  it('keeps BACKLOG and ON_HOLD', () => {
    expect(refreshExpenseWorkflowStatus('BACKLOG', new Date())).toBe('BACKLOG');
    expect(refreshExpenseWorkflowStatus('ON_HOLD', new Date())).toBe('ON_HOLD');
  });

  it('keeps manual DUE_NOW', () => {
    expect(
      refreshExpenseWorkflowStatus('DUE_NOW', new Date('2026-05-01T00:00:00.000Z'), '2026-04-10'),
    ).toBe('DUE_NOW');
  });

  it('recomputes PLANNED from due date', () => {
    expect(
      refreshExpenseWorkflowStatus('PLANNED', new Date('2026-04-01T00:00:00.000Z'), '2026-04-10'),
    ).toBe('OVERDUE');
  });
});
