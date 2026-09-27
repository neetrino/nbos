import { describe, expect, it, vi } from 'vitest';
import { CALL_SSE_EVENT } from '../../realtime/call-realtime.constants';
import { AtsCallRealtimePublisher } from './ats-call-realtime.publisher';
import { inboundStart } from './ats-call.test-harness';

const CALL_ROW = {
  id: 'call-1',
  uid: 'uid-1',
  phone: '+37499123456',
  clid: '+37499123456',
  state: 'finish',
  calldirect: '0',
  initiatedByEmployeeId: null,
  responsibleEmployeeId: 'emp-edgar',
  answeredEmployeeId: null,
  lead: { name: 'Website project', contactName: 'Incoming call +37499123456' },
  contact: null,
  initiatedByEmployee: null,
  responsibleEmployee: { firstName: 'Edgar', lastName: 'Sargsyan' },
  answeredEmployee: null,
};

describe('AtsCallRealtimePublisher conversation finish', () => {
  it('finishes to the employee after their connection already ended', async () => {
    const customer = finishedLeg({
      id: 'call-customer',
      uid: 'uid-customer',
      createdAt: '2026-09-26T10:00:00.000Z',
      responsibleEmployeeId: null,
      responsibleEmployee: null,
    });
    const employee = finishedLeg({
      id: 'call-employee',
      uid: 'uid-employee',
      createdAt: '2026-09-26T10:00:02.000Z',
      responsibleEmployeeId: null,
      responsibleEmployee: null,
      answeredEmployeeId: 'emp-ans',
      answeredEmployee: { firstName: 'Anna', lastName: 'Petrosyan' },
    });
    const { publisher, publish } = publisherFor(customer, [customer, employee]);

    await publishFinish(publisher, 'call-customer', 'uid-customer');

    expect(publish).toHaveBeenCalledOnce();
    expect(publish).toHaveBeenCalledWith({
      event: CALL_SSE_EVENT.FINISHED,
      payload: expect.objectContaining({
        employeeId: 'emp-ans',
        callId: 'call-employee',
        uid: 'uid-employee',
        phase: 'ended',
      }),
    });
  });

  it('does not finish while the customer connection is still live', async () => {
    const customer = finishedLeg({
      id: 'call-customer',
      uid: 'uid-customer',
      createdAt: '2026-09-26T10:00:00.000Z',
      state: 'status',
    });
    const employee = finishedLeg({
      id: 'call-employee',
      uid: 'uid-employee',
      createdAt: '2026-09-26T10:00:02.000Z',
      state: 'finish',
      answeredEmployeeId: 'emp-ans',
      answeredEmployee: { firstName: 'Anna', lastName: 'Petrosyan' },
    });
    const { publisher, publish } = publisherFor(employee, [customer, employee]);

    await publishFinish(publisher, 'call-employee', 'uid-employee');

    expect(publish).not.toHaveBeenCalled();
  });

  it('gives each employee only a connection they participate in', async () => {
    const customer = finishedLeg({
      id: 'call-customer',
      uid: 'uid-customer',
      createdAt: '2026-09-26T10:00:00.000Z',
      responsibleEmployeeId: 'emp-edgar',
      answeredEmployeeId: null,
      answeredEmployee: null,
    });
    const employee = finishedLeg({
      id: 'call-employee',
      uid: 'uid-employee',
      createdAt: '2026-09-26T10:00:02.000Z',
      responsibleEmployeeId: null,
      responsibleEmployee: null,
      answeredEmployeeId: 'emp-ans',
      answeredEmployee: { firstName: 'Anna', lastName: 'Petrosyan' },
    });
    const { publisher, publish } = publisherFor(customer, [customer, employee]);

    await publishFinish(publisher, 'call-customer', 'uid-customer');

    expect(publish.mock.calls.map((call) => call[0].payload)).toEqual([
      expect.objectContaining({ employeeId: 'emp-ans', callId: 'call-employee' }),
      expect.objectContaining({ employeeId: 'emp-edgar', callId: 'call-customer' }),
    ]);
  });
});

function publishFinish(
  publisher: AtsCallRealtimePublisher,
  callId: string,
  uid: string,
): Promise<void> {
  return publisher.publishAfterWebhook(inboundStart({ uid, lid: 'L-1', state: 'finish' }), {
    callId,
    isFirstSeen: false,
    stateTransitionApplied: true,
  });
}

function finishedLeg(
  overrides: Partial<typeof CALL_ROW> & { id: string; uid: string; createdAt: string },
) {
  return {
    ...CALL_ROW,
    lid: 'L-1',
    state: 'finish',
    ...overrides,
    createdAt: new Date(overrides.createdAt),
  };
}

function publisherFor(
  current: ReturnType<typeof finishedLeg>,
  members: Array<ReturnType<typeof finishedLeg>>,
) {
  const publish = vi.fn().mockResolvedValue(undefined);
  const prisma = {
    atsCallEvent: {
      findUnique: vi.fn().mockResolvedValue(current),
      findMany: vi.fn().mockResolvedValue(members),
    },
  };
  return {
    publish,
    publisher: new AtsCallRealtimePublisher(prisma as never, { publish } as never),
  };
}
