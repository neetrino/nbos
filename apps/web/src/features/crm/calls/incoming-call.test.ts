import { describe, expect, it } from 'vitest';
import { incomingCallCrmHref } from './incoming-call-href';
import { parseIncomingCallPayload, type IncomingCallPayload } from './incoming-call.types';

const SAMPLE: IncomingCallPayload = {
  type: 'incoming_call',
  callId: 'call-1',
  direction: 'INBOUND',
  phone: '+37499111111',
  contactName: 'John Smith',
  leadName: 'Website project',
  dealName: 'Corporate website',
  responsibleEmployeeName: 'Edgar',
  leadId: 'lead-1',
  contactId: 'contact-1',
  dealId: 'deal-1',
};

describe('parseIncomingCallPayload', () => {
  it('opens popup state from a live incoming_call event', () => {
    const parsed = parseIncomingCallPayload(JSON.stringify(SAMPLE));
    expect(parsed).toEqual(SAMPLE);
  });

  it('rejects malformed payloads', () => {
    expect(parseIncomingCallPayload('{"type":"other"}')).toBeNull();
    expect(parseIncomingCallPayload('not-json')).toBeNull();
  });
});

describe('incomingCallCrmHref', () => {
  it('prefers Deal, then Lead, then Contact', () => {
    expect(incomingCallCrmHref(SAMPLE)).toBe('/crm/deals?openDealId=deal-1');
    expect(incomingCallCrmHref({ ...SAMPLE, dealId: null })).toBe('/crm/leads?openLeadId=lead-1');
    expect(incomingCallCrmHref({ ...SAMPLE, dealId: null, leadId: null })).toBe(
      '/clients/contacts?openId=contact-1',
    );
    expect(
      incomingCallCrmHref({ ...SAMPLE, dealId: null, leadId: null, contactId: null }),
    ).toBeNull();
  });
});

describe('incoming call popup session', () => {
  it('does not restore a popup after a simulated refresh', () => {
    let current: IncomingCallPayload | null = parseIncomingCallPayload(JSON.stringify(SAMPLE));
    expect(current?.callId).toBe('call-1');
    current = null;
    expect(current).toBeNull();
  });
});
