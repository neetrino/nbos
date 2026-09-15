import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { CALLS_VIEW_PERMISSION } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import {
  callAccessPermissionAction,
  type CallAccessActor,
  type CallAccessCapability,
} from './call-access.types';
import {
  buildCallAccessWhere,
  CALL_ACCESS_DENIED_WHERE,
  normalizeCallRbacScope,
} from './call-access.where';
import {
  buildCallJournalAccessWhere,
  buildJournalCrmAssignmentWhere,
} from './call-journal-access.where';
import { CALL_NOTE_EDIT_FORBIDDEN_MESSAGE, CALL_VIEW_FORBIDDEN_MESSAGE } from './calls.constants';

const CALL_ID_SELECT = { id: true } as const;

@Injectable()
export class CallAccessPolicyService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  /**
   * Prisma access predicate shared by list `findMany`/`count` and object checks.
   * `view` uses CRM_*_VIEW; `editNote` uses CRM_*_EDIT. Same Lead/Deal/Call relations.
   */
  async resolveAccessWhere(
    actor: CallAccessActor,
    capability: CallAccessCapability = 'view',
  ): Promise<Prisma.AtsCallEventWhereInput> {
    const action = callAccessPermissionAction(capability);
    const leadsScope = normalizeCallRbacScope(actor.permissions[`CRM_LEADS_${action}`]);
    const dealsScope = normalizeCallRbacScope(actor.permissions[`CRM_DEALS_${action}`]);
    if (leadsScope === 'NONE' && dealsScope === 'NONE') return CALL_ACCESS_DENIED_WHERE;

    const [leadDepartmentEmployeeIds, dealDepartmentEmployeeIds] = await Promise.all([
      leadsScope === 'DEPARTMENT'
        ? this.loadDepartmentEmployeeIds(callDepartmentIds(actor, `CRM_LEADS_${action}`))
        : [],
      dealsScope === 'DEPARTMENT'
        ? this.loadDepartmentEmployeeIds(callDepartmentIds(actor, `CRM_DEALS_${action}`))
        : [],
    ]);
    return buildCallAccessWhere({
      leadsScope,
      dealsScope,
      actorId: actor.employeeId,
      departmentEmployeeIds: [],
      leadDepartmentEmployeeIds,
      dealDepartmentEmployeeIds,
    });
  }

  /**
   * Object-level gate. Loads only `{ id }` until authorization succeeds.
   * `editNote` requires the actor to view the Call and to hold CRM EDIT on it.
   */
  async assertCanAccessCall(
    actor: CallAccessActor,
    callId: string,
    capability: CallAccessCapability = 'view',
  ): Promise<Prisma.AtsCallEventWhereInput> {
    const existing = await this.prisma.atsCallEvent.findUnique({
      where: { id: callId },
      select: CALL_ID_SELECT,
    });
    if (!existing) throw new NotFoundException(`Call ${callId} not found`);

    const viewWhere = await this.assertCallMatches(
      actor,
      callId,
      'view',
      CALL_VIEW_FORBIDDEN_MESSAGE,
    );
    if (capability === 'view') return viewWhere;
    await this.assertCallMatches(actor, callId, capability, CALL_NOTE_EDIT_FORBIDDEN_MESSAGE);
    return viewWhere;
  }

  private async assertCallMatches(
    actor: CallAccessActor,
    callId: string,
    capability: CallAccessCapability,
    message: string,
  ): Promise<Prisma.AtsCallEventWhereInput> {
    const accessWhere = await this.resolveAccessWhere(actor, capability);
    const allowed = await this.prisma.atsCallEvent.findFirst({
      where: { id: callId, AND: [accessWhere] },
      select: CALL_ID_SELECT,
    });
    if (!allowed) throw new ForbiddenException(message);
    return accessWhere;
  }

  /** Company journal: CALLS scope, plus OWN CRM assignment when the actor has CRM VIEW. */
  async resolveJournalAccessWhere(actor: CallAccessActor): Promise<Prisma.AtsCallEventWhereInput> {
    const callsScope = normalizeCallRbacScope(actor.permissions[CALLS_VIEW_PERMISSION]);
    if (callsScope === 'ALL') return {};
    const departmentEmployeeIds =
      callsScope === 'DEPARTMENT'
        ? await this.loadDepartmentEmployeeIds(callDepartmentIds(actor, CALLS_VIEW_PERMISSION))
        : [];
    return buildCallJournalAccessWhere({
      callsScope,
      actorId: actor.employeeId,
      departmentEmployeeIds,
      crmWhere: buildJournalCrmAssignmentWhere({
        leadsScope: normalizeCallRbacScope(actor.permissions.CRM_LEADS_VIEW),
        dealsScope: normalizeCallRbacScope(actor.permissions.CRM_DEALS_VIEW),
        actorId: actor.employeeId,
      }),
    });
  }

  /** Playback / journal detail: CALLS journal predicate or existing CRM Call VIEW. */
  async assertCanViewCallForJournalOrCrm(actor: CallAccessActor, callId: string): Promise<void> {
    const existing = await this.prisma.atsCallEvent.findUnique({
      where: { id: callId },
      select: CALL_ID_SELECT,
    });
    if (!existing) throw new NotFoundException(`Call ${callId} not found`);

    const accessWhere = await this.resolveJournalAccessWhere(actor);
    const allowed = await this.prisma.atsCallEvent.findFirst({
      where: { id: callId, AND: [accessWhere] },
      select: CALL_ID_SELECT,
    });
    if (!allowed) throw new ForbiddenException(CALL_VIEW_FORBIDDEN_MESSAGE);
  }

  private async loadDepartmentEmployeeIds(departmentIds: string[]): Promise<string[]> {
    if (departmentIds.length === 0) return [];
    const rows = await this.prisma.employeeDepartment.findMany({
      where: { departmentId: { in: departmentIds } },
      select: { employeeId: true },
      distinct: ['employeeId'],
    });
    return rows.map((row) => row.employeeId);
  }
}

function callDepartmentIds(actor: CallAccessActor, permission: string): string[] {
  if (!actor.permissionDepartmentIds) return actor.departmentIds;
  return actor.permissionDepartmentIds[permission] ?? [];
}
