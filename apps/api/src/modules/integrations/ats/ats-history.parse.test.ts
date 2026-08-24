import { describe, expect, it } from 'vitest';
import { parseAtsHistoryBody } from './ats-history.parse';

describe('parseAtsHistoryBody', () => {
  it('reads uniqueid, duration and endz from a data list', () => {
    const rows = parseAtsHistoryBody({
      data: [
        {
          uniqueid: '1787582737.181871',
          start: '2026-08-24 21:30:22',
          endz: '2026-08-24 21:32:02',
          duration: '20',
          disposition: 'ANSWERED',
          in_num: '37443729201',
          extension: '21',
        },
      ],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      uid: '1787582737.181871',
      billsec: '20',
      disposition: 'ANSWERED',
      op: '21',
      ended: true,
    });
    expect(rows[0]?.phones).toContain('37443729201');
    expect(rows[0]?.startedAt?.toISOString()).toBe('2026-08-24T17:30:22.000Z');
  });

  it('reads Solr docs and Yerevan timestamps marked as Z', () => {
    const rows = parseAtsHistoryBody({
      numFound: 2,
      docs: [
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

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      uid: '1787593409.877071',
      billsec: '17',
      direction: 'Out Call',
      op: '11',
      ended: true,
    });
    expect(rows[0]?.phones).toContain('043729201');
    expect(rows[0]?.startedAt?.toISOString()).toBe('2026-08-24T17:43:29.000Z');
  });

  it('treats a ringing row without end or disposition as not ended', () => {
    const rows = parseAtsHistoryBody([
      { uniqueid: 'open-1', in_num: '37443729201', start: '2026-08-24 21:30:22' },
    ]);
    expect(rows[0]?.ended).toBe(false);
  });
});
