import { describe, expect, it } from 'vitest';
import type { CallActivity } from '@/lib/api/calls';
import { formatCallDuration } from './format-call-duration';
import { callActivityTitle, groupCallActivitiesByDay } from './group-call-activities';

const SAMPLE: CallActivity = {
  type: 'CALL',
  id: 'call-1',
  uid: 'uid-1',
  direction: 'INBOUND',
  phone: '+37499111111',
  status: 'finish',
  durationSec: 200,
  disposition: 'ANSWERED',
  rate: null,
  leadId: 'lead-1',
  contactId: null,
  dealId: null,
  responsibleEmployeeId: 'emp-1',
  answeredEmployeeId: null,
  contactName: null,
  leadName: 'Website project',
  dealName: null,
  employeeName: 'Edgar',
  createdAt: '2026-08-21T10:00:00.000Z',
  updatedAt: '2026-08-21T10:03:20.000Z',
};

describe('formatCallDuration', () => {
  it('formats minutes and seconds', () => {
    expect(formatCallDuration(200)).toBe('03:20');
    expect(formatCallDuration(0)).toBe('00:00');
    expect(formatCallDuration(null)).toBe('—');
  });
});

describe('call activity timeline helpers', () => {
  it('labels inbound and outbound CALL items', () => {
    expect(callActivityTitle('INBOUND')).toBe('Incoming Call');
    expect(callActivityTitle('OUTBOUND')).toBe('Outgoing Call');
    expect(callActivityTitle(null)).toBe('Call');
  });

  it('groups CALL activities by day without crashing when Contact is missing', () => {
    const groups = groupCallActivitiesByDay([SAMPLE]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.items[0]?.contactName).toBeNull();
    expect(groups[0]?.items[0]?.phone).toBe('+37499111111');
    expect(groups[0]?.items[0]?.type).toBe('CALL');
  });
});
