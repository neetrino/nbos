import { Injectable, Inject, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createId } from './auth-session.id';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  isAuthRefreshReuseDetectionEnabled,
  resolveAuthRefreshRotationGraceSeconds,
  resolveAuthRefreshTokenPepper,
  resolveAuthRefreshTokenTtlDays,
  resolveAuthSessionCleanupBatchSize,
} from './auth-session.flags';
import {
  generateRefreshTokenPair,
  hashAuthMetadata,
  hashRefreshSecret,
  parseRefreshToken,
  refreshHashesEqual,
} from './auth-session.tokens';
import { recordAuthMetric } from './auth-session.metrics';
import {
  fromPrismaAuthSessionClientKind,
  toPrismaAuthSessionClientKind,
} from './auth-session.client';
import type { AuthSessionClientKindApi } from '@nbos/shared';

export type SessionRevokeReason =
  | 'logout'
  | 'logout_all'
  | 'password_reset'
  | 'password_change'
  | 'user_disabled'
  | 'reuse_detected'
  | 'admin_revoke'
  | 'expired_cleanup'
  | 'ownership_transfer';

export interface CreateSessionInput {
  employeeId: string;
  ip?: string;
  userAgent?: string;
  deviceLabel?: string;
  clientKind?: AuthSessionClientKindApi;
}

export interface CreateSessionResult {
  sessionId: string;
  tokenFamilyId: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface RotateSessionResult {
  sessionId: string;
  employeeId: string;
  authVersion: number;
  email: string;
  refreshToken: string;
  expiresAt: Date;
  clientKind: AuthSessionClientKindApi;
}

type SessionRow = {
  id: string;
  employeeId: string;
  tokenFamilyId: string;
  refreshTokenHash: string;
  previousRefreshHash: string | null;
  previousHashExpiresAt: Date | null;
  status: string;
  expiresAt: Date;
  version: number;
  lastIpHash: string | null;
  userAgentHash: string | null;
  clientKind?: string;
};

@Injectable()
export class AuthSessionService {
  private readonly logger = new Logger(AuthSessionService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly config: ConfigService,
  ) {}

  private pepper(): string {
    const pepper =
      resolveAuthRefreshTokenPepper(process.env) ??
      this.config.get<string>('AUTH_REFRESH_TOKEN_PEPPER');
    if (!pepper || pepper.length < 16) {
      throw new Error('AUTH_REFRESH_TOKEN_PEPPER is not configured');
    }
    return pepper;
  }

