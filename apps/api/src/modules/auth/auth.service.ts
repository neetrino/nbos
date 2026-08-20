import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { TokenDenylistService } from '../../common/security/token-denylist.service';
import { CredentialVaultSessionService } from '../credentials/credential-vault-session.service';
import { AuthSessionService } from './auth-session.service';
import type { AuthSessionClientKindApi } from '@nbos/shared';
import { resolveAuthAccessTokenTtlSeconds, shouldIssueAuthSessionV2 } from './auth-session.flags';
import { recordAuthMetric } from './auth-session.metrics';
import { changeEmployeePassword } from './auth-change-password';
import { assertInvitationRoleStillAssignable } from './auth-invite-role';
import type { V2AccessTokenClaims } from './auth-session.tokens';
import { NBOS_FOUNDER_EMPLOYEE_ID_ENV } from '@nbos/shared';

interface LegacyJwtPayload {
  sub: string;
  email: string;
}

/**
 * Internal login/refresh result. Controllers map through `toAuthPublicResponse`
 * so web/BFF never get `refreshToken` in JSON (native mobile may).
 */
export interface LoginResult {
  accessToken: string;
  /** Opaque refresh for cookie / native JSON (never persist). */
  refreshToken?: string;
  sessionId?: string;
  tokenVersion: 1 | 2;
  clientKind?: AuthSessionClientKindApi;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly config: ConfigService,
    private readonly tokenDenylist: TokenDenylistService,
    private readonly vaultSession: CredentialVaultSessionService,
    private readonly authSessions: AuthSessionService,
  ) {
    this.jwtSecret = this.config.getOrThrow<string>('JWT_SECRET');
    this.jwtExpiresIn = this.config.get<string>('JWT_EXPIRES_IN') ?? '7d';
  }

  async login(
    email: string,
    password: string,
    meta?: {
      ip?: string;
      userAgent?: string;
      clientKind?: AuthSessionClientKindApi;
      deviceLabel?: string;
    },
  ): Promise<LoginResult> {
    const employee = await this.prisma.employee.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        status: true,
        authVersion: true,
      },
    });

    if (!employee?.passwordHash) {
      recordAuthMetric('auth_login_failed_total');
      throw new UnauthorizedException('Invalid credentials');
    }

    if (employee.status === 'TERMINATED') {
      recordAuthMetric('auth_login_failed_total');
      throw new UnauthorizedException('Account deactivated');
    }

    const isValid = await argon2.verify(employee.passwordHash, password);
    if (!isValid) {
      recordAuthMetric('auth_login_failed_total');
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = {
      id: employee.id,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
    };

    if (shouldIssueAuthSessionV2(employee.id)) {
      const clientKind = meta?.clientKind ?? 'web';
      const session = await this.authSessions.createSession({
        employeeId: employee.id,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        deviceLabel: meta?.deviceLabel,
        clientKind,
      });
      const accessToken = this.signV2AccessToken({
        sub: employee.id,
        email: employee.email,
        sid: session.sessionId,
        typ: 'access',
        ver: 2,
        authVersion: employee.authVersion,
      });
      return {
        accessToken,
        refreshToken: session.refreshToken,
        sessionId: session.sessionId,
        tokenVersion: 2,
        clientKind,
        user,
      };
    }

    const payload: LegacyJwtPayload = { sub: employee.id, email: employee.email };
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn as jwt.SignOptions['expiresIn'],
      jwtid: randomUUID(),
    });
    recordAuthMetric('auth_login_success_total');

    return {
      accessToken,
      tokenVersion: 1,
      user,
    };
  }

  async refresh(
    rawRefreshToken: string,
    meta?: { ip?: string; userAgent?: string },
  ): Promise<LoginResult> {
    const started = Date.now();
    const rotated = await this.authSessions.rotateRefresh(rawRefreshToken, meta);
    const accessToken = this.signV2AccessToken({
      sub: rotated.employeeId,
      email: rotated.email,
      sid: rotated.sessionId,
      typ: 'access',
      ver: 2,
      authVersion: rotated.authVersion,
    });
    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { id: rotated.employeeId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    this.logger.debug(`auth_refresh_latency_ms=${Date.now() - started}`);
    return {
      accessToken,
      refreshToken: rotated.refreshToken,
      sessionId: rotated.sessionId,
      tokenVersion: 2,
      clientKind: rotated.clientKind,
      user: {
        id: employee.id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
      },
    };
  }

  /**
   * Revokes the caller's current access token (legacy denylist) and/or V2 session.
   */
  async logout(
    jti: string | undefined,
    tokenExp: number | undefined,
    employeeId?: string,
    sessionId?: string,
  ): Promise<{ success: true }> {
    if (jti && typeof tokenExp === 'number') {
      await this.tokenDenylist.revokeUntil(jti, tokenExp * 1_000);
    }
    if (employeeId && sessionId) {
      await this.authSessions.revokeSession(sessionId, employeeId, 'logout');
    }
    if (employeeId) {
      await this.vaultSession.lock(employeeId);
    }
    return { success: true };
  }

  async logoutAll(employeeId: string): Promise<{ success: true; revoked: number }> {
    const revoked = await this.authSessions.revokeAllSessions(employeeId, 'logout_all');
    await this.vaultSession.lock(employeeId);
    return { success: true, revoked };
  }

  async logoutOthers(
    employeeId: string,
    currentSessionId?: string,
  ): Promise<{ success: true; revoked: number }> {
    if (!currentSessionId) {
      throw new BadRequestException('Current session required');
    }
    const revoked = await this.authSessions.revokeAllSessions(employeeId, 'logout_all', {
      exceptSessionId: currentSessionId,
    });
    return { success: true, revoked };
  }

  async listSessions(employeeId: string, currentSessionId?: string) {
    return this.authSessions.listSessionsForEmployee(employeeId, currentSessionId);
  }

  async revokeSessionForUser(employeeId: string, sessionId: string) {
    const ok = await this.authSessions.revokeSession(sessionId, employeeId, 'admin_revoke');
    if (!ok) {
      throw new BadRequestException('Session not found or already revoked');
    }
    return { success: true as const };
  }

  signV2AccessToken(claims: Omit<V2AccessTokenClaims, 'iat' | 'exp' | 'jti'>): string {
    const ttlSeconds = resolveAuthAccessTokenTtlSeconds();
    return jwt.sign(claims, this.jwtSecret, {
      expiresIn: ttlSeconds,
      jwtid: randomUUID(),
    });
  }

  async acceptInvite(token: string, firstName: string, lastName: string, password: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new BadRequestException('Invalid invitation token');
    }
    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Invitation has already been used or cancelled');
    }
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    await assertInvitationRoleStillAssignable(this.prisma, {
      invitedById: invitation.invitedById,
      roleId: invitation.roleId,
      founderEmployeeIdEnv: this.config.get<string>(NBOS_FOUNDER_EMPLOYEE_ID_ENV)?.trim() || null,
    });

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    const employee = await this.prisma.employee.create({
      data: {
        email: invitation.email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        passwordHash,
        roleId: invitation.roleId,
      },
    });

    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED', employeeId: employee.id },
    });

    if (invitation.departmentId) {
      await this.prisma.employeeDepartment.create({
        data: {
          employeeId: employee.id,
          departmentId: invitation.departmentId,
          isPrimary: true,
        },
      });
    }

    this.logger.log(`Employee ${employee.id} registered via invitation (${employee.email})`);

    return { message: 'Account created successfully. You can now sign in.' };
  }

  /**
   * Changes the caller's account password after verifying the current one.
   * Bumps authVersion, revokes all AuthSessions, locks the vault, and optionally
   * denylists the current legacy access jti. Caller must re-authenticate.
   */
  async changePassword(
    employeeId: string,
    currentPassword: string,
    newPassword: string,
    opts?: { jti?: string; tokenExp?: number },
  ): Promise<{ success: true; requiresReauth: true }> {
    return changeEmployeePassword({
      prisma: this.prisma,
      tokenDenylist: this.tokenDenylist,
      vaultSession: this.vaultSession,
      logger: this.logger,
      employeeId,
      currentPassword,
      newPassword,
      jti: opts?.jti,
      tokenExp: opts?.tokenExp,
    });
  }

  async getInvitationInfo(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      select: {
        email: true,
        status: true,
        expiresAt: true,
        role: { select: { name: true } },
      },
    });

    if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired invitation');
    }

    return { email: invitation.email, roleName: invitation.role.name };
  }
}
