import { describe, expect, it } from 'vitest';
import { RDAP_LANE_KEY, groupByRegistryLane, runRegistryLanes } from './registry-lanes';

const noPause = async (): Promise<void> => undefined;

describe('registry lanes', () => {
  it('groups WHOIS domains by host and the rest into the RDAP lane', () => {
    const lanes = groupByRegistryLane([
      { domainName: 'a.am' },
      { domainName: 'b.am' },
      { domainName: 'c.com' },
      { domainName: 'd.center' },
      { domainName: 'e.io' },
    ]);
    expect(lanes.get('whois:whois.amnic.net')?.map((item) => item.domainName)).toEqual([
      'a.am',
      'b.am',
    ]);
    expect(lanes.get('whois:whois.verisign-grs.com')).toHaveLength(1);
    expect(lanes.get(RDAP_LANE_KEY)?.map((item) => item.domainName)).toEqual(['d.center', 'e.io']);
  });

  it('runs one WHOIS host serially while other lanes run in parallel', async () => {
    let active = 0;
    let activeAmnic = 0;
    let maxActiveAmnic = 0;
    let maxActive = 0;
    const items = ['a.am', 'b.am', 'c.am', 'x.com', 'y.io'].map((domainName) => ({ domainName }));
    await runRegistryLanes(
      items,
      async (item) => {
        const amnic = item.domainName.endsWith('.am');
        active += 1;
        if (amnic) activeAmnic += 1;
        maxActive = Math.max(maxActive, active);
        maxActiveAmnic = Math.max(maxActiveAmnic, activeAmnic);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        if (amnic) activeAmnic -= 1;
      },
      { deadlineAt: Number.MAX_SAFE_INTEGER, pause: noPause },
    );
    expect(maxActiveAmnic).toBe(1);
    expect(maxActive).toBeGreaterThan(1);
  });

  it('stops taking new items after the deadline but always runs the first one', async () => {
    let clock = 0;
    const seen: string[] = [];
    await runRegistryLanes(
      ['a.am', 'b.am', 'c.am'].map((domainName) => ({ domainName })),
      async (item) => {
        seen.push(item.domainName);
        clock += 10;
      },
      { deadlineAt: 5, now: () => clock, pause: noPause },
    );
    expect(seen).toEqual(['a.am']);
  });

  it('pauses between queries in the same lane', async () => {
    const pauses: number[] = [];
    await runRegistryLanes(
      ['a.am', 'b.am'].map((domainName) => ({ domainName })),
      async () => undefined,
      {
        deadlineAt: Number.MAX_SAFE_INTEGER,
        gapMs: 7,
        pause: async (ms) => {
          pauses.push(ms);
        },
      },
    );
    expect(pauses).toEqual([7]);
  });
});
