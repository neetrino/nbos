import {
  BadGatewayException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import type { CurrentUserPayload } from '../../../common/decorators';
import type { AtsCallRealtimePublisher } from '../../integrations/ats/ats-call-realtime.publisher';
import type { AuditService } from '../../audit/audit.service';
import type { AtsCallbackClient } from '../../integrations/ats/ats-callback.client';
import { ClickToCallAccessPolicyService } from './click-to-call-access-policy.service';
import { ClickToCallInProgressException } from './click-to-call-exceptions';
import { ClickToCallService } from './click-to-call.service';
import { ClickToCallTargetLoader } from './click-to-call-target';
import { requireClickToCallIdempotencyKey } from './click-to-call-idempotency';

const IDEMPOTENCY_KEY = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

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

const OTHER: CurrentUserPayload = { ...USER, id: 'emp-2', email: 'other@nbos.test' };

const LEAD = {
  id: 'lead-1',
  phone: '+37499123456',
  contactId: null,
  assignedTo: 'emp-1',
  trashedAt: null,
};

const CALL = {
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

function pendingIntent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'intent-1',
    employeeId: 'emp-1',
    idempotencyKey: IDEMPOTENCY_KEY,
    fingerprint: 'emp-1:LEAD:lead-1',
    targetType: 'LEAD',
    targetId: 'lead-1',
    status: 'PENDING',
    callId: null,
    atsUid: null,
    errorCode: null,
    ...overrides,
  };
}

