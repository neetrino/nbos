import { describe, it, expect } from 'vitest';
import { buildSupportSlaProjection, computePauseShiftMs } from './support-sla';

describe('support-sla', () => {
  const base = {
    status: 'IN_PROGRESS',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    waitingState: 'NONE',
    slaPausedTotalSeconds: 0,
    slaPauseStartedAt: null,
    slaResponseDeadline: new Date('2026-01-02T00:00:00Z'),
    slaResolveDeadline: new Date('2026-01-10T00:00:00Z'),
  };

  it('treats waiting overlay as PAUSED even if raw deadlines are in the past', () => {
    const projection = buildSupportSlaProjection({
      ...base,
      waitingState: 'WAITING_FOR_CLIENT',
      slaPauseStartedAt: new Date('2026-01-05T00:00:00Z'),
      slaResponseDeadline: new Date('2020-01-01T00:00:00Z'),
      slaResolveDeadline: new Date('2020-01-02T00:00:00Z'),
    });
    expect(projection.state).toBe('PAUSED');
  });

  it('extends effective deadlines by accumulated pause seconds', () => {
    const projection = buildSupportSlaProjection({
      ...base,
      slaPausedTotalSeconds: 3600,
    });
    expect(projection.effectiveResolveDeadline).not.toBeNull();
    expect(projection.resolveDeadline).not.toBeNull();
    expect(new Date(projection.effectiveResolveDeadline!).getTime()).toBeGreaterThan(
      new Date(projection.resolveDeadline!).getTime(),
    );
  });

  it('includes active pause segment in shift', () => {
    const now = new Date('2026-01-05T12:00:00Z').getTime();
    const shift = computePauseShiftMs(
      {
        ...base,
        waitingState: 'WAITING_FOR_CLIENT',
        slaPausedTotalSeconds: 100,
        slaPauseStartedAt: new Date('2026-01-05T10:00:00Z'),
      },
      now,
    );
    expect(shift).toBe(100 * 1000 + 2 * 3600 * 1000);
  });
});
