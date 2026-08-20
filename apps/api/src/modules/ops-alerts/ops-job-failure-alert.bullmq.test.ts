import { describe, expect, it } from 'vitest';
import { isBullmqJobFinallyFailed } from './ops-job-failure-alert.bullmq';

describe('isBullmqJobFinallyFailed', () => {
  it('treats missing attempts option as a single try', () => {
    expect(isBullmqJobFinallyFailed({ name: 'job', attemptsMade: 1 })).toBe(true);
    expect(isBullmqJobFinallyFailed({ name: 'job', attemptsMade: 0 })).toBe(false);
  });

  it('waits until attemptsMade reaches max', () => {
    const job = { name: 'job', attemptsMade: 2, opts: { attempts: 3 } };
    expect(isBullmqJobFinallyFailed(job)).toBe(false);
    expect(isBullmqJobFinallyFailed({ ...job, attemptsMade: 3 })).toBe(true);
  });
});