function createIdempotencyService(options?: {
  startCallback?: AtsCallbackClient['startCallbackCall'];
  createIntent?: ReturnType<typeof vi.fn>;
}) {
  const prisma = createMockPrisma();
  prisma.lead.findUnique.mockResolvedValue(LEAD);
  prisma.lead.findFirst.mockResolvedValue(LEAD);
  prisma.employee.findUnique.mockResolvedValue({ sipId: '3126107' });
  prisma.atsCallEvent.findFirst.mockResolvedValue(null);
  prisma.atsCallEvent.create.mockResolvedValue(CALL);
  prisma.atsCallEvent.findUnique.mockResolvedValue(CALL);
  prisma.atsCallIntent.create.mockImplementation(
    options?.createIntent ??
      (({ data }: { data: Record<string, unknown> }) => Promise.resolve(pendingIntent(data))),
  );
  prisma.atsCallIntent.updateMany.mockResolvedValue({ count: 1 });
  prisma.atsCallIntent.findUnique.mockResolvedValue(null);
  const callback = {
    startCallbackCall: options?.startCallback ?? vi.fn().mockResolvedValue({ kind: 'accepted' }),
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
  return { service, prisma, callback, audit, user: USER };
}

describe('ClickToCallService idempotency', () => {
  it('invokes ATS once on the first request', async () => {
    const { service, callback, user } = createIdempotencyService();
    await service.start({ targetType: 'LEAD', targetId: 'lead-1' }, user, IDEMPOTENCY_KEY);
    expect(callback.startCallbackCall).toHaveBeenCalledOnce();
  });

  it('returns the existing ACCEPTED result without a second ATS call or audit', async () => {
    const { service, prisma, callback, audit, user } = createIdempotencyService({
      createIntent: vi.fn().mockRejectedValue({
        code: 'P2002',
        meta: { target: ['employeeId', 'idempotencyKey'] },
      }),
    });
    prisma.atsCallIntent.findUnique.mockResolvedValue(
      pendingIntent({ status: 'ACCEPTED', callId: 'call-1' }),
    );

    const result = await service.start(
      { targetType: 'LEAD', targetId: 'lead-1' },
      user,
      IDEMPOTENCY_KEY,
    );

    expect(callback.startCallbackCall).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
    expect(prisma.atsCallEvent.create).not.toHaveBeenCalled();
    expect(result.id).toBe('call-1');
  });

  it('does not call ATS again for a stored FAILED intent', async () => {
    const { service, prisma, callback, user } = createIdempotencyService({
      createIntent: vi.fn().mockRejectedValue({
        code: 'P2002',
        meta: { target: ['employee_id', 'idempotency_key'] },
      }),
    });
    prisma.atsCallIntent.findUnique.mockResolvedValue(pendingIntent({ status: 'FAILED' }));
    await expect(
      service.start({ targetType: 'LEAD', targetId: 'lead-1' }, user, IDEMPOTENCY_KEY),
    ).rejects.toBeInstanceOf(BadGatewayException);
    expect(callback.startCallbackCall).not.toHaveBeenCalled();
  });

  it('does not call ATS again for a stored ATS_NOT_CONFIGURED failure', async () => {
    const { service, prisma, callback, user } = createIdempotencyService({
      createIntent: vi.fn().mockRejectedValue({
        code: 'P2002',
        meta: { target: ['employeeId', 'idempotencyKey'] },
      }),
    });
    prisma.atsCallIntent.findUnique.mockResolvedValue(
      pendingIntent({ status: 'FAILED', errorCode: 'ATS_NOT_CONFIGURED' }),
    );
    await expect(
      service.start({ targetType: 'LEAD', targetId: 'lead-1' }, user, IDEMPOTENCY_KEY),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(callback.startCallbackCall).not.toHaveBeenCalled();
  });

  it('does not auto-retry an ambiguous PROCESSING intent', async () => {
    const { service, prisma, callback, user } = createIdempotencyService({
      createIntent: vi.fn().mockRejectedValue({
        code: 'P2002',
        meta: { target: ['employeeId', 'idempotencyKey'] },
      }),
    });
    prisma.atsCallIntent.findUnique.mockResolvedValue(pendingIntent({ status: 'PROCESSING' }));
    await expect(
      service.start({ targetType: 'LEAD', targetId: 'lead-1' }, user, IDEMPOTENCY_KEY),
    ).rejects.toBeInstanceOf(ClickToCallInProgressException);
    expect(callback.startCallbackCall).not.toHaveBeenCalled();
  });

  it('leaves ambiguous ATS transport failures in PROCESSING instead of FAILED', async () => {
    const { service, prisma, user } = createIdempotencyService({
      startCallback: vi.fn().mockResolvedValue({ kind: 'unknown' }),
    });
    await expect(
      service.start({ targetType: 'LEAD', targetId: 'lead-1' }, user, IDEMPOTENCY_KEY),
    ).rejects.toBeInstanceOf(ClickToCallInProgressException);
    expect(prisma.atsCallIntent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PENDING' }),
      }),
    );
    const failCalls = prisma.atsCallIntent.updateMany.mock.calls.filter(
      (call: [{ data?: { status?: string } }]) => call[0]?.data?.status === 'FAILED',
    );
    expect(failCalls).toHaveLength(0);
  });

  it('returns 409 when the same key is reused with a different target', async () => {
    const { service, prisma, user } = createIdempotencyService({
      createIntent: vi.fn().mockRejectedValue({
        code: 'P2002',
        meta: { target: ['employeeId', 'idempotencyKey'] },
      }),
    });
    prisma.atsCallIntent.findUnique.mockResolvedValue(
      pendingIntent({ fingerprint: 'emp-1:LEAD:other-lead' }),
    );
    prisma.lead.findUnique.mockResolvedValue({ ...LEAD, id: 'lead-2', trashedAt: null });
    prisma.lead.findFirst.mockResolvedValue({ ...LEAD, id: 'lead-2' });
    await expect(
      service.start({ targetType: 'LEAD', targetId: 'lead-2' }, user, IDEMPOTENCY_KEY),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('scopes the unique key per actor so another employee can reuse it', async () => {
    const { service, prisma, callback } = createIdempotencyService();
    prisma.lead.findFirst.mockResolvedValue({ ...LEAD, assignedTo: 'emp-2' });
    await service.start({ targetType: 'LEAD', targetId: 'lead-1' }, OTHER, IDEMPOTENCY_KEY);
    expect(prisma.atsCallIntent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          employeeId: 'emp-2',
          idempotencyKey: IDEMPOTENCY_KEY,
        }),
      }),
    );
    expect(callback.startCallbackCall).toHaveBeenCalledOnce();
  });

  it('recovers a concurrent insert P2002 by loading the existing intent', async () => {
    const { service, prisma, callback, user } = createIdempotencyService({
      createIntent: vi.fn().mockRejectedValue({
        code: 'P2002',
        meta: { target: ['employeeId', 'idempotencyKey'] },
      }),
    });
    prisma.atsCallIntent.findUnique.mockResolvedValue(
      pendingIntent({ status: 'ACCEPTED', callId: 'call-1' }),
    );
    await service.start({ targetType: 'LEAD', targetId: 'lead-1' }, user, IDEMPOTENCY_KEY);
    expect(callback.startCallbackCall).not.toHaveBeenCalled();
    expect(prisma.atsCallIntent.findUnique).toHaveBeenCalled();
  });

  it('invokes ATS once when two requests race on the same key', async () => {
    const { service, prisma, callback, user } = createIdempotencyService();
    const intent = pendingIntent();
    let created = false;
    let claimed = false;
    prisma.atsCallIntent.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => {
        if (created) {
          throw { code: 'P2002', meta: { target: ['employeeId', 'idempotencyKey'] } };
        }
        created = true;
        return pendingIntent(data);
      },
    );
    prisma.atsCallIntent.updateMany.mockImplementation(
      async ({ where }: { where: { status?: string } }) => {
        if (where.status === 'PENDING' && !claimed) {
          claimed = true;
          intent.status = 'PROCESSING';
          return { count: 1 };
        }
        return { count: 0 };
      },
    );
    prisma.atsCallIntent.findUnique.mockImplementation(async () => ({ ...intent }));

    await Promise.all([
      service.start({ targetType: 'LEAD', targetId: 'lead-1' }, user, IDEMPOTENCY_KEY),
      service
        .start({ targetType: 'LEAD', targetId: 'lead-1' }, user, IDEMPOTENCY_KEY)
        .catch((error: unknown) => {
          if (!(error instanceof ClickToCallInProgressException)) throw error;
        }),
    ]);

    expect(callback.startCallbackCall).toHaveBeenCalledOnce();
  });
});

describe('requireClickToCallIdempotencyKey', () => {
  it('accepts a UUID and rejects missing or oversized keys', () => {
    expect(requireClickToCallIdempotencyKey(IDEMPOTENCY_KEY)).toBe(IDEMPOTENCY_KEY);
    expect(() => requireClickToCallIdempotencyKey(undefined)).toThrow();
    expect(() => requireClickToCallIdempotencyKey('not-a-uuid')).toThrow();
  });
});
