import { describe, expect, it, vi } from 'vitest';
import { CALL_SSE_EVENT } from '../../realtime/call-realtime.constants';
import { AtsCallRealtimePublisher } from './ats-call-realtime.publisher';
import { inboundStart } from './ats-call.test-harness';

const CALL_ROW = {
  id: 'call-1',
  uid: 'uid-1',
  phone: '+37499123456',
  clid: '+37499123456',
  state: 'start',
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

function createPublisher() {
  const publish = vi.fn().mockResolvedValue(undefined);
  const prisma = {
    atsCallEvent: { findUnique: vi.fn().mockResolvedValue(CALL_ROW) },
  };
  const publisher = new AtsCallRealtimePublisher(prisma as never, { publish } as never);
  return { publisher, publish, prisma };
}

describe('AtsCallRealtimePublisher', () => {
  it('publishes call.started to the responsible on inbound start', async () => {
    const { publisher, publish } = createPublisher();

    await publisher.publishAfterWebhook(inboundStart({ uid: 'uid-1' }), {
      callId: 'call-1',
      isFirstSeen: true,
    });

    expect(publish).toHaveBeenCalledWith({
      event: CALL_SSE_EVENT.STARTED,
      payload: expect.objectContaining({
        employeeId: 'emp-edgar',
        type: CALL_SSE_EVENT.STARTED,
        callId: 'call-1',
        direction: 'INBOUND',
        phase: 'ringing',
        phone: '+37499123456',
      }),
    });
  });

  it('does not publish inbound start without an employee', async () => {
    const { publisher, publish, prisma } = createPublisher();
    prisma.atsCallEvent.findUnique.mockResolvedValue({
      ...CALL_ROW,
      responsibleEmployeeId: null,
      responsibleEmployee: null,
    });

    await publisher.publishAfterWebhook(inboundStart(), {
      callId: 'call-1',
      isFirstSeen: true,
    });

    expect(publish).not.toHaveBeenCalled();
  });

  it('publishes call.answered to the op employee', async () => {
    const { publisher, publish, prisma } = createPublisher();
    prisma.atsCallEvent.findUnique.mockResolvedValue({
      ...CALL_ROW,
      state: 'status',
      answeredEmployeeId: 'emp-ans',
      answeredEmployee: { firstName: 'Ans', lastName: 'Op' },
    });

    await publisher.publishAfterWebhook(inboundStart({ state: 'status' }), {
      callId: 'call-1',
      isFirstSeen: false,
    });

    expect(publish).toHaveBeenCalledWith({
      event: CALL_SSE_EVENT.ANSWERED,
      payload: expect.objectContaining({
        employeeId: 'emp-ans',
        type: CALL_SSE_EVENT.ANSWERED,
        phase: 'answered',
      }),
    });
  });

  it('does not publish first-seen finish', async () => {
    const { publisher, publish } = createPublisher();

    await publisher.publishAfterWebhook(inboundStart({ state: 'finish' }), {
      callId: 'call-1',
      isFirstSeen: true,
    });

    expect(publish).not.toHaveBeenCalled();
  });

  it('swallows lookup failures so ingest stays successful', async () => {
    const prisma = {
      atsCallEvent: { findUnique: vi.fn().mockRejectedValue(new Error('redis down')) },
    };
    const publisher = new AtsCallRealtimePublisher(prisma as never, { publish: vi.fn() } as never);

    await expect(
      publisher.publishAfterWebhook(inboundStart(), { callId: 'call-1', isFirstSeen: true }),
    ).resolves.toBeUndefined();
  });
});
