'use client';

import { DetailSheetSection, InlineField } from '@/components/shared';
import { KpiGateBandEditor } from '@/features/my-company/kpi-policies/kpi-gate-band-editor';
import { KpiPolicyCapField } from '@/features/my-company/kpi-policies/kpi-policy-cap-field';
import { KpiPolicyScorecardMetrics } from '@/features/my-company/kpi-policies/kpi-policy-scorecard-metrics';
import { DEFAULT_SALES_SCORECARD_METRICS } from '@/features/my-company/kpi-policies/kpi-scorecard-metrics.types';
import { KpiPolicyTargetField } from '@/features/my-company/kpi-policies/kpi-policy-target-field';
import type { KpiPolicyRow, KpiPolicyStatus } from '@/lib/api/kpi-policies';
import type { KpiPolicyDraft } from './kpi-policy-draft';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export function KpiPolicyFields({
  policy,
  draft,
  saving,
  onChange,
}: {
  policy: KpiPolicyRow | null;
  draft: KpiPolicyDraft;
  saving: boolean;
  onChange: (next: Partial<KpiPolicyDraft>) => void;
}) {
  return (
    <div className="space-y-4">
      <PolicySection policy={policy} draft={draft} saving={saving} onChange={onChange} />
      <LimitsSection draft={draft} saving={saving} onChange={onChange} />
      <DetailSheetSection title="Payout steps" outlined>
        <p className="text-muted-foreground mb-3 text-xs leading-relaxed">
          Checked from the top. The first step the result reaches is the one that pays.
        </p>
        <KpiGateBandEditor
          bands={draft.bands}
          disabled={saving}
          onChange={(bands) => onChange({ bands })}
        />
      </DetailSheetSection>
      <KpiPolicyScorecardMetrics
        metrics={
          policy != null && policy.scorecardMetrics.length > 0
            ? policy.scorecardMetrics
            : DEFAULT_SALES_SCORECARD_METRICS
        }
      />
    </div>
  );
}

function PolicySection({
  policy,
  draft,
  saving,
  onChange,
}: {
  policy: KpiPolicyRow | null;
  draft: KpiPolicyDraft;
  saving: boolean;
  onChange: (next: Partial<KpiPolicyDraft>) => void;
}) {
  return (
    <DetailSheetSection title="Policy" outlined>
      <div className="grid gap-3">
        <InlineField
          variant="controlled"
          label="Name"
          value={draft.name}
          placeholder="Seller KPI gate Q2"
          disabled={saving}
          onValueChange={(name) => onChange({ name })}
        />
        {policy == null ? null : (
          <InlineField
            variant="controlled"
            type="select"
            label="Status"
            value={draft.status}
            options={STATUS_OPTIONS}
            disabled={saving}
            onValueChange={(status) => onChange({ status: status as KpiPolicyStatus })}
          />
        )}
        {policy == null ? null : (
          <p className="text-muted-foreground text-xs">
            {assignmentLabel(policy.linkedProfileCount)}
          </p>
        )}
      </div>
    </DetailSheetSection>
  );
}

function LimitsSection({
  draft,
  saving,
  onChange,
}: {
  draft: KpiPolicyDraft;
  saving: boolean;
  onChange: (next: Partial<KpiPolicyDraft>) => void;
}) {
  return (
    <DetailSheetSection title="Limits" outlined>
      <div className="grid gap-3">
        <KpiPolicyCapField
          value={draft.capMultiplier}
          disabled={saving}
          onChange={(capMultiplier) => onChange({ capMultiplier })}
        />
        <KpiPolicyTargetField
          value={draft.targetAmount}
          disabled={saving}
          onChange={(targetAmount) => onChange({ targetAmount })}
        />
      </div>
    </DetailSheetSection>
  );
}

function assignmentLabel(count: number): string {
  if (count === 0) return 'Not assigned';
  if (count === 1) return '1 salary';
  return `${count} salaries`;
}
