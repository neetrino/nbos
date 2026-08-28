import { describe, expect, it } from 'vitest';
import type { CallActivity } from '@/lib/api/calls';
import { callActivityPartyName, isMissedCall, readAudioDuration } from './call-activity-status';
import { formatPlaybackSpeedLabel, nextCallPlaybackSpeed } from './call-recording-playback';
import { formatCallDuration, formatCallPlaybackClock } from './format-call-duration';
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
  recordingStatus: null,
  createdAt: '2026-08-21T10:00:00.000Z',
  updatedAt: '2026-08-21T10:03:20.000Z',
};

describe('formatCallDuration', () => {
  it('formats minutes and seconds', () => {
    expect(formatCallDuration(200)).toBe('03:20');
    expect(formatCallDuration(0)).toBe('00:00');
    expect(formatCallDuration(null)).toBe('—');
  });

  it('formats a compact playback clock', () => {
    expect(formatCallPlaybackClock(0)).toBe('0:00');
    expect(formatCallPlaybackClock(14)).toBe('0:14');
    expect(formatCallPlaybackClock(95.7)).toBe('1:35');
    expect(formatCallPlaybackClock(-1)).toBe('0:00');
  });
});

describe('call activity card helpers', () => {
  it('treats inbound no-answer as missed', () => {
    expect(isMissedCall({ direction: 'INBOUND', disposition: 'NO ANSWER' })).toBe(true);
    expect(isMissedCall({ direction: 'INBOUND', disposition: 'NO_ANSWER' })).toBe(true);
    expect(isMissedCall({ direction: 'INBOUND', disposition: 'ANSWERED' })).toBe(false);
    expect(isMissedCall({ direction: 'OUTBOUND', disposition: 'NO ANSWER' })).toBe(false);
  });

  it('falls back to New caller when Contact is missing', () => {
    expect(callActivityPartyName({ contactName: null })).toBe('New caller');
    expect(callActivityPartyName({ contactName: '  ' })).toBe('New caller');
    expect(callActivityPartyName({ contactName: 'Movses' })).toBe('Movses');
  });

  it('keeps a duration hint when audio metadata is missing', () => {
    expect(readAudioDuration(Number.NaN, 15)).toBe(15);
    expect(readAudioDuration(14.2, 15)).toBe(14.2);
  });

  it('cycles playback speed 1 → 1.5 → 2 → 1', () => {
    expect(nextCallPlaybackSpeed(1)).toBe(1.5);
    expect(nextCallPlaybackSpeed(1.5)).toBe(2);
    expect(nextCallPlaybackSpeed(2)).toBe(1);
    expect(formatPlaybackSpeedLabel(1)).toBe('1.0x');
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
