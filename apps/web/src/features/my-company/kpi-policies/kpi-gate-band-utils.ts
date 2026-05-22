import type { KpiGateBand, KpiGateRules } from '@/lib/api/kpi-policies';

export type KpiGateBandDraft = {
  minAttainmentPct: string;
  payoutPercent: string;
};

export const DEFAULT_GATE_BAND_DRAFTS: KpiGateBandDraft[] = [
  { minAttainmentPct: '70', payoutPercent: '100' },
  { minAttainmentPct: '50', payoutPercent: '50' },
  { minAttainmentPct: '0', payoutPercent: '0' },
];

export function rulesToDrafts(rules: KpiGateRules): KpiGateBandDraft[] {
  return [...rules.bands]
    .sort((a, b) => b.minAttainmentPct - a.minAttainmentPct)
    .map((b) => ({
      minAttainmentPct: String(b.minAttainmentPct),
      payoutPercent: String(Math.round(b.payoutFactor * 100)),
    }));
}

export function parseDraftsToRules(drafts: readonly KpiGateBandDraft[]): KpiGateRules | null {
  const bands: KpiGateBand[] = [];
  for (const row of drafts) {
    const minAttainmentPct = Number.parseFloat(row.minAttainmentPct);
    const payoutPercent = Number.parseFloat(row.payoutPercent);
    if (
      !Number.isFinite(minAttainmentPct) ||
      !Number.isFinite(payoutPercent) ||
      minAttainmentPct < 0 ||
      minAttainmentPct > 100 ||
      payoutPercent < 0 ||
      payoutPercent > 100
    ) {
      return null;
    }
    bands.push({
      minAttainmentPct,
      payoutFactor: payoutPercent / 100,
    });
  }
  if (bands.length === 0) {
    return null;
  }
  return {
    bands: [...bands].sort((a, b) => b.minAttainmentPct - a.minAttainmentPct),
  };
}
