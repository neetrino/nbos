import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { issuePasswordResetForEmployee } from '../auth/auth-password-reset';
import { AuthSessionService } from '../auth/auth-session.service';
import { CredentialVaultSessionService } from '../credentials/credential-vault-session.service';
import { NotificationService } from '../notifications/notification.service';
import { PlatformOwnershipService } from '../platform-ownership/platform-ownership.service';
import {
  PASSWORD_RESET_LINK_AUDIT_ACTION,
  PASSWORD_RESET_LINK_NOTIFICATION_BODY,
  PASSWORD_RESET_LINK_NOTIFICATION_TITLE,
  PASSWORD_RESET_LINK_NOTIFICATION_TYPE,
  SECURITY_ADMIN_SELF_TARGET_MESSAGE,
  SECURITY_ADMIN_SOURCE_MODULE,
  SESSIONS_REVOKED_AUDIT_ACTION,
  SESSIONS_REVOKED_NOTIFICATION_BODY,
  SESSIONS_REVOKED_NOTIFICATION_TITLE,
  SESSIONS_REVOKED_NOTIFICATION_TYPE,
} from './employee-security-admin.constants';
import type {
  EmployeePasswordResetLinkResult,
  EmployeeSessionRevokeResult,
} from './employee-security-admin.types';

/**
 * Platform-owner account recovery for other employees. The owner can only trigger the employee's
 * own email reset flow or end their sessions; no path here reveals or sets a password, so the
 * employee stays the single party able to choose their credential.
 */
@Injectable()
export class EmployeeSecurityAdminService {
  private readonly logger = new Logger(EmployeeSecurityAdminService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly ownership: PlatformOwnershipService,
    private readonly authSessions: AuthSessionService,
    private readonly vaultSession: CredentialVaultSessionService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationService,
  ) {}

  /** Mails the standard reset link to the employee; the caller never receives the token. */
  async sendPasswordResetLink(
    actorId: string,
    employeeId: string,
  ): Promise<EmployeePasswordResetLinkResult> {
    await this.assertOwnerActingOnOtherEmployee(actorId, employeeId);

    const issued = await issuePasswordResetForEmployee({
      prisma: this.prisma,
      logger: this.logger,
      employeeId,
      issuedByEmployeeId: actorId,
    });

    await this.audit.log({
      entityType: 'employee',
      entityId: employeeId,
      action: PASSWORD_RESET_LINK_AUDIT_ACTION,
      userId: actorId,
      changes: {
        event: 'auth.password_reset_issued',
        expiresAt: issued.expiresAt.toISOString(),
      } as unknown as InputJsonValue,
    });

    await this.notifyEmployee({
      employeeId,
      type: PASSWORD_RESET_LINK_NOTIFICATION_TYPE,
      title: PASSWORD_RESET_LINK_NOTIFICATION_TITLE,
      body: PASSWORD_RESET_LINK_NOTIFICATION_BODY,
      dedupeSuffix: issued.expiresAt.toISOString(),
    });

    return {
      employeeId,
      sentToEmail: issued.email,
      expiresAt: issued.expiresAt.toISOString(),
    };
  }

  /** Ends every active session, bumps `authVersion`, and locks the Credentials vault. */
  async revokeAllSessions(
    actorId: string,
    employeeId: string,
  ): Promise<EmployeeSessionRevokeResult> {
    await this.assertOwnerActingOnOtherEmployee(actorId, employeeId);

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });
    if (!employee) throw new NotFoundException(`Employee ${employeeId} not found`);

    const sessionsRevoked = await this.authSessions.bumpAuthVersionAndRevokeAll(
      employeeId,
      'admin_revoke',
    );
    const vaultLocked = await this.vaultSession.lock(employeeId);
    if (!vaultLocked) {
      this.logger.error(
        `Vault unlock for ${employeeId} may have survived the owner-initiated sign-out.`,
      );
    }

    await this.audit.log({
      entityType: 'employee',
      entityId: employeeId,
      action: SESSIONS_REVOKED_AUDIT_ACTION,
      userId: actorId,
      changes: {
        event: 'auth.sessions_revoked',
        reason: 'admin_revoke',
        sessionsRevoked,
        vaultLocked,
      } as unknown as InputJsonValue,
    });

    await this.notifyEmployee({
      employeeId,
      type: SESSIONS_REVOKED_NOTIFICATION_TYPE,
      title: SESSIONS_REVOKED_NOTIFICATION_TITLE,
      body: SESSIONS_REVOKED_NOTIFICATION_BODY,
      dedupeSuffix: new Date().toISOString(),
    });

    return { employeeId, sessionsRevoked };
  }

  /**
   * Platform-owner identity is required, the owner cannot target their own account here (own
   * Security tab covers that), and any founder-protected identity stays out of reach.
   */
  private async assertOwnerActingOnOtherEmployee(
    actorId: string,
    employeeId: string,
  ): Promise<void> {
    await this.ownership.assertPlatformOwner(actorId);
    if (actorId === employeeId) {
      throw new BadRequestException(SECURITY_ADMIN_SELF_TARGET_MESSAGE);
    }
    await this.ownership.assertFounderNotTarget(employeeId);
  }

  /** Transparency for the employee; a notification outage must not undo the security action. */
  private async notifyEmployee(params: {
    employeeId: string;
    type: string;
    title: string;
    body: string;
    dedupeSuffix: string;
  }): Promise<void> {
    try {
      await this.notifications.create({
        recipientId: params.employeeId,
        type: params.type,
        sourceModule: SECURITY_ADMIN_SOURCE_MODULE,
        title: params.title,
        body: params.body,
        entityType: 'employee',
        entityId: params.employeeId,
        dedupeKey: `${params.type}:${params.employeeId}:${params.dedupeSuffix}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Security notification for ${params.type} was not delivered: ${message}`);
    }
  }
}