  async createSession(input: CreateSessionInput): Promise<CreateSessionResult> {
    const pepper = this.pepper();
    const sessionId = createId();
    const tokenFamilyId = createId();
    const { rawToken, secret } = generateRefreshTokenPair(sessionId);
    const refreshTokenHash = hashRefreshSecret(secret, pepper);
    const ttlDays = resolveAuthRefreshTokenTtlDays();
    const expiresAt = new Date(Date.now() + ttlDays * 86_400_000);

    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        employeeId: input.employeeId,
        tokenFamilyId,
        refreshTokenHash,
        status: 'ACTIVE',
        expiresAt,
        lastUsedAt: new Date(),
        createdIpHash: input.ip ? hashAuthMetadata(input.ip, pepper) : null,
        lastIpHash: input.ip ? hashAuthMetadata(input.ip, pepper) : null,
        userAgentHash: input.userAgent ? hashAuthMetadata(input.userAgent, pepper) : null,
        deviceLabel: input.deviceLabel?.slice(0, 120) ?? null,
        clientKind: toPrismaAuthSessionClientKind(input.clientKind ?? 'web'),
      },
    });

    recordAuthMetric('auth_login_success_total');
    this.logger.log(
      JSON.stringify({
        event: 'auth.session_created',
        sessionId,
        employeeId: input.employeeId,
        tokenFamilyId,
      }),
    );

    return { sessionId, tokenFamilyId, refreshToken: rawToken, expiresAt };
  }

  /** Atomic refresh rotation with optional grace window for parallel tabs. */
  async rotateRefresh(
    rawRefreshToken: string,
    meta?: { ip?: string; userAgent?: string },
  ): Promise<RotateSessionResult> {
    const parsed = parseRefreshToken(rawRefreshToken);
    if (!parsed) {
      recordAuthMetric('auth_refresh_failed_total');
      throw new UnauthorizedException('Invalid refresh token');
    }

    const pepper = this.pepper();
    const presentedHash = hashRefreshSecret(parsed.secret, pepper);
    const graceSeconds = resolveAuthRefreshRotationGraceSeconds();
    const now = new Date();

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${parsed.sessionId}))`;

        const session = (await tx.authSession.findUnique({
          where: { id: parsed.sessionId },
        })) as SessionRow | null;

        if (!session) {
          throw new UnauthorizedException('Invalid refresh token');
        }

        if (session.status === 'COMPROMISED' || session.status === 'REVOKED') {
          throw new UnauthorizedException('Invalid refresh token');
        }

        if (session.expiresAt <= now) {
          await tx.authSession.update({
            where: { id: session.id },
            data: { status: 'EXPIRED', revokedAt: now, revokeReason: 'expired' },
          });
          throw new UnauthorizedException('Invalid refresh token');
        }

        const matchesCurrent = refreshHashesEqual(session.refreshTokenHash, presentedHash);
        const previousHash = session.previousRefreshHash;
        const previousStillValid =
          Boolean(previousHash) &&
          Boolean(session.previousHashExpiresAt) &&
          session.previousHashExpiresAt! > now &&
          refreshHashesEqual(previousHash!, presentedHash);

        if (!matchesCurrent && !previousStillValid) {
          if (
            isAuthRefreshReuseDetectionEnabled() &&
            (session.status === 'ROTATED' || Boolean(previousHash))
          ) {
            await tx.authSession.updateMany({
              where: { tokenFamilyId: session.tokenFamilyId, employeeId: session.employeeId },
              data: {
                status: 'COMPROMISED',
                revokedAt: now,
                revokeReason: 'reuse_detected',
              },
            });
            recordAuthMetric('auth_refresh_reuse_detected_total');
            this.logger.warn(
              JSON.stringify({
                event: 'auth.refresh_reuse_detected',
                tokenFamilyId: session.tokenFamilyId,
                employeeId: session.employeeId,
              }),
            );
          }
          throw new UnauthorizedException('Invalid refresh token');
        }

        const employee = await tx.employee.findUniqueOrThrow({
          where: { id: session.employeeId },
          select: { id: true, email: true, authVersion: true, status: true },
        });

        if (employee.status === 'TERMINATED') {
          await tx.authSession.update({
            where: { id: session.id },
            data: {
              status: 'REVOKED',
              revokedAt: now,
              revokeReason: 'user_disabled',
            },
          });
          throw new UnauthorizedException('Account deactivated');
        }

        if (!matchesCurrent && previousStillValid) {
          return {
            session,
            employee,
            refreshToken: rawRefreshToken,
            kind: 'grace' as const,
          };
        }

        const { rawToken, secret } = generateRefreshTokenPair(session.id);
        const nextHash = hashRefreshSecret(secret, pepper);
        const graceUntil = graceSeconds > 0 ? new Date(now.getTime() + graceSeconds * 1000) : null;

        const updated = await tx.authSession.updateMany({
          where: { id: session.id, version: session.version, status: 'ACTIVE' },
          data: {
            refreshTokenHash: nextHash,
            previousRefreshHash: session.refreshTokenHash,
            previousHashExpiresAt: graceUntil,
            rotatedAt: now,
            lastUsedAt: now,
            version: { increment: 1 },
            lastIpHash: meta?.ip ? hashAuthMetadata(meta.ip, pepper) : session.lastIpHash,
            userAgentHash: meta?.userAgent
              ? hashAuthMetadata(meta.userAgent, pepper)
              : session.userAgentHash,
          },
        });

        if (updated.count !== 1) {
          throw new UnauthorizedException('Refresh conflict; retry');
        }

        return {
          session,
          employee,
          refreshToken: rawToken,
          kind: 'rotated' as const,
        };
      });

      recordAuthMetric('auth_refresh_success_total');
      this.logger.log(
        JSON.stringify({
          event: result.kind === 'rotated' ? 'auth.session_rotated' : 'auth.session_refreshed',
          sessionId: result.session.id,
          employeeId: result.employee.id,
        }),
      );

      return {
        sessionId: result.session.id,
        employeeId: result.employee.id,
        authVersion: result.employee.authVersion,
        email: result.employee.email,
        refreshToken: result.refreshToken,
        expiresAt: result.session.expiresAt,
        clientKind: fromPrismaAuthSessionClientKind(result.session.clientKind),
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        recordAuthMetric('auth_refresh_failed_total');
      }
      throw err;
    }
  }

  async revokeSession(
    sessionId: string,
    employeeId: string,
    reason: SessionRevokeReason,
  ): Promise<boolean> {
    const now = new Date();
    const updated = await this.prisma.authSession.updateMany({
      where: { id: sessionId, employeeId, status: 'ACTIVE' },
      data: {
        status: 'REVOKED',
        revokedAt: now,
        revokeReason: reason,
      },
    });
    if (updated.count > 0) {
      recordAuthMetric('auth_session_revoked_total');
      this.logger.log(
        JSON.stringify({
          event: 'auth.session_revoked',
          sessionId,
          employeeId,
          reason,
        }),
      );
    }
    return updated.count > 0;
  }

  async revokeAllSessions(
    employeeId: string,
    reason: SessionRevokeReason,
    options?: { exceptSessionId?: string },
  ): Promise<number> {
    const now = new Date();
    const updated = await this.prisma.authSession.updateMany({
      where: {
        employeeId,
        status: 'ACTIVE',
        ...(options?.exceptSessionId ? { id: { not: options.exceptSessionId } } : {}),
      },
      data: {
        status: 'REVOKED',
        revokedAt: now,
        revokeReason: reason,
      },
    });
    if (updated.count > 0) {
      recordAuthMetric('auth_session_revoked_total', updated.count);
      this.logger.log(
        JSON.stringify({
          event: 'auth.session_revoke_all',
          employeeId,
          reason,
          count: updated.count,
        }),
      );
    }
    return updated.count;
  }

  async bumpAuthVersionAndRevokeAll(
    employeeId: string,
    reason: SessionRevokeReason,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: employeeId },
        data: { authVersion: { increment: 1 } },
      });
      await tx.authSession.updateMany({
        where: { employeeId, status: 'ACTIVE' },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revokeReason: reason,
        },
      });
    });
    this.logger.log(
      JSON.stringify({
        event:
          reason === 'user_disabled'
            ? 'auth.user_disabled_sessions_revoked'
            : 'auth.sessions_revoked',
        employeeId,
        reason,
      }),
    );
  }

  async listSessionsForEmployee(employeeId: string, currentSessionId?: string) {
    const sessions = await this.prisma.authSession.findMany({
      where: {
        employeeId,
        status: { in: ['ACTIVE'] },
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
        deviceLabel: true,
        clientKind: true,
      },
    });
    return sessions.map((s) => ({
      id: s.id,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      lastUsedAt: s.lastUsedAt?.toISOString() ?? null,
      expiresAt: s.expiresAt.toISOString(),
      deviceLabel: s.deviceLabel,
      clientKind: fromPrismaAuthSessionClientKind(s.clientKind),
      current: currentSessionId ? s.id === currentSessionId : false,
    }));
  }

  async assertSessionActive(sessionId: string, employeeId: string): Promise<void> {
    const session = await this.prisma.authSession.findFirst({
      where: { id: sessionId, employeeId, status: 'ACTIVE' },
      select: { id: true, expiresAt: true },
    });
    if (!session || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Session is not active');
    }
  }

  async cleanupExpiredSessions(): Promise<{ marked: number }> {
    const batch = resolveAuthSessionCleanupBatchSize();
    const now = new Date();
    const expired = await this.prisma.authSession.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lte: now },
      },
      select: { id: true },
      take: batch,
    });
    if (expired.length === 0) return { marked: 0 };
    const result = await this.prisma.authSession.updateMany({
      where: { id: { in: expired.map((e) => e.id) } },
      data: {
        status: 'EXPIRED',
        revokedAt: now,
        revokeReason: 'expired_cleanup',
      },
    });
    return { marked: result.count };
  }
}
