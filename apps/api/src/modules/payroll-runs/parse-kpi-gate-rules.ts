import type { KpiGateBand, KpiGateRules } from './kpi-gate-rules.types';
import { DEFAULT_KPI_GATE_RULES } from './default-kpi-gate-rules';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseBand(raw: unknown): KpiGateBand | null {
  if (!isRecord(raw)) {
    return null;
  }
  const minAttainmentPct = raw.minAttainmentPct;
  const payoutFactor = raw.payoutFactor;
  if (
    typeof minAttainmentPct !== 'number' ||
    typeof payoutFactor !== 'number' ||
    !Number.isFinite(minAttainmentPct) ||
    !Number.isFinite(payoutFactor) ||
    minAttainmentPct < 0 ||
    minAttainmentPct > 100 ||
    payoutFactor < 0 ||
    payoutFactor > 1
  ) {
    return null;
  }
  return { minAttainmentPct, payoutFactor };
}

/**
 * Parses `KpiPolicy.gateRules` JSON. Returns default bands when shape is invalid.
 */
export function parseKpiGateRules(value: unknown): KpiGateRules {
  if (!isRecord(value) || !Array.isArray(value.bands)) {
    return DEFAULT_KPI_GATE_RULES;
  }
  const bands = value.bands.map(parseBand).filter((b): b is KpiGateBand => b != null);
  if (bands.length === 0) {
    return DEFAULT_KPI_GATE_RULES;
  }
  return {
    bands: [...bands].sort((a, b) => b.minAttainmentPct - a.minAttainmentPct),
  };
}
