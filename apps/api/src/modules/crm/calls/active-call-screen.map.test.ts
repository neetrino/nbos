import { describe, expect, it } from 'vitest';
import { mapActiveCallScreen } from './active-call-screen.map';

describe('mapActiveCallScreen', () => {
  it('keeps empty Contact and Deal placeholders for the screen', () => {
    const snapshot = mapActiveCallScreen(
      {
        id: 'call-1',
        uid: 'uid-1',
        calldirect: '0',
        state: 'start',
        phone: '+37499111111',
        clid: '+37499111111',
        billsec: null,
        disposition: null,
        note: null,
        recordingStatus: null,
        leadId: 'lead-1',
        contactId: null,
        dealId: null,
        lead: { name: null, contactName: 'Incoming call +37499111111' },
        contact: null,
        deal: null,
      },
      { projectName: null, productName: null, recentCalls: [] },
    );

    expect(snapshot.contact.name).toBeNull();
    expect(snapshot.deal.name).toBeNull();
    expect(snapshot.projectName).toBeNull();
    expect(snapshot.productName).toBeNull();
    expect(snapshot.displayName).toBe('Incoming call +37499111111');
    expect(snapshot.phase).toBe('ringing');
  });
});
