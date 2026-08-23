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
      await this.departmentEmployeeIds(actor, [scope]),
    );
  }

  async resolveDealWhere(actor: CallAccessActor): Promise<Prisma.DealWhereInput> {
    const scope = crmEditScope(actor.permissions, 'CRM_DEALS');
    return buildDealClickToCallWhere(
      scope,
      actor.employeeId,
      await this.departmentEmployeeIds(actor, [scope]),
    );
  }

  async resolveContactWhere(actor: CallAccessActor): Promise<Prisma.ContactWhereInput> {
    const leadsScope = crmEditScope(actor.permissions, 'CRM_LEADS');
    const dealsScope = crmEditScope(actor.permissions, 'CRM_DEALS');
    return buildContactClickToCallWhere({
      leadsScope,
      dealsScope,
      actorId: actor.employeeId,
      departmentEmployeeIds: await this.departmentEmployeeIds(actor, [leadsScope, dealsScope]),
    });
  }

  private async departmentEmployeeIds(
    actor: CallAccessActor,
    scopes: CallRbacScope[],
  ): Promise<string[]> {
    if (!scopes.includes('DEPARTMENT') || actor.departmentIds.length === 0) return [];
    const rows = await this.prisma.employeeDepartment.findMany({
      where: { departmentId: { in: actor.departmentIds } },
      select: { employeeId: true },
      distinct: ['employeeId'],
    });
    return rows.map((row) => row.employeeId);
  }
}
