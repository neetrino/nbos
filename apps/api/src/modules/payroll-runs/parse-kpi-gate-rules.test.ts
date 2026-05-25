import { describe, expect, it } from 'vitest';

import { parseKpiGateRules } from './parse-kpi-gate-rules';
import { DEFAULT_KPI_GATE_RULES } from './default-kpi-gate-rules';

describe('parseKpiGateRules', () => {
  it('returns default on invalid JSON', () => {
    expect(parseKpiGateRules(null)).toEqual(DEFAULT_KPI_GATE_RULES);
  });

  it('parses and sorts bands descending', () => {
    const rules = parseKpiGateRules({
      bands: [
        { minAttainmentPct: 0, payoutFactor: 0 },
        { minAttainmentPct: 80, payoutFactor: 1 },
      ],
    });
    expect(rules.bands[0]?.minAttainmentPct).toBe(80);
  });
});
