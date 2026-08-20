import { describe, expect, it, vi } from 'vitest';
import { CALL_SSE_EVENT } from '../../realtime/call-realtime.constants';
import {
  AtsCallRealtimePublisher,
  isInboundStart,
  resolveIncomingCallTarget,
} from './ats-call-realtime.publisher';
import { inboundStart } from './ats-call.test-harness';

describe('isInboundStart', () => {
  it('is true only for inbound start', () => {
    expect(isInboundStart(inboundStart())).toBe(true);
    expect(isInboundStart(inboundStart({ calldirect: '1' }))).toBe(false);
    expect(isInboundStart(inboundStart({ state: 'finish' }))).toBe(false);
  });
});

describe('resolveIncomingCallTarget', () => {
  it('prefers answeredEmployeeId over responsibleEmployeeId', () => {
    expect(
      resolveIncomingCallTarget({
        answeredEmployeeId: 'emp-answered',
        responsibleEmployeeId: 'emp-responsible',
        answeredEmployee: { firstName: 'Edgar', lastName: 'Sargsyan' },
        responsibleEmployee: { firstName: 'Ivan', lastName: 'Petrosyan' },
      }),
    ).toEqual({ employeeId: 'emp-answered', name: 'Edgar Sargsyan' });
  });

  it('falls back to responsibleEmployeeId', () => {
    expect(
      resolveIncomingCallTarget({
        answeredEmployeeId: null,
        responsibleEmployeeId: 'emp-responsible',
        answeredEmployee: null,
        responsibleEmployee: { firstName: 'Edgar', lastName: 'Sargsyan' },
      }),
    ).toEqual({ employeeId: 'emp-responsible', name: 'Edgar Sargsyan' });
  });

  it('returns null when no employee is linked', () => {
    expect(
      resolveIncomingCallTarget({
        answeredEmployeeId: null,
        responsibleEmployeeId: null,
        answeredEmployee: null,
        responsibleEmployee: null,
      }),
    ).toBeNull();
  });
});

describe('AtsCallRealtimePublisher', () => {
  it('publishes incoming_call to the resolved employee after ingest', async () => {
    const publish = vi.fn().mockResolvedValue(undefined);
    const prisma = {
      atsCallEvent: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'call-1',
          phone: '+37499123456',
          clid: '+37499123456',
          answeredEmployeeId: null,
          responsibleEmployeeId: 'emp-edgar',
          leadId: 'lead-1',
          contactId: null,
          dealId: null,
          lead: { name: 'Website project', contactName: 'Incoming call +37499123456' },
          contact: null,
          deal: null,
          responsibleEmployee: { firstName: 'Edgar', lastName: 'Sargsyan' },
          answeredEmployee: null,
        }),
      },
    };
    const publisher = new AtsCallRealtimePublisher(prisma as never, { publish } as never);

    await publisher.publishIncomingStart(inboundStart({ uid: 'uid-1' }));

    expect(publish).toHaveBeenCalledWith({
      event: CALL_SSE_EVENT.INCOMING_CALL,
      payload: expect.objectContaining({
        employeeId: 'emp-edgar',
        type: 'incoming_call',
        callId: 'call-1',
        direction: 'INBOUND',
        phone: '+37499123456',
        leadName: 'Website project',
        responsibleEmployeeName: 'Edgar Sargsyan',
      }),
    });
  });

  it('does not publish when the Call has no employee', async () => {
    const publish = vi.fn();
    const prisma = {
      atsCallEvent: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'call-2',
          phone: '+37499123456',
          clid: '+37499123456',
          answeredEmployeeId: null,
          responsibleEmployeeId: null,
          leadId: 'lead-1',
          contactId: null,
          dealId: null,
          lead: null,
          contact: null,
          deal: null,
          responsibleEmployee: null,
          answeredEmployee: null,
        }),
      },
    };
    const publisher = new AtsCallRealtimePublisher(prisma as never, { publish } as never);

    await publisher.publishIncomingStart(inboundStart({ uid: 'uid-unknown' }));

    expect(publish).not.toHaveBeenCalled();
  });

  it('swallows bus failures so ingest stays successful', async () => {
    const prisma = {
      atsCallEvent: {
        findUnique: vi.fn().mockRejectedValue(new Error('redis down')),
      },
    };
    const publisher = new AtsCallRealtimePublisher(
      prisma as never,
      {
        publish: vi.fn(),
      } as never,
    );

    await expect(publisher.publishIncomingStart(inboundStart())).resolves.toBeUndefined();
  });
});
