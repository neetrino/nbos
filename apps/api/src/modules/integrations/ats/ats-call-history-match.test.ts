import { describe, expect, it } from 'vitest';
import { matchHistoryToPendingCall } from './ats-call-history-match';
import { parseAtsHistoryBody } from './ats-history.parse';
import type { AtsHistoryCallRow } from './ats-history.parse';

const ENDED: AtsHistoryCallRow = {
  uid: '1787582737.181871',
  disposition: 'ANSWERED',
  direction: 'Out Call',
  billsec: '20',
  op: '21',
  phones: ['37443729201'],
  ended: true,
  startedAt: new Date('2026-08-24T17:30:30.000Z'),
};

describe('matchHistoryToPendingCall', () => {
  it('matches an ended history row to the click-to-call phone', () => {
    const match = matchHistoryToPendingCall([ENDED], {
      phoneE164: '+37443729201',
      createdAt: new Date('2026-08-24T17:30:22.000Z'),
      now: new Date('2026-08-24T17:32:00.000Z'),
    });
    expect(match?.uid).toBe('1787582737.181871');
  });

  it('ignores in-progress rows and other numbers', () => {
    const match = matchHistoryToPendingCall(
      [
        { ...ENDED, ended: false },
        { ...ENDED, uid: 'other', phones: ['37455010109'] },
      ],
      {
        phoneE164: '+37443729201',
        createdAt: new Date('2026-08-24T17:30:22.000Z'),
        now: new Date('2026-08-24T17:32:00.000Z'),
      },
    );
    expect(match).toBeNull();
  });

  it('prefers the Out Call CDR over a same-number Local Call', () => {
    const rows = parseAtsHistoryBody({
      docs: [
        {
          uniqueid: '1787593409.877072',
          linkedid: '1787593409.877071',
          start: '2026-08-24T21:43:29Z',
          endz: '2026-08-24T21:43:52Z',
          duration: 17,
          disposition: 'ANSWERED',
          status: 'Local Call',
          destination: '3120372-77961718',
          extension: '-37443729201',
        },
        {
          uniqueid: '1787593409.877071',
          linkedid: '1787593409.877071',
          start: '2026-08-24T21:43:29Z',
          endz: '2026-08-24T21:43:52Z',
          duration: 17,
          disposition: 'ANSWERED',
          status: 'Out Call',
          ext_num: '37444343000',
          destination: '-043729201',
          extension: '-11',
        },
      ],
    });
    const match = matchHistoryToPendingCall(rows, {
      phoneE164: '+37443729201',
      createdAt: new Date('2026-08-24T17:43:29.212Z'),
      now: new Date('2026-08-24T17:44:00.000Z'),
    });
    expect(match?.uid).toBe('1787593409.877071');
    expect(match?.direction).toBe('Out Call');
  });

  it('shifts a Yerevan-as-UTC start so a live peek is not in the future', () => {
    const match = matchHistoryToPendingCall(
      [
        {
          ...ENDED,
          uid: '1787593409.877071',
          phones: ['043729201'],
          startedAt: new Date('2026-08-24T17:43:29.000Z'),
        },
      ],
      {
        phoneE164: '+37443729201',
        createdAt: new Date('2026-08-24T13:43:29.212Z'),
        now: new Date('2026-08-24T13:44:00.000Z'),
      },
    );
    expect(match?.uid).toBe('1787593409.877071');
  });
});
