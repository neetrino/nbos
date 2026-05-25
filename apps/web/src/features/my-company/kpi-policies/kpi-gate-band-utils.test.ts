import { describe, expect, it } from 'vitest';

import { parseDraftsToRules, rulesToDrafts } from './kpi-gate-band-utils';

describe('kpi gate band utils', () => {
  it('round-trips rules through drafts', () => {
    const rules = {
      bands: [
        { minAttainmentPct: 70, payoutFactor: 1 },
        { minAttainmentPct: 50, payoutFactor: 0.5 },
        { minAttainmentPct: 0, payoutFactor: 0 },
      ],
    };
    const parsed = parseDraftsToRules(rulesToDrafts(rules));
    expect(parsed?.bands[0]?.minAttainmentPct).toBe(70);
    expect(parsed?.bands[1]?.payoutFactor).toBe(0.5);
  });

  it('rejects invalid drafts', () => {
    expect(parseDraftsToRules([{ minAttainmentPct: 'x', payoutPercent: '50' }])).toBeNull();
  });
});
