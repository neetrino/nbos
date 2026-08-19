import { beforeEach, describe, expect, it } from 'vitest';
import { AtsLeadIngestService } from './ats-lead-ingest.service';
import { createAtsIngestPrismaMock, inboundStart } from './ats-lead-ingest.test-harness';

describe('AtsLeadIngestService', () => {
  let prisma: ReturnType<typeof createAtsIngestPrismaMock>['prisma'];
  let state: ReturnType<typeof createAtsIngestPrismaMock>['state'];
  let service: AtsLeadIngestService;

  beforeEach(() => {
    ({ prisma, state } = createAtsIngestPrismaMock());
    service = new AtsLeadIngestService(prisma as never);
  });

  it('creates a Lead for inbound start with new clid', async () => {
    await service.ingestCallEvent(inboundStart());

    expect(state.leads).toHaveLength(1);
    expect(state.leads[0]?.phone).toBe('+37499123456');
    expect(state.events.get('uid-1')?.leadId).toBe(state.leads[0]?.id);
  });

  it('does not create a second Lead for the same uid', async () => {
    await service.ingestCallEvent(inboundStart());
    await service.ingestCallEvent(inboundStart({ state: 'start' }));
    await service.ingestCallEvent(
      inboundStart({ state: 'finish', disposition: 'ANSWERED', billsec: '42' }),
    );

    expect(state.leads).toHaveLength(1);
    expect(prisma.lead.create).toHaveBeenCalledTimes(1);
  });

  it('reuses an open Lead with the same phone (dedupe)', async () => {
    state.leads.push(openLeadRow('existing-lead', 'L-2026-0001'));

    await service.ingestCallEvent(inboundStart({ uid: 'uid-2' }));

    expect(prisma.lead.create).not.toHaveBeenCalled();
    expect(state.events.get('uid-2')?.leadId).toBe('existing-lead');
  });

  it('skips Lead creation for outbound calls', async () => {
    await service.ingestCallEvent(
      inboundStart({ calldirect: '1', uid: 'out-1', clid: '+37499123456' }),
    );

    expect(state.events.has('out-1')).toBe(true);
    expect(state.leads).toHaveLength(0);
    expect(prisma.lead.create).not.toHaveBeenCalled();
  });

  it('attaches to an Instagram Lead that already has the same phone', async () => {
    state.leads.push({
      ...openLeadRow('ig-lead', 'L-2026-0008'),
      status: 'CONTACT_ESTABLISHED',
    });

    await service.ingestCallEvent(inboundStart({ uid: 'uid-ig' }));

    expect(prisma.lead.create).not.toHaveBeenCalled();
    expect(state.events.get('uid-ig')?.leadId).toBe('ig-lead');
  });

  it('does not auto-attach to Spam or absorbed Leads', async () => {
    state.leads.push({
      ...openLeadRow('spam-lead', 'L-2026-0009'),
      status: 'SPAM',
    });

    await service.ingestCallEvent(inboundStart({ uid: 'uid-spam' }));

    expect(state.leads.some((lead) => lead.id !== 'spam-lead')).toBe(true);
    expect(state.events.get('uid-spam')?.leadId).not.toBe('spam-lead');
  });

  it('does not auto-attach to an absorbed Lead with the same phone', async () => {
    state.leads.push({
      ...openLeadRow('absorbed-lead', 'L-2026-0010'),
      trashedAt: new Date('2026-08-01'),
      mergedIntoId: 'surv-1',
    });

    await service.ingestCallEvent(inboundStart({ uid: 'uid-absorbed' }));

    expect(state.events.get('uid-absorbed')?.leadId).not.toBe('absorbed-lead');
    expect(state.leads.some((lead) => lead.id === 'absorbed-lead')).toBe(true);
    expect(state.leads.some((lead) => lead.id !== 'absorbed-lead')).toBe(true);
  });

  it('attaches to the open Deal original Lead when Contact phone matches', async () => {
    state.contacts.push({ id: 'contact-1', phone: '+37499123456', trashedAt: null });
    state.leads.push({
      ...openLeadRow('sql-lead', 'L-2026-0020'),
      phone: '+37499000000',
      status: 'SQL',
      contactId: 'contact-1',
    });
    state.deals.push({
      id: 'deal-1',
      contactId: 'contact-1',
      leadId: 'sql-lead',
      status: 'START_CONVERSATION',
      trashedAt: null,
    });

    await service.ingestCallEvent(inboundStart({ uid: 'uid-contact-deal' }));

    expect(prisma.lead.create).not.toHaveBeenCalled();
    expect(state.events.get('uid-contact-deal')?.leadId).toBe('sql-lead');
  });

  it('creates a Lead already linked to the Contact when there is no open Deal', async () => {
    state.contacts.push({ id: 'contact-2', phone: '+37499123456', trashedAt: null });

    await service.ingestCallEvent(inboundStart({ uid: 'uid-contact-new' }));

    expect(prisma.lead.create).toHaveBeenCalledTimes(1);
    expect(state.leads.some((lead) => lead.contactId === 'contact-2')).toBe(true);
    expect(state.events.get('uid-contact-new')?.leadId).toBe(
      state.leads.find((lead) => lead.contactId === 'contact-2')?.id,
    );
  });

  it('does not create Lead on finish-only first sight', async () => {
    await service.ingestCallEvent(
      inboundStart({ state: 'finish', disposition: 'NO ANSWER', billsec: '0' }),
    );

    expect(state.leads).toHaveLength(0);
    expect(state.events.get('uid-1')?.leadId).toBeNull();
  });
});

function openLeadRow(id: string, code: string) {
  return {
    id,
    phone: '+37499123456',
    status: 'NEW',
    trashedAt: null,
    mergedIntoId: null,
    code,
    contactId: null,
  };
}
