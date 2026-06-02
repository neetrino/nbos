import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type PlatformResourceFamilyEnum,
  type PlatformAccessActionEnum,
  type AccessScopeModeEnum,
} from '@nbos/database';
import type { PlatformResourceFamily } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';

export interface EmployeeAccessOverrideDto {
  resourceFamily: PlatformResourceFamily;
  level: PlatformAccessActionEnum;
  scopeMode?: AccessScopeModeEnum | null;
  reason?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
}

@Injectable()
export class EmployeeAccessOverrideService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AuditService,
  ) {}

  async listByEmployee(employeeId: string) {
    await this.assertEmployeeExists(employeeId);
    return this.prisma.employeeAccessOverride.findMany({
      where: { employeeId },
      orderBy: { resourceFamily: 'asc' },
    });
  }

  async upsert(employeeId: string, dto: EmployeeAccessOverrideDto, actorId: string) {
    await this.assertEmployeeExists(employeeId);
    const row = await this.prisma.employeeAccessOverride.upsert({
      where: {
        employeeId_resourceFamily: {
          employeeId,
          resourceFamily: dto.resourceFamily as PlatformResourceFamilyEnum,
        },
      },
      create: {
        employeeId,
        resourceFamily: dto.resourceFamily as PlatformResourceFamilyEnum,
        level: dto.level,
        scopeMode: dto.scopeMode ?? undefined,
        reason: dto.reason ?? undefined,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
        createdById: actorId,
      },
      update: {
        level: dto.level,
        scopeMode: dto.scopeMode ?? null,
        reason: dto.reason ?? null,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      },
    });
    await this.audit.log({
      entityType: 'employee',
      entityId: employeeId,
      action: 'employee.access_override.upserted',
      userId: actorId,
      changes: {
        resourceFamily: dto.resourceFamily,
        level: dto.level,
        scopeMode: dto.scopeMode,
        reason: dto.reason?.trim() || null,
      },
    });
    return row;
  }

  async remove(
    employeeId: string,
    resourceFamily: PlatformResourceFamily,
    actorId: string,
    changeReason?: string | null,
  ) {
    await this.assertEmployeeExists(employeeId);
    const existing = await this.prisma.employeeAccessOverride.findUnique({
      where: {
        employeeId_resourceFamily: {
          employeeId,
          resourceFamily: resourceFamily as PlatformResourceFamilyEnum,
        },
      },
    });
    if (!existing) {
      throw new NotFoundException(
        `Override ${resourceFamily} not found for employee ${employeeId}`,
      );
    }
    await this.prisma.employeeAccessOverride.delete({
      where: { id: existing.id },
    });
    await this.audit.log({
      entityType: 'employee',
      entityId: employeeId,
      action: 'employee.access_override.removed',
      userId: actorId,
      changes: { resourceFamily, changeReason: changeReason?.trim() || null },
    });
    return { removed: true };
  }

  private async assertEmployeeExists(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });
    if (!employee) throw new NotFoundException(`Employee ${employeeId} not found`);
  }
}
