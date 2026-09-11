import { beforeEach, describe, expect, it } from 'vitest';
import { AtsCallContextResolver } from './ats-call-context.resolver';
import { AtsCallService } from './ats-call.service';
import { createAtsIngestPrismaMock, inboundStart, outboundStart } from './ats-call.test-harness';

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
    state.employees.push({ id: 'emp-caller', sipId: '3103585' });

    await service.ingestCallEvent(outboundStart({ uid: 'out-1' }));

    expect(state.leads).toHaveLength(1);
    expect(state.leads[0]?.phone).toBe('+37499123456');
    expect(state.leads[0]?.assignedTo).toBe('emp-caller');
    expect(prisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contactName: 'Outgoing call +37499123456',
          assignedTo: 'emp-caller',
        }),
      }),
    );
    const call = state.events.get('out-1');
    expect(call?.leadId).toBe(state.leads[0]?.id);
    expect(call?.phone).toBe('+37499123456');
    expect(call?.responsibleEmployeeId).toBe('emp-caller');
    expect(call?.initiatedByEmployeeId).toBe('emp-caller');
    expect(call?.answeredEmployeeId).toBe('emp-caller');
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

  it('updates a pending click-to-call instead of creating a duplicate uid', async () => {
    state.employees.push({ id: 'emp-1', sipId: '3126107' });
    state.events.set('ctc:pending', {
      id: 'evt-pending',
      uid: 'ctc:pending',
      leadId: 'lead-click',
      contactId: null,
      dealId: null,
      phone: '+37499123456',
      calldirect: '1',
      state: 'initiated',
      clid: '+37499123456',
      billsec: null,
      source: 'CLICK_TO_CALL',
      initiatedByEmployeeId: 'emp-1',
      createdAt: new Date(),
      responsibleEmployeeId: 'emp-1',
      answeredEmployeeId: null,
    });

    await service.ingestCallEvent(
      outboundStart({
        uid: 'ats-uid-9',
        state: 'start',
        op: '3126107',
        clid: '3126107',
        input: '+37499123456',
      }),
    );

    expect(state.events.size).toBe(1);
    expect(state.events.has('ctc:pending')).toBe(false);
    expect(state.events.get('ats-uid-9')?.id).toBe('evt-pending');
    expect(state.events.get('ats-uid-9')?.leadId).toBe('lead-click');
    expect(state.events.get('ats-uid-9')?.state).toBe('start');
  });

  it('attaches an inbound-looking callback webhook to the pending click-to-call', async () => {
    state.employees.push({ id: 'emp-1', sipId: '21' });
    state.events.set('ctc:pending-in', {
      id: 'evt-pending-in',
      uid: 'ctc:pending-in',
      leadId: 'lead-click',
      contactId: null,
      dealId: null,
      phone: '+37443729201',
      calldirect: '1',
      state: 'initiated',
      clid: '+37443729201',
      billsec: null,
      source: 'CLICK_TO_CALL',
      initiatedByEmployeeId: 'emp-1',
      createdAt: new Date(),
      responsibleEmployeeId: 'emp-1',
      answeredEmployeeId: null,
    });

    await service.ingestCallEvent(
      inboundStart({
        uid: '1787582737.181871',
        calldirect: '0',
        state: 'end',
        op: '21',
        clid: '37443729201',
        disposition: 'ANSWERED',
        billsec: '20',
      }),
    );

    expect(state.events.size).toBe(1);
    expect(state.events.get('1787582737.181871')?.id).toBe('evt-pending-in');
    expect(state.events.get('1787582737.181871')?.state).toBe('end');
    expect(state.events.get('1787582737.181871')?.billsec).toBe('20');
  });

  it('does not create a second row when the same outbound webhook repeats', async () => {
    await service.ingestCallEvent(outboundStart({ uid: 'out-dup', state: 'start' }));
    await service.ingestCallEvent(
      outboundStart({
        uid: 'out-dup',
        state: 'finish',
        disposition: 'ANSWERED',
        billsec: '12',
      }),
    );

    expect(state.events.size).toBe(1);
    expect(state.leads).toHaveLength(1);
    expect(state.events.get('out-dup')?.billsec).toBe('12');
  });

  it('links an outbound call to an existing Contact, Lead, and Deal', async () => {
    state.employees.push({ id: 'emp-b', sipId: '3103585' });
    state.contacts.push({ id: 'contact-out', phone: '+37499123456', trashedAt: null });
    state.leads.push({
      ...openLeadRow('open-lead-out', 'L-2026-0300'),
      contactId: 'contact-out',
      assignedTo: 'emp-a',
    });
    state.deals.push({
      id: 'deal-out',
      contactId: 'contact-out',
      leadId: 'open-lead-out',
      status: 'START_CONVERSATION',
      trashedAt: null,
      sellerId: 'emp-a',
    });

    await service.ingestCallEvent(outboundStart({ uid: 'out-known' }));

    expect(prisma.lead.create).not.toHaveBeenCalled();
    const call = state.events.get('out-known');
    expect(call?.contactId).toBe('contact-out');
    expect(call?.leadId).toBe('open-lead-out');
    expect(call?.dealId).toBe('deal-out');
    expect(call?.responsibleEmployeeId).toBe('emp-b');
    expect(call?.initiatedByEmployeeId).toBe('emp-b');
    expect(state.leads.find((lead) => lead.id === 'open-lead-out')?.assignedTo).toBe('emp-a');
    expect(state.deals.find((deal) => deal.id === 'deal-out')?.sellerId).toBe('emp-a');
  });

  it('reuses an existing open Lead without Contact on outbound', async () => {
    state.employees.push({ id: 'emp-b', sipId: '3103585' });
    state.leads.push({
      ...openLeadRow('phone-lead', 'L-2026-0301'),
      assignedTo: 'emp-a',
    });

    await service.ingestCallEvent(outboundStart({ uid: 'out-lead-only' }));

    expect(prisma.lead.create).not.toHaveBeenCalled();
    expect(state.events.get('out-lead-only')?.leadId).toBe('phone-lead');
    expect(state.leads[0]?.assignedTo).toBe('emp-a');
  });

  it('matches outbound op with a channel suffix to Employee.sipId', async () => {
    state.employees.push({ id: 'emp-sip', sipId: '3103585' });

    await service.ingestCallEvent(outboundStart({ uid: 'out-suffix', op: '3103585-26' }));

    expect(state.events.get('out-suffix')?.responsibleEmployeeId).toBe('emp-sip');
    expect(state.events.get('out-suffix')?.initiatedByEmployeeId).toBe('emp-sip');
  });

  it('persists an outbound Call when op does not match an employee', async () => {
    await service.ingestCallEvent(outboundStart({ uid: 'out-no-op', op: null, clid: '999' }));

    expect(state.events.get('out-no-op')?.leadId).toBe(state.leads[0]?.id);
    expect(state.events.get('out-no-op')?.responsibleEmployeeId).toBeNull();
    expect(state.leads[0]?.assignedTo).toBeNull();
  });

  it('does not use outbound clid SIP as the client phone', async () => {
    await service.ingestCallEvent(
      outboundStart({
        uid: 'out-sip-clid',
        clid: '3103585',
        input: '+37499123456',
      }),
    );

    expect(state.events.get('out-sip-clid')?.phone).toBe('+37499123456');
    expect(state.leads[0]?.phone).toBe('+37499123456');
  });

  it('uses outbound op as the client when input is the office DID', async () => {
    await service.ingestCallEvent(
      outboundStart({
        uid: 'out-trunk-op',
        clid: '3103581',
        input: '37411111111',
        op: '37499123456',
      }),
    );

    expect(state.events.get('out-trunk-op')?.phone).toBe('+37499123456');
    expect(state.leads[0]?.phone).toBe('+37499123456');
    expect(state.leads[0]?.assignedTo).toBeNull();
    expect(prisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contactName: 'Outgoing call +37499123456',
        }),
      }),
    );
  });

  it('sets outbound seller from webhook sip query when body has no employee SIP', async () => {
    state.employees.push({ id: 'emp-15', sipId: '15' });

    await service.ingestCallEvent(
      outboundStart({
        uid: 'out-sip-q',
        clid: '3103581',
        input: '37411111111',
        op: '37499123456',
      }),
      '15',
    );

    expect(state.leads[0]?.assignedTo).toBe('emp-15');
    expect(state.events.get('out-sip-q')?.initiatedByEmployeeId).toBe('emp-15');
    expect(state.events.get('out-sip-q')?.responsibleEmployeeId).toBe('emp-15');
    expect(state.events.get('out-sip-q')?.phone).toBe('+37499123456');
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
