import { describe, expect, it } from 'vitest';
import {
  DURATION_GUARD_CENTER_LEAD_MS,
  DURATION_GUARD_CHECKPOINT_MS,
  DURATION_GUARD_WARNING_LEAD_MS,
  durationGuardSnapshot,
} from './duration-guard';

const STARTED = new Date('2026-09-27T10:00:00.000Z');

function atMinutes(minutes: number): Date {
  return new Date(STARTED.getTime() + minutes * 60 * 1000);
}

describe('durationGuardSnapshot', () => {
  it('stays quiet until ten minutes before the first hour', () => {
    const snapshot = durationGuardSnapshot(STARTED, null, atMinutes(49));
    expect(snapshot.phase).toBe('quiet');
    expect(snapshot.checkpointAt.toISOString()).toBe(atMinutes(60).toISOString());
  });

  it('opens the warning at fifty minutes and centers it for the last two', () => {
    const warning = durationGuardSnapshot(STARTED, null, atMinutes(50));
    expect(warning.phase).toBe('warning');
    expect(warning.centered).toBe(false);
    expect(warning.warningOpensAt.getTime()).toBe(
      warning.checkpointAt.getTime() - DURATION_GUARD_WARNING_LEAD_MS,
    );

    const center = durationGuardSnapshot(
      STARTED,
      null,
      new Date(atMinutes(60).getTime() - DURATION_GUARD_CENTER_LEAD_MS),
    );
    expect(center.phase).toBe('warning');
    expect(center.centered).toBe(true);
  });

  it('is due at the hour when nobody continued', () => {
    expect(durationGuardSnapshot(STARTED, null, atMinutes(60)).phase).toBe('due');
  });

  it('after continue, stays quiet until ten minutes before the next hour', () => {
    const continuedThrough = new Date(STARTED.getTime() + DURATION_GUARD_CHECKPOINT_MS);
    expect(durationGuardSnapshot(STARTED, continuedThrough, atMinutes(61)).phase).toBe('quiet');
    const next = durationGuardSnapshot(STARTED, continuedThrough, atMinutes(110));
    expect(next.phase).toBe('warning');
    expect(next.checkpointAt.toISOString()).toBe(atMinutes(120).toISOString());
    expect(durationGuardSnapshot(STARTED, continuedThrough, atMinutes(120)).phase).toBe('due');
  });
});
