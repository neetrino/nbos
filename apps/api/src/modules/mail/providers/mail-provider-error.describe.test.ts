import { describe, expect, it } from 'vitest';
import { describeMailProviderError } from './mail-provider-error.describe';

describe('describeMailProviderError', () => {
  it('surfaces the IMAP server line hidden behind Command failed', () => {
    const error = new Error('Command failed') as Error & {
      authenticationFailed: boolean;
      responseText: string;
    };
    error.authenticationFailed = true;
    error.responseText = 'Authentication failed.';
    expect(describeMailProviderError(error)).toBe('Authentication failed.');
  });

  it('keeps a message that already includes the server response', () => {
    const error = new Error('Invalid login: 535 Authentication failed') as Error & {
      response: string;
    };
    error.response = '535 Authentication failed';
    expect(describeMailProviderError(error)).toBe('Invalid login: 535 Authentication failed');
  });

  it('reads the server line from a wrapped cause', () => {
    const cause = new Error('Command failed') as Error & { responseText: string };
    cause.responseText = 'Too many connections.';
    expect(describeMailProviderError(new Error('Command failed', { cause }))).toBe(
      'Command failed: Too many connections.',
    );
  });
});
