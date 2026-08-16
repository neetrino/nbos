import { createHash, randomBytes } from 'node:crypto';
import { BadRequestException, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import type { PrismaClient } from '@nbos/database';
import {
  FORGOT_PASSWORD_GENERIC_MESSAGE,
  PASSWORD_RESET_TTL_MS,
  PASSWORD_RESET_TOKEN_BYTES,
  RESET_LINK_INVALID_MESSAGE,
} from './auth-password-reset.constants';
import { sendPasswordResetEmail } from './auth-password-reset.email';

type Prisma = InstanceType<typeof PrismaClient>;

type VaultSession = {
  lock: (employeeId: string) => Promise<void>;
};

export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function createPasswordResetSecret(): { token: string; tokenHash: string } {
  const token = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('base64url');
  return { token, tokenHash: hashPasswordResetToken(token) };
}

/** Always returns the same message so callers cannot enumerate accounts. */
export async function requestPasswordReset(params: {
  prisma: Prisma;
  logger: Logger;
  email: string;
}): Promise<{ message: string }> {
  const email = params.email.toLowerCase().trim();
  const employee = await params.prisma.employee.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true, status: true },
  });

  if (!employee?.passwordHash || employee.status === 'TERMINATED') {
    return { message: FORGOT_PASSWORD_GENERIC_MESSAGE };
  }

  const { token, tokenHash } = createPasswordResetSecret();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await params.prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.deleteMany({
      where: { employeeId: employee.id, usedAt: null },
    });
    await tx.passwordResetToken.create({
      data: { employeeId: employee.id, tokenHash, expiresAt },
    });
  });

  const appUrl = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  await sendPasswordResetEmail({
    email: employee.email,
    resetUrl,
    expiresAt,
    logger: params.logger,
  });

  params.logger.log(
    JSON.stringify({ event: 'auth.password_reset_issued', employeeId: employee.id }),
  );
  return { message: FORGOT_PASSWORD_GENERIC_MESSAGE };
}

export async function getPasswordResetInfo(params: {
  prisma: Prisma;
  token: string;
}): Promise<{ email: string }> {
  const row = await findUsableResetToken(params.prisma, params.token);
  return { email: row.employee.email };
}

export async function completePasswordReset(params: {
  prisma: Prisma;
  vaultSession: VaultSession;
  logger: Logger;
  token: string;
  newPassword: string;
}): Promise<{ success: true; requiresReauth: true }> {
  const row = await findUsableResetToken(params.prisma, params.token);
  const sameAsCurrent = await argon2.verify(row.employee.passwordHash, params.newPassword);
  if (sameAsCurrent) {
    throw new BadRequestException('New password must be different from the current password');
  }

  const passwordHash = await argon2.hash(params.newPassword, { type: argon2.argon2id });
  const now = new Date();

  await params.prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { id: row.employeeId },
      data: { passwordHash, authVersion: { increment: 1 } },
    });
    await tx.authSession.updateMany({
      where: { employeeId: row.employeeId, status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt: now, revokeReason: 'password_reset' },
    });
    await tx.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: now },
    });
    await tx.passwordResetToken.deleteMany({
      where: { employeeId: row.employeeId, usedAt: null, id: { not: row.id } },
    });
  });

  await params.vaultSession.lock(row.employeeId);
  params.logger.log(
    JSON.stringify({ event: 'auth.password_reset_completed', employeeId: row.employeeId }),
  );
  return { success: true, requiresReauth: true };
}

async function findUsableResetToken(prisma: Prisma, token: string) {
  const tokenHash = hashPasswordResetToken(token.trim());
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: {
      employee: { select: { email: true, passwordHash: true, status: true } },
    },
  });

  const passwordHash = row?.employee.passwordHash;
  if (
    !row ||
    row.usedAt ||
    row.expiresAt < new Date() ||
    !passwordHash ||
    row.employee.status === 'TERMINATED'
  ) {
    throw new BadRequestException(RESET_LINK_INVALID_MESSAGE);
  }

  return {
    id: row.id,
    employeeId: row.employeeId,
    employee: { email: row.employee.email, passwordHash },
  };
}
