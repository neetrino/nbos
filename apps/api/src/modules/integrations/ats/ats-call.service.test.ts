import { beforeEach, describe, expect, it } from 'vitest';
import { AtsCallContextResolver } from './ats-call-context.resolver';
import { AtsCallService } from './ats-call.service';
import { createAtsIngestPrismaMock, inboundStart } from './ats-call.test-harness';

describe('AtsCallService', () => {
  let prisma: ReturnType<typeof createAtsIngestPrismaMock>['prisma'];
  let state: ReturnType<typeof createAtsIngestPrismaMock>['state'];
  let service: AtsCallService;

  beforeEach(() => {
    ({ prisma, state } = createAtsIngestPrismaMock());
    const resolver = new AtsCallContextResolver(prisma as never);
    service = new AtsCallService(prisma as never, resolver);
  });

  it('creates a Call and Lead for inbound start with a new number', async () => {
    await service.ingestCallEvent(inboundStart());

    expect(state.leads).toHaveLength(1);
    expect(state.leads[0]?.phone).toBe('+37499123456');
    expect(state.events.size).toBe(1);
    expect(state.events.get('uid-1')?.leadId).toBe(state.leads[0]?.id);
    expect(state.events.get('uid-1')?.contactId).toBeNull();
    expect(state.events.get('uid-1')?.phone).toBe('+37499123456');
  });

  it('reuses an open Lead with the same phone and does not create another', async () => {
    state.leads.push(openLeadRow('existing-lead', 'L-2026-0001'));

    await service.ingestCallEvent(inboundStart({ uid: 'uid-2' }));

    expect(prisma.lead.create).not.toHaveBeenCalled();
    expect(state.events.get('uid-2')?.leadId).toBe('existing-lead');
  });

  it('links an existing Contact without creating a Lead when the Contact already has an open Lead', async () => {
    state.contacts.push({ id: 'contact-open', phone: '+37499123456', trashedAt: null });
    state.leads.push({
      ...openLeadRow('open-lead', 'L-2026-0003'),
      contactId: 'contact-open',
    });

    await service.ingestCallEvent(inboundStart({ uid: 'uid-contact-open-lead' }));

    expect(prisma.lead.create).not.toHaveBeenCalled();
    expect(state.events.get('uid-contact-open-lead')?.contactId).toBe('contact-open');
    expect(state.events.get('uid-contact-open-lead')?.leadId).toBe('open-lead');
  });

  it('creates a Call and Lead for outbound start to an unknown number', async () => {
    await service.ingestCallEvent(
      inboundStart({ calldirect: '1', uid: 'out-1', clid: '+37499123456' }),
    );

    expect(state.leads).toHaveLength(1);
    expect(state.events.get('out-1')?.leadId).toBe(state.leads[0]?.id);
    expect(state.events.get('out-1')?.phone).toBe('+37499123456');
  });

  it('updates the same Call on duplicate uid and never creates a second row', async () => {
    await service.ingestCallEvent(inboundStart());
    await service.ingestCallEvent(inboundStart({ state: 'start' }));
    await service.ingestCallEvent(
      inboundStart({ state: 'finish', disposition: 'ANSWERED', billsec: '42' }),
    );

    expect(state.events.size).toBe(1);
    expect(state.leads).toHaveLength(1);
    expect(prisma.lead.create).toHaveBeenCalledTimes(1);
    expect(state.events.get('uid-1')?.billsec).toBe('42');
    expect(state.events.get('uid-1')?.leadId).toBe(state.leads[0]?.id);
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

  it('attaches Call to Contact, Deal, and the Deal original Lead', async () => {
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
      sellerId: 'seller-1',
    });

    await service.ingestCallEvent(inboundStart({ uid: 'uid-contact-deal' }));

    expect(prisma.lead.create).not.toHaveBeenCalled();
    const call = state.events.get('uid-contact-deal');
    expect(call?.leadId).toBe('sql-lead');
    expect(call?.contactId).toBe('contact-1');
    expect(call?.dealId).toBe('deal-1');
    expect(call?.responsibleEmployeeId).toBe('seller-1');
  });

  it('creates a Lead already linked to the Contact when there is no open Deal', async () => {
    state.contacts.push({ id: 'contact-2', phone: '+37499123456', trashedAt: null });

    await service.ingestCallEvent(inboundStart({ uid: 'uid-contact-new' }));

    expect(prisma.lead.create).toHaveBeenCalledTimes(1);
    expect(state.leads.some((lead) => lead.contactId === 'contact-2')).toBe(true);
    const call = state.events.get('uid-contact-new');
    expect(call?.leadId).toBe(state.leads.find((lead) => lead.contactId === 'contact-2')?.id);
    expect(call?.contactId).toBe('contact-2');
  });

  it('does not create a Lead when Contact has an open Deal without leadId, but still links Deal', async () => {
    state.contacts.push({ id: 'contact-3', phone: '+37499123456', trashedAt: null });
    state.deals.push({
      id: 'deal-orphan',
      contactId: 'contact-3',
      leadId: null,
      status: 'START_CONVERSATION',
      trashedAt: null,
      sellerId: null,
    });

    await service.ingestCallEvent(inboundStart({ uid: 'uid-open-deal-no-lead' }));

    expect(prisma.lead.create).not.toHaveBeenCalled();
    const call = state.events.get('uid-open-deal-no-lead');
    expect(call?.leadId).toBeNull();
    expect(call?.contactId).toBe('contact-3');
    expect(call?.dealId).toBe('deal-orphan');
  });

  it('creates a Lead with contactId when the only Deal is closed', async () => {
    state.contacts.push({ id: 'contact-4', phone: '+37499123456', trashedAt: null });
    state.deals.push({
      id: 'deal-won',
      contactId: 'contact-4',
      leadId: 'old-sql',
      status: 'WON',
      trashedAt: null,
      sellerId: null,
    });

    await service.ingestCallEvent(inboundStart({ uid: 'uid-closed-deal' }));

    expect(prisma.lead.create).toHaveBeenCalledTimes(1);
    expect(state.leads.some((lead) => lead.contactId === 'contact-4')).toBe(true);
    expect(state.events.get('uid-closed-deal')?.contactId).toBe('contact-4');
  });

  it('does not create Lead on finish-only first sight', async () => {
    await service.ingestCallEvent(
      inboundStart({ state: 'finish', disposition: 'NO ANSWER', billsec: '0' }),
    );

    expect(state.leads).toHaveLength(0);
    expect(state.events.get('uid-1')?.leadId).toBeNull();
  });

  it('sets answered employee from ATS op SIP', async () => {
    state.employees.push({ id: 'emp-op', sipId: '3126107' });

    await service.ingestCallEvent(inboundStart({ uid: 'uid-op', op: '3126107' }));

    expect(state.events.get('uid-op')?.answeredEmployeeId).toBe('emp-op');
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
    assignedTo: null,
  };
}
