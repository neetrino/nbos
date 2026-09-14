import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import type { PrismaClient } from '@nbos/database';
import {
  FORGOT_PASSWORD_GENERIC_MESSAGE,
  PASSWORD_RESET_TTL_MS,
  PASSWORD_RESET_TOKEN_BYTES,
  RESET_EMAIL_NOT_DELIVERED_MESSAGE,
  RESET_LINK_INVALID_MESSAGE,
  RESET_TARGET_TERMINATED_MESSAGE,
  RESET_TARGET_WITHOUT_PASSWORD_MESSAGE,
} from './auth-password-reset.constants';
import {
  sendPasswordResetEmail,
  type PasswordResetEmailDelivery,
} from './auth-password-reset.email';

type Prisma = InstanceType<typeof PrismaClient>;

type ResetTargetEmployee = { id: string; email: string; interfaceLocale: unknown };

type VaultSession = {
  /** Result intentionally ignored here: the reset already invalidated every session. */
  lock: (employeeId: string) => Promise<unknown>;
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
    select: { id: true, email: true, passwordHash: true, status: true, interfaceLocale: true },
  });

  if (!employee?.passwordHash || employee.status === 'TERMINATED') {
    return { message: FORGOT_PASSWORD_GENERIC_MESSAGE };
  }

  await issueResetToken({ prisma: params.prisma, logger: params.logger, employee });
  return { message: FORGOT_PASSWORD_GENERIC_MESSAGE };
}

/**
 * Owner-initiated reset for another employee. Unlike the public flow it reports real errors to the
 * authenticated caller, and it never returns the raw token or the reset URL — only the employee can
 * complete the reset from their mailbox.
 */
export async function issuePasswordResetForEmployee(params: {
  prisma: Prisma;
  logger: Logger;
  employeeId: string;
  issuedByEmployeeId: string;
}): Promise<{ email: string; expiresAt: Date }> {
  const employee = await params.prisma.employee.findUnique({
    where: { id: params.employeeId },
    select: { id: true, email: true, passwordHash: true, status: true, interfaceLocale: true },
  });

  if (!employee) throw new NotFoundException(`Employee ${params.employeeId} not found`);
  if (employee.status === 'TERMINATED') {
    throw new BadRequestException(RESET_TARGET_TERMINATED_MESSAGE);
  }
  if (!employee.passwordHash) {
    throw new BadRequestException(RESET_TARGET_WITHOUT_PASSWORD_MESSAGE);
  }

  const { expiresAt, delivery } = await issueResetToken({
    prisma: params.prisma,
    logger: params.logger,
    employee,
    issuedByEmployeeId: params.issuedByEmployeeId,
  });

  // The owner acts on someone else's behalf, so an undelivered link must not look like success.
  if (!delivery?.delivered) {
    throw new ServiceUnavailableException(RESET_EMAIL_NOT_DELIVERED_MESSAGE);
  }

  return { email: employee.email, expiresAt };
}

/**
 * Replaces any pending token and mails the link. The stored value is a hash; the raw token leaves
 * the process only inside the email body, or in a dev-only warning when no provider is configured.
 */
async function issueResetToken(params: {
  prisma: Prisma;
  logger: Logger;
  employee: ResetTargetEmployee;
  issuedByEmployeeId?: string;
}): Promise<{ expiresAt: Date; delivery: PasswordResetEmailDelivery }> {
  const { token, tokenHash } = createPasswordResetSecret();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  const employeeId = params.employee.id;

  await params.prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.deleteMany({ where: { employeeId, usedAt: null } });
    await tx.passwordResetToken.create({ data: { employeeId, tokenHash, expiresAt } });
  });

  const appUrl = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const delivery = await sendPasswordResetEmail({
    email: params.employee.email,
    resetUrl: `${appUrl}/reset-password?token=${encodeURIComponent(token)}`,
    expiresAt,
    logger: params.logger,
    locale: params.employee.interfaceLocale,
  });

  params.logger.log(
    JSON.stringify({
      event: 'auth.password_reset_issued',
      employeeId,
      delivered: delivery?.delivered === true,
      ...(params.issuedByEmployeeId ? { issuedByEmployeeId: params.issuedByEmployeeId } : {}),
    }),
  );
  return { expiresAt, delivery };
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
