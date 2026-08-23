import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import type { CurrentUserPayload } from '../../../common/decorators';
import type { AtsCallbackClient } from '../../integrations/ats/ats-callback.client';
import type { AtsCallRealtimePublisher } from '../../integrations/ats/ats-call-realtime.publisher';
import type { AuditService } from '../../audit/audit.service';
import { ACTOR_ID, COLLEAGUE_ID, DEPT_SALES, OTHER_EMPLOYEE_ID } from './call-access.test-support';
import { ClickToCallAccessPolicyService } from './click-to-call-access-policy.service';
import {
  buildContactClickToCallWhere,
  buildDealClickToCallWhere,
  buildLeadClickToCallWhere,
} from './click-to-call-access-where';
import { ClickToCallService } from './click-to-call.service';
import { ClickToCallTargetLoader } from './click-to-call-target';

const CONTACT_ID = 'contact-1';
const PHONE = '+37499111000';
const SIP = '3126107';
const CONTACT_ROW = { id: CONTACT_ID, phone: PHONE, extraPhones: [], trashedAt: null };
const CREATED_CALL = {
  id: 'call-1',
  uid: 'ctc:test',
  calldirect: '1',
  phone: PHONE,
  clid: PHONE,
  state: 'initiated',
  billsec: null,
  disposition: null,
  rate: null,
  leadId: null,
  contactId: CONTACT_ID,
  dealId: null,
  responsibleEmployeeId: ACTOR_ID,
  answeredEmployeeId: null,
  recordingStatus: null,
  createdAt: new Date('2026-08-22T10:00:00.000Z'),
  updatedAt: new Date('2026-08-22T10:00:00.000Z'),
  lead: null,
  contact: { firstName: 'Anna', lastName: 'Petrosyan' },
  deal: null,
  responsibleEmployee: { firstName: 'Edgar', lastName: 'Sargsyan' },
  answeredEmployee: null,
};

function user(
  permissions: Record<string, string>,
  departmentIds = [DEPT_SALES],
): CurrentUserPayload {
  return {
    id: ACTOR_ID,
    email: 'seller@nbos.test',
    role: 'seller',
    roleLevel: 1,
    departmentIds,
    firstName: 'Edgar',
    lastName: 'Sargsyan',
    permissions,
  };
}

function createHarness() {
  const prisma = createMockPrisma();
  prisma.employee.findUnique.mockResolvedValue({ sipId: SIP });
  prisma.atsCallEvent.findFirst.mockResolvedValue(null);
  prisma.atsCallEvent.create.mockResolvedValue(CREATED_CALL);
  prisma.atsCallIntent.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({
      id: 'intent-1',
      callId: null,
      atsUid: null,
      errorCode: null,
      ...data,
    }),
  );
  prisma.atsCallIntent.updateMany.mockResolvedValue({ count: 1 });
  const callback = { startCallbackCall: vi.fn().mockResolvedValue({ kind: 'accepted' }) };
  const audit = { log: vi.fn().mockResolvedValue({}) };
  const realtime = { publishStartedToEmployee: vi.fn().mockResolvedValue(undefined) };
  const service = new ClickToCallService(
    prisma as never,
    new ClickToCallTargetLoader(
      prisma as never,
      new ClickToCallAccessPolicyService(prisma as never),
    ),
    callback as unknown as AtsCallbackClient,
    audit as unknown as AuditService,
    realtime as unknown as AtsCallRealtimePublisher,
  );
  return { prisma, callback, audit, realtime, service };
}

function expectNoSideEffects(h: ReturnType<typeof createHarness>): void {
  expect(h.callback.startCallbackCall).not.toHaveBeenCalled();
  expect(h.prisma.atsCallEvent.create).not.toHaveBeenCalled();
  expect(h.prisma.atsCallIntent.create).not.toHaveBeenCalled();
  expect(h.realtime.publishStartedToEmployee).not.toHaveBeenCalled();
  expect(h.audit.log).not.toHaveBeenCalled();
}

async function startContact(service: ClickToCallService, actor: CurrentUserPayload) {
  return service.start(
    { targetType: 'CONTACT', targetId: CONTACT_ID },
    actor,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  );
}

