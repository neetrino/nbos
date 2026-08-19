import { describe, expect, it } from 'vitest';
import { mailSyncJobId } from './mail-sync-runtime.constants';

describe('enqueueSync jobId', () => {
  it('uses the same jobId for two enqueueSync calls on one account', () => {
    expect(mailSyncJobId('acc-1')).toBe('mail-sync-acc-1');
    expect(mailSyncJobId('acc-1')).not.toContain(':');
    expect(mailSyncJobId('acc-1')).toBe(mailSyncJobId('acc-1'));
    expect(mailSyncJobId('acc-2')).not.toBe(mailSyncJobId('acc-1'));
  });
});
