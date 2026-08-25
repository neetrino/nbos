import { describe, expect, it } from 'vitest';
import {
  canEnqueueGoogleContactsSync,
  isGoogleContactsLinked,
} from './google-contacts-connection-state';

describe('google-contacts-connection-state', () => {
  it('allows enqueue when a secret exists and status is ERROR', () => {
    expect(canEnqueueGoogleContactsSync({ status: 'ERROR', secret: { id: 's1' } })).toBe(true);
  });

  it('blocks enqueue when disconnected or secret is missing', () => {
    expect(canEnqueueGoogleContactsSync({ status: 'DISCONNECTED', secret: { id: 's1' } })).toBe(
      false,
    );
    expect(canEnqueueGoogleContactsSync({ status: 'CONNECTED', secret: null })).toBe(false);
  });

  it('treats linked state the same as enqueue eligibility', () => {
    const row = { status: 'ERROR' as const, secret: { id: 's1' } };
    expect(isGoogleContactsLinked(row)).toBe(canEnqueueGoogleContactsSync(row));
  });
});
