import { describe, expect, it, vi } from 'vitest';
import {
  isMailJobInFlight,
  prepareMailJobIdForEnqueue,
  shouldReplaceTerminalMailJob,
} from './mail-queue-replace-terminal';

describe('mail job terminal replace', () => {
  it('treats waiting/active as in-flight and completed/failed as replaceable', () => {
    expect(isMailJobInFlight('waiting')).toBe(true);
    expect(isMailJobInFlight('active')).toBe(true);
    expect(isMailJobInFlight('completed')).toBe(false);
    expect(shouldReplaceTerminalMailJob('completed')).toBe(true);
    expect(shouldReplaceTerminalMailJob('failed')).toBe(true);
    expect(shouldReplaceTerminalMailJob('waiting')).toBe(false);
  });

  it('leaves in-flight jobs in place', async () => {
    const remove = vi.fn();
    const result = await prepareMailJobIdForEnqueue(
      {
        getJob: vi.fn().mockResolvedValue({
          getState: vi.fn().mockResolvedValue('active'),
          remove,
        }),
      },
      'mail-att-a1',
    );
    expect(result).toBe('in_flight');
    expect(remove).not.toHaveBeenCalled();
  });

  it('removes completed jobs so retry can enqueue again', async () => {
    const remove = vi.fn().mockResolvedValue(undefined);
    const result = await prepareMailJobIdForEnqueue(
      {
        getJob: vi.fn().mockResolvedValue({
          getState: vi.fn().mockResolvedValue('completed'),
          remove,
        }),
      },
      'mail-att-a1',
    );
    expect(result).toBe('ready');
    expect(remove).toHaveBeenCalledOnce();
  });
});
