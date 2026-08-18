import { describe, expect, it } from 'vitest';
import {
  MailAmbiguousSendError,
  MailAttachmentLoadError,
  MailAttachmentPermanentError,
  classifyMailProviderError,
} from './mail-provider-error.classify';

describe('classifyMailProviderError', () => {
  it('classifies timeout and reset as transient', () => {
    expect(
      classifyMailProviderError(Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' })),
    ).toBe('transient');
    expect(
      classifyMailProviderError(Object.assign(new Error('connect timeout'), { code: 'ETIMEDOUT' })),
    ).toBe('transient');
    expect(classifyMailProviderError({ status: 429, message: 'rate limited' })).toBe('transient');
    expect(classifyMailProviderError({ status: 503, message: 'unavailable' })).toBe('transient');
  });

  it('classifies auth/revoke as auth', () => {
    expect(classifyMailProviderError(new Error('invalid_grant'))).toBe('auth');
    expect(classifyMailProviderError({ status: 401, message: 'Unauthorized' })).toBe('auth');
    expect(classifyMailProviderError(new Error('IMAP AUTH failed'))).toBe('auth');
  });

  it('classifies recipient rejects as permanent', () => {
    expect(classifyMailProviderError(new Error('550 5.1.1 User unknown'))).toBe('permanent');
    expect(classifyMailProviderError(new Error('Recipient rejected: invalid mailbox'))).toBe(
      'permanent',
    );
  });

  it('classifies inbound attachment permanent errors as permanent', () => {
    expect(
      classifyMailProviderError(new MailAttachmentPermanentError('IMAP attachment part not found')),
    ).toBe('permanent');
  });

  it('classifies missing outbound attachment bytes as transient', () => {
    expect(
      classifyMailProviderError(
        new MailAttachmentLoadError('Outbound attachment att-1 has no bytes'),
      ),
    ).toBe('transient');
  });

  it('classifies timeout-after-submit as ambiguous and does not treat it as transient', () => {
    expect(classifyMailProviderError(new MailAmbiguousSendError('timeout after submit'))).toBe(
      'ambiguous',
    );
    expect(classifyMailProviderError(new Error('provider accepted but no response'))).toBe(
      'ambiguous',
    );
  });
});
