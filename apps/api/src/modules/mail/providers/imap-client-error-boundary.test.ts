import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { attachImapClientErrorBoundary } from './imap-client-error-boundary';

class FakeImapClient extends EventEmitter {
  readonly close = vi.fn();
}

describe('Imap client error boundary', () => {
  it('turns an ETIMEOUT error event into a controlled operation rejection', async () => {
    const client = new FakeImapClient();
    const onError = vi.fn();
    const boundary = attachImapClientErrorBoundary(client, { onError });
    const pending = boundary.run(new Promise<void>(() => undefined));
    const timeout = Object.assign(new Error('Socket timeout'), { code: 'ETIMEOUT' });

    client.emit('error', timeout);

    await expect(pending).rejects.toMatchObject({ message: 'Socket timeout', code: 'ETIMEOUT' });
    expect(client.close).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith('code=ETIMEOUT message=Socket timeout');
  });

  it('absorbs and logs a late error event after work completed without leaking credentials', async () => {
    const client = new FakeImapClient();
    const onError = vi.fn();
    const boundary = attachImapClientErrorBoundary(client, {
      onError,
      sensitiveValues: ['mailbox-secret'],
    });

    await expect(boundary.run(Promise.resolve('done'))).resolves.toBe('done');
    expect(() =>
      client.emit(
        'error',
        Object.assign(
          new Error('password=mailbox-secret imaps://user:mailbox-secret@example.test'),
          {
            code: 'ECONNRESET',
          },
        ),
      ),
    ).not.toThrow();

    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0]?.[0]).not.toContain('mailbox-secret');
    expect(onError.mock.calls[0]?.[0]).not.toContain('user:');
  });

  it('does not rethrow when cleanup or observability fails inside the error listener', () => {
    const client = new FakeImapClient();
    client.close.mockImplementation(() => {
      throw new Error('already destroyed');
    });
    attachImapClientErrorBoundary(client, {
      onError: () => {
        throw new Error('logger unavailable');
      },
    });

    expect(() => client.emit('error', new Error('socket failed'))).not.toThrow();
  });
});
