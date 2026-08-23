import { describe, expect, it } from 'vitest';
import { predecessorStatesFor } from './ats-call-state';
import { AtsCallContextResolver } from './ats-call-context.resolver';
import { AtsCallService } from './ats-call.service';
import { createAtsIngestPrismaMock, inboundStart } from './ats-call.test-harness';

describe('AtsCallService monotonic sparse ingest', () => {
  it('keeps one row when two creates race on the same uid', async () => {
    const { prisma, state, service } = createService();
    prisma.atsCallEvent.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    await Promise.all([
      service.ingestCallEvent(inboundStart({ uid: 'race-1' })),
      service.ingestCallEvent(inboundStart({ uid: 'race-1', state: 'start' })),
    ]);

    expect(state.events.size).toBe(1);
    expect(state.events.get('race-1')?.id).toBeTruthy();
  });

  it('does not create a second row for a duplicate webhook uid', async () => {
    const { state, service } = createService();
    await service.ingestCallEvent(inboundStart());
    await service.ingestCallEvent(inboundStart({ state: 'start' }));
    expect(state.events.size).toBe(1);
  });

  it('preserves an existing field when the webhook omits it', async () => {
    const { state, service } = createService();
    await service.ingestCallEvent(inboundStart({ op: '3126107' }));
    await service.ingestCallEvent({ uid: 'uid-1', state: 'status' });
    expect(state.events.get('uid-1')?.clid).toBe('+37499123456');
    expect(state.events.get('uid-1')?.state).toBe('status');
  });

  it('updates a field when the webhook sends an explicit permitted value', async () => {
    const { state, service } = createService();
    await service.ingestCallEvent(inboundStart());
    await service.ingestCallEvent({
      uid: 'uid-1',
      state: 'finish',
      billsec: '42',
      disposition: 'ANSWERED',
    });
    expect(state.events.get('uid-1')?.billsec).toBe('42');
    expect(state.events.get('uid-1')?.disposition).toBe('ANSWERED');
  });

  it('rejects terminal to start or status regression', async () => {
    const { state, service } = createService();
    await service.ingestCallEvent(inboundStart({ state: 'finish' }));
    await service.ingestCallEvent({ uid: 'uid-1', state: 'start' });
    await service.ingestCallEvent({ uid: 'uid-1', state: 'status' });
    expect(state.events.get('uid-1')?.state).toBe('finish');
  });

  it('allows start to status to finish', async () => {
    const { state, service } = createService();
    await service.ingestCallEvent(inboundStart({ state: 'start' }));
    await service.ingestCallEvent({ uid: 'uid-1', state: 'status' });
    await service.ingestCallEvent({ uid: 'uid-1', state: 'finish' });
    expect(state.events.get('uid-1')?.state).toBe('finish');
  });

  it('treats duplicate finish as idempotent', async () => {
    const { prisma, state, service } = createService();
    await service.ingestCallEvent(inboundStart({ state: 'start' }));
    await service.ingestCallEvent({ uid: 'uid-1', state: 'finish' });
    prisma.atsCallEvent.updateMany.mockClear();
    await service.ingestCallEvent({ uid: 'uid-1', state: 'finish' });
    expect(state.events.size).toBe(1);
    expect(state.events.get('uid-1')?.state).toBe('finish');
  });

  it('does not lower a known state when the incoming state is unknown', async () => {
    const { state, service } = createService();
    await service.ingestCallEvent(inboundStart({ state: 'status' }));
    await service.ingestCallEvent({ uid: 'uid-1', state: 'weird-ats-state' });
    expect(state.events.get('uid-1')?.state).toBe('status');
  });
});

describe('predecessorStatesFor', () => {
  it('lists canonical predecessors without the incoming state', () => {
    expect(predecessorStatesFor('status')).toEqual(expect.arrayContaining(['initiated', 'start']));
    expect(predecessorStatesFor('status')).not.toContain('status');
    expect(predecessorStatesFor('status')).not.toContain('finish');
    expect(predecessorStatesFor('finish')).toEqual(
      expect.arrayContaining(['initiated', 'start', 'status']),
    );
    expect(predecessorStatesFor('finish')).not.toContain('end');
  });
});

function createService() {
  const { prisma, state } = createAtsIngestPrismaMock();
  const resolver = new AtsCallContextResolver(prisma as never);
  const service = new AtsCallService(prisma as never, resolver);
  return { prisma, state, service };
}
