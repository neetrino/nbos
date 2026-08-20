import { ForbiddenException, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@nbos/database';
import {
  CEO_ROLE_SLUG,
  NBOS_FOUNDER_EMPLOYEE_ID_ENV,
  OWNERSHIP_TRANSFER_CONFIRMATION,
  PLATFORM_OWNERSHIP_SINGLETON_ID,
  canAssignRole,
  evaluateIsPlatformOwner,
  isFounderProtectedEmployee,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { AuthSessionService } from '../auth/auth-session.service';

const ACTIVE_CEO_STATUSES = ['ACTIVE', 'PROBATION'] as const;

@Injectable()
export class PlatformOwnershipService implements OnModuleInit {
  private readonly logger = new Logger(PlatformOwnershipService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationService,
    private readonly authSessions: AuthSessionService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.bootstrapFromEnv();
  }

  founderEmployeeIdEnv(): string | null {
    const value = this.config.get<string>(NBOS_FOUNDER_EMPLOYEE_ID_ENV)?.trim();
    return value && value.length > 0 ? value : null;
  }

  async isPlatformOwner(employeeId: string): Promise<boolean> {
    return (await this.evaluate(employeeId)).ok;
  }

  async assertPlatformOwner(employeeId: string): Promise<void> {
    const result = await this.evaluate(employeeId);
    if (result.ok) return;
    await this.auditIntegrityFailure(employeeId, result.reason);
    throw new ForbiddenException('Platform owner identity is required for this action.');
  }

  async assertFounderNotTarget(targetEmployeeId: string): Promise<void> {
    const ownership = await this.loadOwnership();
    if (
      !isFounderProtectedEmployee(
        targetEmployeeId,
        ownership?.ownerEmployeeId,
        this.founderEmployeeIdEnv(),
      )
    ) {
      return;
    }
    throw new ForbiddenException('The platform owner account cannot be changed this way.');
  }

  async evaluate(employeeId: string): Promise<{ ok: boolean; reason: string }> {
    const ownership = await this.loadOwnership();
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { status: true },
    });
    return evaluateIsPlatformOwner({
      employeeId,
      employeeStatus: employee?.status ?? null,
      ownerEmployeeId: ownership?.ownerEmployeeId ?? null,
      founderEmployeeIdEnv: this.founderEmployeeIdEnv(),
    });
  }

  async loadOwnership() {
    return this.prisma.platformOwnership.findUnique({
      where: { id: PLATFORM_OWNERSHIP_SINGLETON_ID },
      select: { ownerEmployeeId: true, transferredAt: true },
    });
  }

  async assertCanAssignRole(params: {
    actorId: string;
    actorRoleSlug: string;
    targetEmployeeId: string | null;
    targetRoleId: string;
  }): Promise<void> {
    const targetRole = await this.prisma.role.findUnique({
      where: { id: params.targetRoleId },
      select: { slug: true, assignable: true },
    });
    if (!targetRole) throw new ForbiddenException('Unknown role.');
    const actorIsPlatformOwner = await this.isPlatformOwner(params.actorId);
    const ceoHeldByOtherEmployee = await this.ceoHeldByOtherEmployee(
      params.targetEmployeeId,
      targetRole.slug,
    );
    const decision = canAssignRole({
      actorIsPlatformOwner,
      actorRoleSlug: params.actorRoleSlug,
      targetRoleSlug: targetRole.slug,
      targetRoleAssignable: targetRole.assignable,
      ceoHeldByOtherEmployee,
    });
    if (decision.allowed) return;
    throw new ForbiddenException(decision.reason);
  }

  async transfer(params: {
    actorId: string;
    targetEmployeeId: string;
    confirm: string;
    stepUpVerified: boolean;
  }) {
    await this.assertPlatformOwner(params.actorId);
    if (!params.stepUpVerified) {
      throw new ForbiddenException('Ownership transfer requires step-up authentication.');
    }
    if (params.confirm !== OWNERSHIP_TRANSFER_CONFIRMATION) {
      throw new ForbiddenException('Ownership transfer confirmation is invalid.');
    }
    return this.commitTransfer(params.actorId, params.targetEmployeeId);
  }

  private async commitTransfer(actorId: string, targetEmployeeId: string) {
    if (targetEmployeeId === actorId) {
      throw new ForbiddenException('Choose a different employee as the new platform owner.');
    }
    const target = await this.prisma.employee.findUnique({
      where: { id: targetEmployeeId },
      select: { id: true, status: true },
    });
    if (!target || (target.status !== 'ACTIVE' && target.status !== 'PROBATION')) {
      throw new ForbiddenException('Transfer target must be an active employee.');
    }
    await this.prisma.platformOwnership.update({
      where: { id: PLATFORM_OWNERSHIP_SINGLETON_ID },
      data: {
        ownerEmployeeId: targetEmployeeId,
        transferredAt: new Date(),
        transferredByEmployeeId: actorId,
      },
    });
    await this.prisma.employee.update({
      where: { id: actorId },
      data: { authVersion: { increment: 1 } },
    });
    await this.authSessions.revokeAllSessions(actorId, 'ownership_transfer');
    await this.audit.log({
      entityType: 'platform_ownership',
      entityId: PLATFORM_OWNERSHIP_SINGLETON_ID,
      action: 'platform.ownership_transferred',
      userId: actorId,
      changes: { fromEmployeeId: actorId, toEmployeeId: targetEmployeeId },
    });
    await this.notifications.createMany({
      recipientIds: [targetEmployeeId],
      type: 'platform.ownership_transferred',
      title: 'Platform ownership transferred',
      body: 'You are the new platform owner after Founder approval. Env anchor must match.',
      entityType: 'platform_ownership',
      entityId: PLATFORM_OWNERSHIP_SINGLETON_ID,
      sourceModule: 'settings',
      dedupeKeyPrefix: 'platform.ownership_transferred',
      dedupeKeySuffix: `${actorId}:${targetEmployeeId}`,
    });
    return { ownerEmployeeId: targetEmployeeId, requiresEnvUpdate: true };
  }

  private async ceoHeldByOtherEmployee(
    targetEmployeeId: string | null,
    targetRoleSlug: string,
  ): Promise<boolean> {
    if (targetRoleSlug.trim().toLowerCase() !== CEO_ROLE_SLUG) return false;
    const existing = await this.prisma.employee.findFirst({
      where: {
        role: { slug: CEO_ROLE_SLUG },
        status: { in: [...ACTIVE_CEO_STATUSES] },
        ...(targetEmployeeId ? { id: { not: targetEmployeeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(existing);
  }

  private async bootstrapFromEnv(): Promise<void> {
    const envId = this.founderEmployeeIdEnv();
    if (!envId) return;
    const existing = await this.loadOwnership();
    if (existing) return;
    const employee = await this.prisma.employee.findUnique({
      where: { id: envId },
      select: { id: true },
    });
    if (!employee) {
      this.logger.warn('NBOS_FOUNDER_EMPLOYEE_ID does not match an employee; ownership unset.');
      return;
    }
    await this.prisma.platformOwnership.create({
      data: { id: PLATFORM_OWNERSHIP_SINGLETON_ID, ownerEmployeeId: envId },
    });
    this.logger.log('Bootstrapped PlatformOwnership from NBOS_FOUNDER_EMPLOYEE_ID.');
  }

  private async auditIntegrityFailure(employeeId: string, reason: string): Promise<void> {
    await this.audit.log({
      entityType: 'platform_ownership',
      entityId: PLATFORM_OWNERSHIP_SINGLETON_ID,
      action: 'platform.ownership_integrity_failed',
      userId: employeeId,
      changes: { reason },
    });
  }
}
