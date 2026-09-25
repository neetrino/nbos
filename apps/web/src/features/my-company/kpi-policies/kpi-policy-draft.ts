import {
  DEFAULT_GATE_BAND_DRAFTS,
  parseDraftsToRules,
  rulesToDrafts,
  type KpiGateBandDraft,
} from '@/features/my-company/kpi-policies/kpi-gate-band-utils';
import { parseCapMultiplierDraft } from '@/features/my-company/kpi-policies/kpi-policy-cap-field';
import { KPI_POLICY_CAP_MULTIPLIER_DEFAULT } from '@/features/my-company/kpi-policies/kpi-policy-cap.constants';
import { parseTargetAmountDraft } from '@/features/my-company/kpi-policies/kpi-policy-target-field';
import { DEFAULT_SALES_SCORECARD_METRICS } from '@/features/my-company/kpi-policies/kpi-scorecard-metrics.types';
import { kpiPoliciesApi, type KpiPolicyRow, type KpiPolicyStatus } from '@/lib/api/kpi-policies';

export type KpiPolicyDraft = {
  name: string;
  status: KpiPolicyStatus;
  capMultiplier: string;
  targetAmount: string;
  bands: KpiGateBandDraft[];
};

export function draftFromPolicy(policy: KpiPolicyRow | null): KpiPolicyDraft {
  return {
    name: policy?.name ?? '',
    status: policy?.status ?? 'ACTIVE',
    capMultiplier:
      policy?.bonusCapBaseSalaryMultiplier || String(KPI_POLICY_CAP_MULTIPLIER_DEFAULT),
    targetAmount: policy?.targetAmount ?? '',
    bands: policy == null ? DEFAULT_GATE_BAND_DRAFTS : rulesToDrafts(policy.gateRules),
  };
}

export function isKpiPolicyDraftDirty(draft: KpiPolicyDraft, policy: KpiPolicyRow | null): boolean {
  const saved = draftFromPolicy(policy);
  return (
    draft.name !== saved.name ||
    draft.status !== saved.status ||
    draft.capMultiplier !== saved.capMultiplier ||
    draft.targetAmount !== saved.targetAmount ||
    bandKey(draft.bands) !== bandKey(saved.bands)
  );
}

/** Returns a message when the draft cannot be saved. */
export function kpiPolicyDraftError(draft: KpiPolicyDraft): string | null {
  if (draft.name.trim().length < 2) return 'Name needs at least 2 characters.';
  if (
    parseCapMultiplierDraft(draft.capMultiplier) == null ||
    parseDraftsToRules(draft.bands) == null
  ) {
    return 'Enter a ceiling from 1 to 3 and steps between 0 and 100.';
  }
  return null;
}

export async function persistKpiPolicy(
  policy: KpiPolicyRow | null,
  draft: KpiPolicyDraft,
): Promise<KpiPolicyRow> {
  const gateRules = parseDraftsToRules(draft.bands);
  const cap = parseCapMultiplierDraft(draft.capMultiplier);
  if (gateRules == null || cap == null) {
    throw new Error('Invalid KPI policy draft');
  }
  const shared = {
    name: draft.name.trim(),
    gateRules,
    targetAmount: parseTargetAmountDraft(draft.targetAmount),
    targetSource: 'MANUAL_POLICY' as const,
    resultSource: 'SALES_PAYMENTS' as const,
    bonusCapBaseSalaryMultiplier: cap,
  };
  if (policy == null) {
    return kpiPoliciesApi.create({
      ...shared,
      scorecardMetrics: DEFAULT_SALES_SCORECARD_METRICS,
      scope: 'COMPANY',
    });
  }
  return kpiPoliciesApi.update(policy.id, { ...shared, status: draft.status });
}

function bandKey(bands: readonly KpiGateBandDraft[]): string {
  return bands.map((band) => `${band.minAttainmentPct}|${band.payoutPercent}`).join(';');
}
