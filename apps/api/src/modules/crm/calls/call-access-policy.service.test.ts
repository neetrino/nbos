import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { CallAccessPolicyService } from './call-access-policy.service';
import {
  ALL_ACTOR,
  ACTOR_ID,
  COLLEAGUE_ID,
  DEPARTMENT_ACTOR,
  DEPT_OTHER,
  DEPT_SALES,
  EDIT_ALL_ACTOR,
  EDIT_DEPARTMENT_ACTOR,
  EDIT_NONE_ACTOR,
  EDIT_OWN_ACTOR,
  NONE_ACTOR,
  OWN_ACTOR,
  VIEW_ONLY_ALL_ACTOR,
  callActor,
} from './call-access.test-support';
import { buildCallAccessWhere, CALL_ACCESS_DENIED_WHERE } from './call-access.where';
import { CALL_NOTE_EDIT_FORBIDDEN_MESSAGE } from './calls.constants';

describe('CallAccessPolicyService', () => {
  it('returns a deny predicate for NONE without loading departments', async () => {
    const prisma = createMockPrisma();
    const policy = new CallAccessPolicyService(prisma as never);

    await expect(policy.resolveAccessWhere(NONE_ACTOR)).resolves.toEqual(CALL_ACCESS_DENIED_WHERE);
    expect(prisma.employeeDepartment.findMany).not.toHaveBeenCalled();
  });

  it('does not query departments for OWN or ALL', async () => {
    const prisma = createMockPrisma();
    const policy = new CallAccessPolicyService(prisma as never);

    await policy.resolveAccessWhere(OWN_ACTOR);
    await policy.resolveAccessWhere(ALL_ACTOR);
    expect(prisma.employeeDepartment.findMany).not.toHaveBeenCalled();
  });

  it('loads EmployeeDepartment membership for DEPARTMENT', async () => {
    const prisma = createMockPrisma();
    prisma.employeeDepartment.findMany.mockResolvedValue([{ employeeId: COLLEAGUE_ID }]);
    const policy = new CallAccessPolicyService(prisma as never);

    const where = await policy.resolveAccessWhere(DEPARTMENT_ACTOR);

    expect(prisma.employeeDepartment.findMany).toHaveBeenCalledWith({
      where: { departmentId: { in: [DEPT_SALES] } },
      select: { employeeId: true },
      distinct: ['employeeId'],
    });
    expect(where).toEqual(
      buildCallAccessWhere({
        leadsScope: 'DEPARTMENT',
        dealsScope: 'DEPARTMENT',
        actorId: ACTOR_ID,
        departmentEmployeeIds: [COLLEAGUE_ID],
      }),
    );
  });

  it('does not treat DEPARTMENT as ALL when the actor has no matching department', async () => {
    const prisma = createMockPrisma();
    prisma.employeeDepartment.findMany.mockResolvedValue([]);
    const policy = new CallAccessPolicyService(prisma as never);
    const otherDept = callActor({
      departmentIds: [DEPT_OTHER],
      permissions: { CRM_LEADS_VIEW: 'DEPARTMENT', CRM_DEALS_VIEW: 'DEPARTMENT' },
    });

    const where = await policy.resolveAccessWhere(otherDept);
    expect(where).toEqual(
      buildCallAccessWhere({
        leadsScope: 'DEPARTMENT',
        dealsScope: 'DEPARTMENT',
        actorId: ACTOR_ID,
        departmentEmployeeIds: [],
      }),
    );
    expect(JSON.stringify(where)).not.toEqual(JSON.stringify({}));
  });

  it('throws NotFound when the call does not exist', async () => {
    const prisma = createMockPrisma();
    prisma.atsCallEvent.findUnique.mockResolvedValue(null);
    const policy = new CallAccessPolicyService(prisma as never);

    await expect(policy.assertCanAccessCall(OWN_ACTOR, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.atsCallEvent.findFirst).not.toHaveBeenCalled();
  });

  it('throws Forbidden when the call exists but the access predicate misses it', async () => {
    const prisma = createMockPrisma();
    prisma.atsCallEvent.findUnique.mockResolvedValue({ id: 'call-1' });
    prisma.atsCallEvent.findFirst.mockResolvedValue(null);
    const policy = new CallAccessPolicyService(prisma as never);

    await expect(policy.assertCanAccessCall(OWN_ACTOR, 'call-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.atsCallEvent.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { id: true },
        where: { id: 'call-1', AND: [await policy.resolveAccessWhere(OWN_ACTOR)] },
      }),
    );
  });
});

