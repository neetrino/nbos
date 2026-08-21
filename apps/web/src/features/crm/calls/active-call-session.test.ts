import { describe, expect, it } from 'vitest';
import { applyActiveCallEvent, sessionFromCallId } from './active-call-session';
import type { ActiveCallSsePayload } from './active-call.types';
import { parseActiveCallSsePayload } from './active-call.types';
import { incomingCallCrmHref } from './incoming-call-href';

const STARTED: ActiveCallSsePayload = {
  type: 'call.started',
  callId: 'call-1',
  uid: 'uid-1',
  direction: 'INBOUND',
  phase: 'ringing',
  phone: '+37499111111',
  displayName: 'John Smith',
};

describe('parseActiveCallSsePayload', () => {
  it('accepts a live call.started event', () => {
    expect(parseActiveCallSsePayload(JSON.stringify(STARTED))).toEqual(STARTED);
  });

  it('rejects malformed payloads', () => {
    expect(parseActiveCallSsePayload('{"type":"incoming_call"}')).toBeNull();
    expect(parseActiveCallSsePayload('not-json')).toBeNull();
  });
});

describe('applyActiveCallEvent', () => {
  it('opens the screen on call.started', () => {
    const next = applyActiveCallEvent(null, STARTED);
    expect(next?.callId).toBe('call-1');
    expect(next?.phase).toBe('ringing');
  });

  it('updates the same call instead of opening a second window', () => {
    const ringing = applyActiveCallEvent(null, STARTED);
    const answered = applyActiveCallEvent(ringing, {
      ...STARTED,
      type: 'call.answered',
      phase: 'answered',
    });
    expect(answered?.callId).toBe('call-1');
    expect(answered?.phase).toBe('answered');
  });

  it('does not open a window on finish-only', () => {
    expect(
      applyActiveCallEvent(null, { ...STARTED, type: 'call.finished', phase: 'ended' }),
    ).toBeNull();
  });

  it('does not restore a session after a simulated refresh', () => {
    let current = applyActiveCallEvent(null, STARTED);
    current = null;
    expect(current).toBeNull();
  });
});

describe('sessionFromCallId', () => {
  it('opens the outbound screen immediately for the initiator', () => {
    const session = sessionFromCallId({
      callId: 'call-2',
      uid: 'ctc:1',
      direction: 'OUTBOUND',
      phone: '+37499111111',
      displayName: 'John Smith',
    });
    expect(session.phase).toBe('ringing');
    expect(session.direction).toBe('OUTBOUND');
  });
});

describe('incomingCallCrmHref', () => {
  it('prefers Deal, then Lead, then Contact', () => {
    const ids = { dealId: 'deal-1', leadId: 'lead-1', contactId: 'contact-1' };
    expect(incomingCallCrmHref(ids)).toBe('/crm/deals?openDealId=deal-1');
    expect(incomingCallCrmHref({ ...ids, dealId: null })).toBe('/crm/leads?openLeadId=lead-1');
    expect(incomingCallCrmHref({ ...ids, dealId: null, leadId: null })).toBe(
      '/clients/contacts?openId=contact-1',
    );
  });
});
