import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue, type TransactionClient } from '@nbos/database';
import {
  buildEmployeeOffboardingSnapshotItems,
  EMPLOYEE_OFFBOARDING_OWNER_TYPE,
  EMPLOYEE_OFFBOARDING_TEMPLATE_NAME,
} from '@nbos/shared';
import { auditCredentialAccessRevokedOnOffboard } from '../credentials/credential-offboarding-audit';
import { revokeCredentialAccessForOffboard } from '../credentials/credential-offboarding-revoke.ops';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import type {
  EmployeeOffboardingInventory,
  EmployeeOffboardingPreview,
  EmployeeOffboardingResult,
  EmployeeOffboardingRevokeSummary,
} from './employee-offboarding.types';

const OFFBOARD_NOTIFICATION_TYPE = 'employee.offboarding.finance';

@Injectable()
export class EmployeeOffboardingService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AuditService,
    private readonly notifications: NotificationService,
  ) {}

  async buildPreview(employeeId: string): Promise<EmployeeOffboardingPreview> {
    const employee = await this.findEmployeeOrThrow(employeeId);
    const inventory = await this.loadInventory(employeeId);
    return {
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
      currentStatus: employee.status,
      alreadyTerminated: employee.status === 'TERMINATED',
      inventory,
    };
  }

  async execute(employeeId: string, actorId: string): Promise<EmployeeOffboardingResult> {
    const employee = await this.findEmployeeOrThrow(employeeId);
    if (employee.status === 'TERMINATED') {
      throw new BadRequestException('Employee is already terminated');
    }

    const inventory = await this.loadInventory(employeeId);
    const now = new Date();
    const autoCompletedKeys = new Set([
      'platform_access',
      'credentials_access',
      'profile_archived',
    ]);

    const result = await this.prisma.$transaction(async (tx) => {
      const credentialRevoke = await revokeCredentialAccessForOffboard(tx, employeeId, now);
      const { summary: revoked, auditedCredentialIds } = await this.revokeAccess(
        tx,
        employeeId,
        now,
        credentialRevoke,
      );
      const templateIds = await this.ensureOffboardingTemplate(tx, actorId);
      const snapshot = buildEmployeeOffboardingSnapshotItems({ autoCompletedKeys });

      const checklistInstance = await tx.checklistInstance.create({
        data: {
          templateId: templateIds.templateId,
          templateVersionId: templateIds.templateVersionId,
          ownerEntityType: EMPLOYEE_OFFBOARDING_OWNER_TYPE,
          ownerEntityId: employeeId,
          snapshotItems: snapshot as unknown as InputJsonValue,
        },
      });

      const updated = await tx.employee.update({
        where: { id: employeeId },
        data: {
          status: 'TERMINATED',
          fireDate: now,
        },
        include: {
          role: { select: { id: true, name: true, slug: true, level: true } },
          departments: { include: { department: true } },
        },
      });

      return { updated, revoked, auditedCredentialIds, checklistInstanceId: checklistInstance.id };
    });

    await this.audit.log({
      entityType: 'employee',
      entityId: employeeId,
      action: 'employee.offboard',
      userId: actorId,
      changes: {
        inventory,
        revoked: result.revoked,
        checklistInstanceId: result.checklistInstanceId,
      } as unknown as InputJsonValue,
    });

    await auditCredentialAccessRevokedOnOffboard(
      this.audit,
      result.auditedCredentialIds,
      employeeId,
      actorId,
    );

    const financeNotificationsSent = await this.notifyFinanceTeam(
      employeeId,
      `${employee.firstName} ${employee.lastName}`.trim(),
      actorId,
    );

    return {
      employeeId,
      status: result.updated.status,
      fireDate: now.toISOString(),
      checklistInstanceId: result.checklistInstanceId,
      inventory,
      revoked: result.revoked,
      financeNotificationsSent,
    };
  }

  private async findEmployeeOrThrow(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, firstName: true, lastName: true, status: true },
    });
    if (!employee) throw new NotFoundException(`Employee ${employeeId} not found`);
    return employee;
  }

  private async loadInventory(employeeId: string): Promise<EmployeeOffboardingInventory> {
    const [
      activeTaskCount,
      projectTeams,
      productTeams,
      resourceGrants,
      fileGrants,
      credentialGrants,
      allowedListCredentials,
    ] = await Promise.all([
      this.prisma.task.count({
        where: {
          assigneeId: employeeId,
          status: { not: 'COMPLETED' },
        },
      }),
      this.prisma.projectTeamMember.findMany({
        where: { employeeId },
        select: { projectId: true },
      }),
      this.prisma.productTeamMember.findMany({
        where: { employeeId },
        select: { productId: true },
      }),
      this.prisma.resourceAccessGrant.count({
        where: { employeeId, revokedAt: null },
      }),
      this.prisma.fileAssetGrant.count({
        where: { granteeEmployeeId: employeeId, revokedAt: null },
      }),
      this.prisma.resourceAccessGrant.findMany({
        where: {
          employeeId,
          revokedAt: null,
          resourceType: 'credential',
        },
        select: { resourceId: true },
      }),
      this.prisma.credential.findMany({
        where: { trashedAt: null, allowedEmployees: { has: employeeId } },
        select: { id: true },
      }),
    ]);

    const credentialIds = [
      ...new Set([
        ...credentialGrants.map((row) => row.resourceId),
        ...allowedListCredentials.map((row) => row.id),
      ]),
    ];

    return {
      activeTaskCount,
      projectTeamCount: projectTeams.length,
      productTeamCount: productTeams.length,
      resourceGrantCount: resourceGrants,
      fileGrantCount: fileGrants,
      credentialGrantCount: credentialGrants.length,
      projectIds: projectTeams.map((row) => row.projectId),
      productIds: productTeams.map((row) => row.productId),
      credentialIds,
    };
  }

  private async revokeAccess(
    tx: TransactionClient,
    employeeId: string,
    now: Date,
    credentialRevoke: Awaited<ReturnType<typeof revokeCredentialAccessForOffboard>>,
  ): Promise<{
    summary: EmployeeOffboardingRevokeSummary;
    auditedCredentialIds: string[];
  }> {
    const resourceGrants = await tx.resourceAccessGrant.updateMany({
      where: { employeeId, revokedAt: null },
      data: { revokedAt: now },
    });
    const fileGrants = await tx.fileAssetGrant.updateMany({
      where: { granteeEmployeeId: employeeId, revokedAt: null },
      data: { revokedAt: now },
    });
    const projectTeamRemovals = await tx.projectTeamMember.deleteMany({
      where: { employeeId },
    });
    const productTeamRemovals = await tx.productTeamMember.deleteMany({
      where: { employeeId },
    });
    const accessOverridesClosed = await tx.employeeAccessOverride.updateMany({
      where: { employeeId, effectiveTo: null },
      data: { effectiveTo: now },
    });

    return {
      summary: {
        resourceGrantsRevoked: resourceGrants.count,
        fileGrantsRevoked: fileGrants.count,
        projectTeamRemovals: projectTeamRemovals.count,
        productTeamRemovals: productTeamRemovals.count,
        credentialGrantsRevoked: credentialRevoke.credentialGrantsRevoked,
        credentialAllowedListEntriesCleared: credentialRevoke.allowedEmployeesEntriesCleared,
        credentialFavoritesRemoved: credentialRevoke.favoritesRemoved,
        accessOverridesClosed: accessOverridesClosed.count,
      },
      auditedCredentialIds: credentialRevoke.credentialIds,
    };
  }

  private async ensureOffboardingTemplate(
    tx: TransactionClient,
    actorId: string,
  ): Promise<{ templateId: string; templateVersionId: string }> {
    const existing = await tx.checklistTemplate.findFirst({
      where: {
        name: EMPLOYEE_OFFBOARDING_TEMPLATE_NAME,
        ownerModule: 'MY_COMPANY',
        category: 'SOP',
      },
      include: { activeVersion: true },
    });
    if (existing?.activeVersionId && existing.activeVersion) {
      return { templateId: existing.id, templateVersionId: existing.activeVersionId };
    }

    const template = existing
      ? existing
      : await tx.checklistTemplate.create({
          data: {
            name: EMPLOYEE_OFFBOARDING_TEMPLATE_NAME,
            description: 'System template for employee offboarding checklist',
            category: 'SOP',
            ownerModule: 'MY_COMPANY',
            status: 'ACTIVE',
          },
        });

    const version = await tx.checklistTemplateVersion.create({
      data: {
        templateId: template.id,
        versionNumber: 1,
        status: 'PUBLISHED',
        items: buildEmployeeOffboardingSnapshotItems({
          autoCompletedKeys: new Set(),
        }) as unknown as InputJsonValue,
        createdById: actorId,
      },
    });

    await tx.checklistTemplate.update({
      where: { id: template.id },
      data: { activeVersionId: version.id, status: 'ACTIVE' },
    });

    return { templateId: template.id, templateVersionId: version.id };
  }

  private async notifyFinanceTeam(
    employeeId: string,
    employeeName: string,
    actorId: string,
  ): Promise<number> {
    const recipients = await this.prisma.employee.findMany({
      where: {
        id: { not: employeeId },
        status: { not: 'TERMINATED' },
        role: {
          permissions: {
            some: { permission: { module: 'FINANCE', action: 'VIEW' } },
          },
        },
      },
      select: { id: true },
      take: 25,
    });

    let sent = 0;
    for (const recipient of recipients) {
      if (recipient.id === actorId) continue;
      await this.notifications.create({
        recipientId: recipient.id,
        type: OFFBOARD_NOTIFICATION_TYPE,
        sourceModule: 'employees',
        title: 'Employee offboarding — final payroll',
        body: `${employeeName} was offboarded. Review final salary and bonus settlement.`,
        entityType: 'employee',
        entityId: employeeId,
        link: `/team?openEmployee=${encodeURIComponent(employeeId)}`,
        payload: { employeeId, employeeName },
        dedupeKey: `offboard-finance:${employeeId}:${recipient.id}`,
      });
      sent += 1;
    }
    return sent;
  }
}
