import { BadRequestException, Logger, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import type { PrismaClient } from '@nbos/database';
import { recordAuthMetric } from './auth-session.metrics';

type Prisma = InstanceType<typeof PrismaClient>;

type TokenDenylist = {
  revokeUntil: (jti: string, untilMs: number) => Promise<void>;
};

type VaultSession = {
  lock: (employeeId: string) => Promise<void>;
};

/**
 * Verifies current password, stores argon2id hash, bumps authVersion,
 * revokes all sessions, locks vault, and optionally denylists legacy jti.
 */
export async function changeEmployeePassword(params: {
  prisma: Prisma;
  tokenDenylist: TokenDenylist;
  vaultSession: VaultSession;
  logger: Logger;
  employeeId: string;
  currentPassword: string;
  newPassword: string;
  jti?: string;
  tokenExp?: number;
}): Promise<{ success: true; requiresReauth: true }> {
  const {
    prisma,
    tokenDenylist,
    vaultSession,
    logger,
    employeeId,
    currentPassword,
    newPassword,
    jti,
    tokenExp,
  } = params;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, passwordHash: true, status: true },
  });

  if (!employee?.passwordHash || employee.status === 'TERMINATED') {
    throw new UnauthorizedException('Invalid credentials');
  }

  const currentOk = await argon2.verify(employee.passwordHash, currentPassword);
  if (!currentOk) {
    recordAuthMetric('auth_login_failed_total');
    throw new UnauthorizedException('Current password is incorrect');
  }

  const sameAsCurrent = await argon2.verify(employee.passwordHash, newPassword);
  if (sameAsCurrent) {
    throw new BadRequestException('New password must be different from the current password');
  }

  const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { id: employeeId },
      data: {
        passwordHash,
        authVersion: { increment: 1 },
      },
    });
    await tx.authSession.updateMany({
      where: { employeeId, status: 'ACTIVE' },
      data: {
        status: 'REVOKED',
        revokedAt: now,
        revokeReason: 'password_change',
      },
    });
  });

  await vaultSession.lock(employeeId);

  if (jti && typeof tokenExp === 'number') {
    await tokenDenylist.revokeUntil(jti, tokenExp * 1_000);
  }

  logger.log(
    JSON.stringify({
      event: 'auth.password_changed',
      employeeId,
    }),
  );

  return { success: true, requiresReauth: true };
}
