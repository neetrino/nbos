import { BadGatewayException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import type { CurrentUserPayload } from '../../../common/decorators';
import type { AtsCallRealtimePublisher } from '../../integrations/ats/ats-call-realtime.publisher';
import type { AuditService } from '../../audit/audit.service';
import type { AtsCallbackClient } from '../../integrations/ats/ats-callback.client';
import { CALL_LIST_SELECT } from './call-list.select';
import { ClickToCallAccessPolicyService } from './click-to-call-access-policy.service';
import { ClickToCallService } from './click-to-call.service';
import { ClickToCallTargetLoader } from './click-to-call-target';
import { CLICK_TO_CALL_MISSING_SIP_MESSAGE } from './click-to-call.constants';

const USER: CurrentUserPayload = {
  id: 'emp-1',
  email: 'seller@nbos.test',
  role: 'seller',
  roleLevel: 1,
  departmentIds: [],
  firstName: 'Edgar',
  lastName: 'Sargsyan',
  permissions: { CRM_LEADS_EDIT: 'ALL', CRM_LEADS_VIEW: 'ALL' },
};

const LEAD = {
  id: 'lead-1',
  phone: '+37499123456',
  contactId: null,
  assignedTo: 'emp-1',
  trashedAt: null,
};

const CREATED_CALL = {
  id: 'call-1',
  uid: 'ctc:test',
  calldirect: '1',
  phone: '+37499123456',
  clid: '+37499123456',
  state: 'initiated',
  billsec: null,
  disposition: null,
  rate: null,
  leadId: 'lead-1',
  contactId: null,
  dealId: null,
  responsibleEmployeeId: 'emp-1',
  answeredEmployeeId: null,
  recordingStatus: null,
  createdAt: new Date('2026-08-21T10:00:00.000Z'),
  updatedAt: new Date('2026-08-21T10:00:00.000Z'),
  lead: { name: 'Website', contactName: 'Incoming call' },
  contact: null,
  deal: null,
  responsibleEmployee: { firstName: 'Edgar', lastName: 'Sargsyan' },
  answeredEmployee: null,
};

function createService(options?: {
  startCallback?: AtsCallbackClient['startCallbackCall'];
  sipId?: string | null;
  permissions?: Record<string, string>;
}) {
  const prisma = createMockPrisma();
  prisma.lead.findUnique.mockResolvedValue(LEAD);
  prisma.lead.findFirst.mockResolvedValue(LEAD);
  prisma.employee.findUnique.mockResolvedValue({
    sipId: options && 'sipId' in options ? options.sipId : '3126107',
  });
  prisma.atsCallEvent.findFirst.mockResolvedValue(null);
  prisma.atsCallEvent.create.mockResolvedValue(CREATED_CALL);
  const callback = {
    startCallbackCall: options?.startCallback ?? vi.fn().mockResolvedValue({ success: true }),
  } as unknown as AtsCallbackClient;
  const audit = { log: vi.fn().mockResolvedValue({}) } as unknown as AuditService;
  const realtime = {
    publishStartedToEmployee: vi.fn().mockResolvedValue(undefined),
  } as unknown as AtsCallRealtimePublisher;
  const service = new ClickToCallService(
    prisma as never,
    new ClickToCallTargetLoader(
      prisma as never,
      new ClickToCallAccessPolicyService(prisma as never),
    ),
    callback,
    audit,
    realtime,
  );
  const user = { ...USER, permissions: options?.permissions ?? USER.permissions };
  return { service, prisma, callback, audit, user };
}

describe('ClickToCallService', () => {
  it('lets an authorized user start a call', async () => {
    const { service, prisma, callback, audit, user } = createService();

    const result = await service.start({ targetType: 'LEAD', targetId: 'lead-1' }, user);

    expect(callback.startCallbackCall).toHaveBeenCalledWith({
      from: '3126107',
      to: '37499123456',
    });
    expect(prisma.atsCallEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          calldirect: '1',
          source: 'CLICK_TO_CALL',
          state: 'initiated',
          leadId: 'lead-1',
          initiatedByEmployeeId: 'emp-1',
        }),
        select: CALL_LIST_SELECT,
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CALL_INITIATED',
        entityType: 'CALL',
        userId: 'emp-1',
        changes: expect.objectContaining({
          targetType: 'LEAD',
          targetId: 'lead-1',
          userId: 'emp-1',
        }),
      }),
    );
    expect(JSON.stringify(vi.mocked(audit.log).mock.calls[0])).not.toContain('37499123456');
    expect(result).toMatchObject({ type: 'CALL', direction: 'OUTBOUND', status: 'initiated' });
    expect(prisma.lead.findFirst.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(callback.startCallbackCall).mock.invocationCallOrder[0],
    );
  });

  it('forbids OWN access to someone else Lead before ATS', async () => {
    const { service, prisma, callback, user } = createService({
      permissions: { CRM_LEADS_EDIT: 'OWN', CRM_LEADS_VIEW: 'OWN' },
    });
    prisma.lead.findFirst.mockResolvedValue(null);

    await expect(
      service.start({ targetType: 'LEAD', targetId: 'lead-1' }, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(callback.startCallbackCall).not.toHaveBeenCalled();
    expect(prisma.atsCallEvent.create).not.toHaveBeenCalled();
  });

  it('forbids a user without CALL_CREATE', async () => {
    const { service, callback, user } = createService({
      permissions: { CRM_LEADS_VIEW: 'ALL', CRM_LEADS_EDIT: 'NONE' },
    });

    await expect(
      service.start({ targetType: 'LEAD', targetId: 'lead-1' }, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(callback.startCallbackCall).not.toHaveBeenCalled();
  });

  it('returns 4xx when the employee has no SIP extension', async () => {
    const { service, callback, user } = createService({ sipId: null });

    await expect(service.start({ targetType: 'LEAD', targetId: 'lead-1' }, user)).rejects.toEqual(
      expect.objectContaining({
        message: CLICK_TO_CALL_MISSING_SIP_MESSAGE,
      }),
    );
    expect(callback.startCallbackCall).not.toHaveBeenCalled();
  });

  it('handles an ATS callback error', async () => {
    const { service, prisma, user } = createService({
      startCallback: vi.fn().mockResolvedValue({ success: false }),
    });

    await expect(
      service.start({ targetType: 'LEAD', targetId: 'lead-1' }, user),
    ).rejects.toBeInstanceOf(BadGatewayException);
    expect(prisma.atsCallEvent.create).not.toHaveBeenCalled();
  });
});
