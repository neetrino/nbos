import { describe, expect, it } from 'vitest';
import { mailApi } from './mail';

describe('mailApi Slice A surface', () => {
  it('does not expose sync-stub or finalize-send-stub clients', () => {
    expect('recordMailAccountSyncStub' in mailApi).toBe(false);
    expect('finalizeQueuedOutboundStub' in mailApi).toBe(false);
    expect('retryOutboundSend' in mailApi).toBe(true);
    expect('syncAccount' in mailApi).toBe(true);
    expect('reconnectCorporate' in mailApi).toBe(true);
  });
});
