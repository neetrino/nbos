import { Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hashRefreshSecret } from './auth-session.tokens';
import { AuthSessionService } from './auth-session.service';
import { resetAuthMetricsForTests } from './auth-session.metrics';

const PEPPER = 'test-pepper-that-is-long-enough-for-auth';
const SESSION_ID = 'session-a';

function employee(status = 'ACTIVE') {
  return {
    id: 'employee-a',
    email: 'a@example.com',
    authVersion: 3,
    status,
  };
}

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: SESSION_ID,
    employeeId: 'employee-a',
    tokenFamilyId: 'family-a',
    refreshTokenHash: hashRefreshSecret('current-secret', PEPPER),
    previousRefreshHash: null,
    previousHashExpiresAt: null,
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 60_000),
    version: 1,
    lastIpHash: null,
    userAgentHash: null,
    clientKind: 'WEB',
    ...overrides,
  };
}

function harness(row: ReturnType<typeof session>, employeeRow = employee(), updateManyCount = 1) {
  let committed = false;
  const tx = {
    $executeRaw: vi.fn().mockResolvedValue(0),
    authSession: {
      findUnique: vi.fn().mockResolvedValue(row),
      update: vi.fn().mockResolvedValue(row),
      updateMany: vi.fn().mockResolvedValue({ count: updateManyCount }),
    },
    employee: {
      findUniqueOrThrow: vi.fn().mockResolvedValue(employeeRow),
    },
  };
  const prisma = {
    $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) => {
      const result = await callback(tx);
      committed = true;
      return result;
    }),
  };
  const config = { get: vi.fn().mockReturnValue(PEPPER) };
  const service = new AuthSessionService(prisma as never, config as never);
  return { service, tx, wasCommitted: () => committed };
}

describe('AuthSessionService.rotateRefresh', () => {
  beforeEach(() => {
    process.env.AUTH_REFRESH_TOKEN_PEPPER = PEPPER;
    process.env.AUTH_REFRESH_REUSE_DETECTION_ENABLED = 'true';
    process.env.AUTH_REFRESH_ROTATION_GRACE_SECONDS = '10';
    resetAuthMetricsForTests();
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    delete process.env.AUTH_REFRESH_TOKEN_PEPPER;
    delete process.env.AUTH_REFRESH_REUSE_DETECTION_ENABLED;
    delete process.env.AUTH_REFRESH_ROTATION_GRACE_SECONDS;
    vi.restoreAllMocks();
  });

  it('returns fresh access claims but no stale refresh during the grace window', async () => {
    const { service, tx, wasCommitted } = harness(
      session({
        previousRefreshHash: hashRefreshSecret('previous-secret', PEPPER),
        previousHashExpiresAt: new Date(Date.now() + 30_000),
      }),
    );

    const result = await service.rotateRefresh(`${SESSION_ID}.previous-secret`);

    expect(result.refreshToken).toBeUndefined();
    expect(result.sessionId).toBe(SESSION_ID);
    expect(tx.authSession.updateMany).not.toHaveBeenCalled();
    expect(wasCommitted()).toBe(true);
  });

  it('commits COMPROMISED reuse detection before rejecting the refresh', async () => {
    const { service, tx, wasCommitted } = harness(
      session({
        previousRefreshHash: hashRefreshSecret('previous-secret', PEPPER),
        previousHashExpiresAt: new Date(Date.now() - 1_000),
      }),
    );

    await expect(service.rotateRefresh(`${SESSION_ID}.stolen-secret`)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(wasCommitted()).toBe(true);
    expect(tx.authSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'COMPROMISED',
          revokeReason: 'reuse_detected',
        }),
      }),
    );
  });

  it('commits EXPIRED status before rejecting an expired session', async () => {
    const { service, tx, wasCommitted } = harness(
      session({ expiresAt: new Date(Date.now() - 1_000) }),
    );

    await expect(service.rotateRefresh(`${SESSION_ID}.current-secret`)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(wasCommitted()).toBe(true);
    expect(tx.authSession.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'EXPIRED' }) }),
    );
  });

  it('commits session revocation before rejecting a terminated employee', async () => {
    const { service, tx, wasCommitted } = harness(session(), employee('TERMINATED'));

    await expect(service.rotateRefresh(`${SESSION_ID}.current-secret`)).rejects.toThrow(
      'Account deactivated',
    );

    expect(wasCommitted()).toBe(true);
    expect(tx.authSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'REVOKED', revokeReason: 'user_disabled' }),
      }),
    );
  });

  it('classifies an optimistic refresh conflict as retryable after commit', async () => {
    const { service, wasCommitted } = harness(session(), employee(), 0);

    await expect(service.rotateRefresh(`${SESSION_ID}.current-secret`)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(wasCommitted()).toBe(true);
  });
});
