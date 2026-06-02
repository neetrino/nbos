import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, type InputJsonValue, type TransactionClient } from '@nbos/database';
import {
  buildEmployeeOnboardingSnapshotItems,
  canEmployeeReactivate,
  EMPLOYEE_ONBOARDING_OWNER_TYPE,
  EMPLOYEE_ONBOARDING_TEMPLATE_NAME,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import type {
  EmployeeReactivationResult,
  EmployeeReactivationTargetStatus,
} from './employee-reactivation.types';

@Injectable()
export class EmployeeReactivationService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AuditService,
  ) {}

  async execute(
    employeeId: string,
    actorId: string,
    actorRoleSlug: string,
    input: { status: EmployeeReactivationTargetStatus },
  ): Promise<EmployeeReactivationResult> {
    await this.assertCanReactivate(actorId, actorRoleSlug);

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        fireDate: true,
      },
    });
    if (!employee) throw new NotFoundException(`Employee ${employeeId} not found`);
    if (employee.status !== 'TERMINATED') {
      throw new BadRequestException('Only terminated employees can be reactivated');
    }

    const autoCompletedKeys = new Set(['profile_active', 'platform_access']);
    const previousFireDate = employee.fireDate?.toISOString() ?? null;

    const result = await this.prisma.$transaction(async (tx) => {
      const templateIds = await this.ensureOnboardingTemplate(tx, actorId);
      const snapshot = buildEmployeeOnboardingSnapshotItems({ autoCompletedKeys });

      const checklistInstance = await tx.checklistInstance.create({
        data: {
          templateId: templateIds.templateId,
          templateVersionId: templateIds.templateVersionId,
          ownerEntityType: EMPLOYEE_ONBOARDING_OWNER_TYPE,
          ownerEntityId: employeeId,
          snapshotItems: snapshot as unknown as InputJsonValue,
        },
      });

      const updated = await tx.employee.update({
        where: { id: employeeId },
        data: {
          status: input.status,
          fireDate: null,
        },
      });

      return { updated, checklistInstanceId: checklistInstance.id };
    });

    await this.audit.log({
      entityType: 'employee',
      entityId: employeeId,
      action: 'employee.reactivate',
      userId: actorId,
      changes: {
        status: result.updated.status,
        previousFireDate,
        checklistInstanceId: result.checklistInstanceId,
      } as unknown as InputJsonValue,
    });

    return {
      employeeId,
      status: result.updated.status,
      fireDate: null,
      checklistInstanceId: result.checklistInstanceId,
      previousFireDate,
    };
  }

  private async assertCanReactivate(actorId: string, actorRoleSlug: string): Promise<void> {
    const departmentSlugs = await this.loadActorDepartmentSlugs(actorId);
    if (!canEmployeeReactivate({ roleSlug: actorRoleSlug, departmentSlugs })) {
      throw new ForbiddenException('Only Owner, CEO, or HR can reactivate employees');
    }
  }

  private async loadActorDepartmentSlugs(actorId: string): Promise<string[]> {
    const rows = await this.prisma.employeeDepartment.findMany({
      where: { employeeId: actorId },
      select: { department: { select: { slug: true } } },
    });
    return rows.map((row) => row.department.slug);
  }

  private async ensureOnboardingTemplate(
    tx: TransactionClient,
    actorId: string,
  ): Promise<{ templateId: string; templateVersionId: string }> {
    const existing = await tx.checklistTemplate.findFirst({
      where: {
        name: EMPLOYEE_ONBOARDING_TEMPLATE_NAME,
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
            name: EMPLOYEE_ONBOARDING_TEMPLATE_NAME,
            description: 'System template for employee onboarding and rehire checklist',
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
        items: buildEmployeeOnboardingSnapshotItems({
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
}