describe('ClickToCallService Contact object-level access', () => {
  it.each([
    { name: 'primary Lead', permissions: { CRM_LEADS_EDIT: 'OWN' }, relation: 'leads' },
    {
      name: 'Lead.additionalContacts',
      permissions: { CRM_LEADS_EDIT: 'OWN' },
      relation: 'leadAdditionalLinks',
    },
    { name: 'primary Deal', permissions: { CRM_DEALS_EDIT: 'OWN' }, relation: 'deals' },
    {
      name: 'Deal.additionalContacts',
      permissions: { CRM_DEALS_EDIT: 'OWN' },
      relation: 'dealAdditionalLinks',
    },
  ])('OWN Seller can call Contact through $name', async ({ permissions, relation }) => {
    const h = createHarness();
    h.prisma.contact.findUnique.mockResolvedValue(CONTACT_ROW);
    h.prisma.contact.findFirst.mockResolvedValue(CONTACT_ROW);
    await startContact(h.service, user(permissions));
    const where = JSON.stringify(h.prisma.contact.findFirst.mock.calls[0]?.[0]?.where);
    expect(where).toContain(relation);
    expect(where).toContain(ACTOR_ID);
    expect(h.callback.startCallbackCall).toHaveBeenCalledWith({ from: SIP, to: '37499111000' });
    expect(h.prisma.contact.findFirst.mock.invocationCallOrder[0]).toBeLessThan(
      h.callback.startCallbackCall.mock.invocationCallOrder[0],
    );
  });

  it('denies Seller A calling Seller B or an arbitrary Contact UUID', async () => {
    for (const targetId of [CONTACT_ID, 'contact-foreign']) {
      const h = createHarness();
      h.prisma.contact.findUnique.mockResolvedValue({ id: targetId, trashedAt: null });
      h.prisma.contact.findFirst.mockResolvedValue(null);
      await expect(
        h.service.start(
          { targetType: 'CONTACT', targetId },
          user({ CRM_LEADS_EDIT: 'OWN', CRM_DEALS_EDIT: 'OWN' }),
          'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expectNoSideEffects(h);
      expect(h.prisma.contact.findFirst.mock.calls[0]?.[0]?.where).toEqual({
        id: targetId,
        AND: [
          buildContactClickToCallWhere({
            leadsScope: 'OWN',
            dealsScope: 'OWN',
            actorId: ACTOR_ID,
            departmentEmployeeIds: [],
          }),
        ],
      });
    }
  });

  it('denies unowned Contact for OWN and DEPARTMENT, allows ALL, denies NONE', async () => {
    const unowned = { id: CONTACT_ID, trashedAt: null };
    const own = createHarness();
    own.prisma.contact.findUnique.mockResolvedValue(unowned);
    own.prisma.contact.findFirst.mockResolvedValue(null);
    await expect(startContact(own.service, user({ CRM_LEADS_EDIT: 'OWN' }))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expectNoSideEffects(own);

    const dept = createHarness();
    dept.prisma.contact.findUnique.mockResolvedValue(unowned);
    dept.prisma.contact.findFirst.mockResolvedValue(null);
    dept.prisma.employeeDepartment.findMany.mockResolvedValue([]);
    await expect(
      startContact(dept.service, user({ CRM_LEADS_EDIT: 'DEPARTMENT' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expectNoSideEffects(dept);

    const all = createHarness();
    all.prisma.contact.findUnique.mockResolvedValue(CONTACT_ROW);
    all.prisma.contact.findFirst.mockResolvedValue(CONTACT_ROW);
    await startContact(all.service, user({ CRM_LEADS_EDIT: 'ALL' }));
    expect(all.callback.startCallbackCall).toHaveBeenCalled();
    expect(all.prisma.contact.findFirst.mock.calls[0]?.[0]?.where).toEqual({
      id: CONTACT_ID,
      AND: [{}],
    });

    const none = createHarness();
    none.prisma.contact.findUnique.mockResolvedValue(unowned);
    await expect(
      startContact(none.service, user({ CRM_LEADS_EDIT: 'NONE', CRM_DEALS_EDIT: 'NONE' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(none.prisma.contact.findFirst).not.toHaveBeenCalled();
    expectNoSideEffects(none);
  });

  it('DEPARTMENT allows department colleagues and denies other/missing membership', async () => {
    const actor = user({ CRM_LEADS_EDIT: 'DEPARTMENT' });
    const allowed = createHarness();
    allowed.prisma.contact.findUnique.mockResolvedValue(CONTACT_ROW);
    allowed.prisma.contact.findFirst.mockResolvedValue(CONTACT_ROW);
    allowed.prisma.employeeDepartment.findMany.mockResolvedValue([{ employeeId: COLLEAGUE_ID }]);
    await startContact(allowed.service, actor);
    expect(allowed.prisma.employeeDepartment.findMany).toHaveBeenCalledWith({
      where: { departmentId: { in: [DEPT_SALES] } },
      select: { employeeId: true },
      distinct: ['employeeId'],
    });
    expect(allowed.prisma.contact.findFirst.mock.calls[0]?.[0]?.where).toEqual({
      id: CONTACT_ID,
      AND: [
        buildContactClickToCallWhere({
          leadsScope: 'DEPARTMENT',
          dealsScope: 'NONE',
          actorId: ACTOR_ID,
          departmentEmployeeIds: [COLLEAGUE_ID],
        }),
      ],
    });

    for (const members of [[{ employeeId: OTHER_EMPLOYEE_ID }], []]) {
      const denied = createHarness();
      denied.prisma.contact.findUnique.mockResolvedValue({ id: CONTACT_ID, trashedAt: null });
      denied.prisma.contact.findFirst.mockResolvedValue(null);
      denied.prisma.employeeDepartment.findMany.mockResolvedValue(members);
      await expect(startContact(denied.service, actor)).rejects.toBeInstanceOf(ForbiddenException);
      expectNoSideEffects(denied);
    }
  });

  it('denies trashed Contact and does not treat trashed Lead/Deal as ownership', async () => {
    const trashed = createHarness();
    trashed.prisma.contact.findUnique.mockResolvedValue({
      id: CONTACT_ID,
      trashedAt: new Date('2026-08-01T00:00:00.000Z'),
    });
    await expect(startContact(trashed.service, user({ CRM_LEADS_EDIT: 'ALL' }))).rejects.toThrow(
      /Trash/,
    );
    expect(trashed.prisma.contact.findFirst).not.toHaveBeenCalled();
    expectNoSideEffects(trashed);

    const own = buildContactClickToCallWhere({
      leadsScope: 'OWN',
      dealsScope: 'OWN',
      actorId: ACTOR_ID,
      departmentEmployeeIds: [],
    });
    expect(JSON.stringify(own)).toContain('"trashedAt":null');
  });

  it('does not put the phone in audit changes on allow', async () => {
    const h = createHarness();
    h.prisma.contact.findUnique.mockResolvedValue(CONTACT_ROW);
    h.prisma.contact.findFirst.mockResolvedValue(CONTACT_ROW);
    await startContact(h.service, user({ CRM_LEADS_EDIT: 'ALL' }));
    expect(h.audit.log).toHaveBeenCalled();
    expect(JSON.stringify(h.audit.log.mock.calls[0])).not.toContain('37499111000');
    expect(h.realtime.publishStartedToEmployee).toHaveBeenCalledWith('call-1', ACTOR_ID);
  });
});

describe('ClickToCallService Lead/Deal object-level access', () => {
  it('DEPARTMENT on Lead/Deal uses assignment, not the scope label', async () => {
    const h = createHarness();
    h.prisma.lead.findUnique.mockResolvedValue({ id: 'lead-1', trashedAt: null });
    h.prisma.lead.findFirst.mockResolvedValue({
      id: 'lead-1',
      phone: PHONE,
      contactId: null,
      assignedTo: COLLEAGUE_ID,
    });
    h.prisma.employeeDepartment.findMany.mockResolvedValue([{ employeeId: COLLEAGUE_ID }]);
    await h.service.start(
      { targetType: 'LEAD', targetId: 'lead-1' },
      user({ CRM_LEADS_EDIT: 'DEPARTMENT' }),
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
    expect(h.prisma.lead.findFirst.mock.calls[0]?.[0]?.where).toEqual({
      id: 'lead-1',
      AND: [buildLeadClickToCallWhere('DEPARTMENT', ACTOR_ID, [COLLEAGUE_ID])],
    });
    expect(h.callback.startCallbackCall).toHaveBeenCalled();
  });

  it('denies Deal DEPARTMENT when the seller is outside the actor department', async () => {
    const h = createHarness();
    h.prisma.deal.findUnique.mockResolvedValue({ id: 'deal-1', trashedAt: null });
    h.prisma.deal.findFirst.mockResolvedValue(null);
    h.prisma.employeeDepartment.findMany.mockResolvedValue([]);
    await expect(
      h.service.start(
        { targetType: 'DEAL', targetId: 'deal-1' },
        user({ CRM_DEALS_EDIT: 'DEPARTMENT' }),
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(h.prisma.deal.findFirst.mock.calls[0]?.[0]?.where).toEqual({
      id: 'deal-1',
      AND: [buildDealClickToCallWhere('DEPARTMENT', ACTOR_ID, [])],
    });
    expectNoSideEffects(h);
  });
});
