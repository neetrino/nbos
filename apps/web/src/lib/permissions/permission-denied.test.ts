import { describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { ApiError, PERMISSION_DENIED_MESSAGE } from '@/lib/api-errors';
import { beginPermittedCreate } from './permission-denied';

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

describe('beginPermittedCreate', () => {
  it('opens when the action is allowed', () => {
    const open = vi.fn();
    beginPermittedCreate(true, open);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('does not open when the action is denied', () => {
    vi.stubGlobal('window', {});
    const open = vi.fn();
    beginPermittedCreate(false, open);
    expect(open).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(PERMISSION_DENIED_MESSAGE, {
      id: 'nbos-permission-denied',
    });
    vi.unstubAllGlobals();
  });
});

describe('permission denied copy', () => {
  it('uses a stable user-facing sentence', () => {
    const error = new ApiError('No permission: CLIENTS.ADD', { statusCode: 403 });
    expect(error.statusCode).toBe(403);
    expect(PERMISSION_DENIED_MESSAGE).toMatch(/permission/i);
  });
});
