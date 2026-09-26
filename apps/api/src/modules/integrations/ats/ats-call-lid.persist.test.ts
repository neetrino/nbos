import { beforeEach, describe, expect, it } from 'vitest';
import { AtsCallContextResolver } from './ats-call-context.resolver';
import { AtsCallService } from './ats-call.service';
import { createAtsIngestPrismaMock, inboundStart } from './ats-call.test-harness';

describe('ATS LID persistence', () => {
  let prisma: ReturnType<typeof createAtsIngestPrismaMock>['prisma'];
  let state: ReturnType<typeof createAtsIngestPrismaMock>['state'];
  let service: AtsCallService;

  beforeEach(() => {
    ({ prisma, state } = createAtsIngestPrismaMock());
    service = new AtsCallService(prisma as never, new AtsCallContextResolver(prisma as never));
  });

  it('stores LID on each UID and does not create a second row for a repeated webhook', async () => {
    await service.ingestCallEvent(inboundStart({ uid: 'uid-1', lid: ' L-77 ' }));
    await service.ingestCallEvent(inboundStart({ uid: 'uid-1', lid: 'L-77', state: 'status' }));
    await service.ingestCallEvent(inboundStart({ uid: 'uid-2', lid: 'L-77', state: 'start' }));

    expect(state.events.size).toBe(2);
    expect(state.events.get('uid-1')?.lid).toBe('L-77');
    expect(state.events.get('uid-2')?.lid).toBe('L-77');
    expect(state.events.get('uid-1')?.uid).toBe('uid-1');
  });

  it('leaves LID empty when the webhook omits it', async () => {
    await service.ingestCallEvent(inboundStart({ uid: 'uid-plain', lid: null }));
    await service.ingestCallEvent(inboundStart({ uid: 'uid-plain', state: 'finish' }));

    expect(state.events.size).toBe(1);
    expect(state.events.get('uid-plain')?.lid).toBeNull();
  });
});
