import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import type { CallAccessActor, CallRbacScope } from './call-access.types';
import {
  buildContactClickToCallWhere,
  buildDealClickToCallWhere,
  buildLeadClickToCallWhere,
  crmEditScope,
} from './click-to-call-access-where';

@Injectable()
export class ClickToCallAccessPolicyService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async resolveLeadWhere(actor: CallAccessActor): Promise<Prisma.LeadWhereInput> {
    const scope = crmEditScope(actor.permissions, 'CRM_LEADS');
    return buildLeadClickToCallWhere(
      scope,
      actor.employeeId,
      await this.departmentEmployeeIds(actor, scope, 'CRM_LEADS_EDIT'),
    );
  }

  async resolveDealWhere(actor: CallAccessActor): Promise<Prisma.DealWhereInput> {
    const scope = crmEditScope(actor.permissions, 'CRM_DEALS');
    return buildDealClickToCallWhere(
      scope,
      actor.employeeId,
      await this.departmentEmployeeIds(actor, scope, 'CRM_DEALS_EDIT'),
    );
  }

  async resolveContactWhere(actor: CallAccessActor): Promise<Prisma.ContactWhereInput> {
    const leadsScope = crmEditScope(actor.permissions, 'CRM_LEADS');
    const dealsScope = crmEditScope(actor.permissions, 'CRM_DEALS');
    return buildContactClickToCallWhere({
      leadsScope,
      dealsScope,
      actorId: actor.employeeId,
      departmentEmployeeIds: [],
      leadDepartmentEmployeeIds: await this.departmentEmployeeIds(
        actor,
        leadsScope,
        'CRM_LEADS_EDIT',
      ),
      dealDepartmentEmployeeIds: await this.departmentEmployeeIds(
        actor,
        dealsScope,
        'CRM_DEALS_EDIT',
      ),
    });
  }

  private async departmentEmployeeIds(
    actor: CallAccessActor,
    scope: CallRbacScope,
    permission: string,
  ): Promise<string[]> {
    const departmentIds = actor.permissionDepartmentIds
      ? (actor.permissionDepartmentIds[permission] ?? [])
      : actor.departmentIds;
    if (scope !== 'DEPARTMENT' || departmentIds.length === 0) return [];
    const rows = await this.prisma.employeeDepartment.findMany({
      where: { departmentId: { in: departmentIds } },
      select: { employeeId: true },
      distinct: ['employeeId'],
    });
    return rows.map((row) => row.employeeId);
  }
}
