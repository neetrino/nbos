import { describe, expect, it } from 'vitest';
import { mapCallDirection, mapCallResponse, parseDurationSec } from './call-response.map';

describe('call-response.map', () => {
  it('maps ATS calldirect to CRM direction', () => {
    expect(mapCallDirection('0')).toBe('INBOUND');
    expect(mapCallDirection('1')).toBe('OUTBOUND');
    expect(mapCallDirection(null)).toBeNull();
  });

  it('parses billsec into duration seconds', () => {
    expect(parseDurationSec('42')).toBe(42);
    expect(parseDurationSec('0')).toBe(0);
    expect(parseDurationSec(null)).toBeNull();
    expect(parseDurationSec('nope')).toBeNull();
  });

  it('prefers normalized phone over raw clid', () => {
    const mapped = mapCallResponse({
      id: 'call-1',
      uid: 'uid-1',
      calldirect: '1',
      phone: '+37499123456',
      clid: '099123456',
      state: 'start',
      billsec: null,
      disposition: null,
      rate: null,
      leadId: null,
      contactId: null,
      dealId: null,
      responsibleEmployeeId: null,
      answeredEmployeeId: null,
      createdAt: new Date('2026-08-21T10:00:00.000Z'),
      updatedAt: new Date('2026-08-21T10:00:00.000Z'),
    });
    expect(mapped.phone).toBe('+37499123456');
    expect(mapped.direction).toBe('OUTBOUND');
    expect(mapped.type).toBe('CALL');
    expect(mapped.contactName).toBeNull();
  });

  it('maps related names without duplicating call metrics', () => {
    const mapped = mapCallResponse({
      id: 'call-2',
      uid: 'uid-2',
      calldirect: '0',
      phone: '+37499111111',
      clid: '+37499111111',
      state: 'finish',
      billsec: '200',
      disposition: 'ANSWERED',
      rate: null,
      leadId: 'lead-1',
      contactId: null,
      dealId: null,
      responsibleEmployeeId: 'emp-1',
      answeredEmployeeId: null,
      createdAt: new Date('2026-08-21T10:00:00.000Z'),
      updatedAt: new Date('2026-08-21T10:00:00.000Z'),
      lead: { name: 'Website project', contactName: 'John' },
      contact: null,
      deal: null,
      responsibleEmployee: { firstName: 'Edgar', lastName: 'Sargsyan' },
      answeredEmployee: null,
    });
    expect(mapped).toMatchObject({
      type: 'CALL',
      durationSec: 200,
      contactName: null,
      leadName: 'Website project',
      employeeName: 'Edgar Sargsyan',
    });
  });
});