describe('CallAccessPolicyService editNote', () => {
  it('uses CRM_*_EDIT scopes rather than VIEW', async () => {
    const prisma = createMockPrisma();
    const policy = new CallAccessPolicyService(prisma as never);

    await expect(policy.resolveAccessWhere(VIEW_ONLY_ALL_ACTOR, 'editNote')).resolves.toEqual(
      CALL_ACCESS_DENIED_WHERE,
    );
    await expect(policy.resolveAccessWhere(EDIT_OWN_ACTOR, 'editNote')).resolves.toEqual(
      buildCallAccessWhere({
        leadsScope: 'OWN',
        dealsScope: 'OWN',
        actorId: ACTOR_ID,
        departmentEmployeeIds: [],
      }),
    );
    await expect(policy.resolveAccessWhere(EDIT_ALL_ACTOR, 'editNote')).resolves.toEqual({});
  });

  it('denies VIEW-only actors before treating the Call as editable', async () => {
    const prisma = createMockPrisma();
    prisma.atsCallEvent.findUnique.mockResolvedValue({ id: 'call-1' });
    prisma.atsCallEvent.findFirst
      .mockResolvedValueOnce({ id: 'call-1' })
      .mockResolvedValueOnce(null);
    const policy = new CallAccessPolicyService(prisma as never);

    await expect(
      policy.assertCanAccessCall(VIEW_ONLY_ALL_ACTOR, 'call-1', 'editNote'),
    ).rejects.toMatchObject({
      response: { message: CALL_NOTE_EDIT_FORBIDDEN_MESSAGE },
    });
  });

  it('denies EDIT NONE even when VIEW is ALL', async () => {
    const prisma = createMockPrisma();
    prisma.atsCallEvent.findUnique.mockResolvedValue({ id: 'call-1' });
    prisma.atsCallEvent.findFirst
      .mockResolvedValueOnce({ id: 'call-1' })
      .mockResolvedValueOnce(null);
    const policy = new CallAccessPolicyService(prisma as never);

    await expect(
      policy.assertCanAccessCall(EDIT_NONE_ACTOR, 'call-1', 'editNote'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('loads EmployeeDepartment for EDIT DEPARTMENT and not for another department', async () => {
    const prisma = createMockPrisma();
    prisma.employeeDepartment.findMany.mockResolvedValue([{ employeeId: COLLEAGUE_ID }]);
    const policy = new CallAccessPolicyService(prisma as never);

    await expect(policy.resolveAccessWhere(EDIT_DEPARTMENT_ACTOR, 'editNote')).resolves.toEqual(
      buildCallAccessWhere({
        leadsScope: 'DEPARTMENT',
        dealsScope: 'DEPARTMENT',
        actorId: ACTOR_ID,
        departmentEmployeeIds: [COLLEAGUE_ID],
      }),
    );

    prisma.employeeDepartment.findMany.mockResolvedValue([]);
    const otherDept = callActor({
      departmentIds: [DEPT_OTHER],
      permissions: {
        CRM_LEADS_VIEW: 'DEPARTMENT',
        CRM_DEALS_VIEW: 'DEPARTMENT',
        CRM_LEADS_EDIT: 'DEPARTMENT',
        CRM_DEALS_EDIT: 'DEPARTMENT',
      },
    });
    const where = await policy.resolveAccessWhere(otherDept, 'editNote');
    expect(JSON.stringify(where)).not.toContain(COLLEAGUE_ID);
    expect(JSON.stringify(where)).not.toEqual(JSON.stringify({}));
  });
});
